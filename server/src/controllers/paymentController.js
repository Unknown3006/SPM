const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const PromotionalOffer = require('../models/PromotionalOffer');
const { getPaymentGateway } = require('../services/payment/gatewayFactory');
const { generateInvoicePDF } = require('../services/pdfInvoiceService');
const { releaseInventory } = require('../services/reservationService');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

/**
 * Generate unique Invoice Number: INV-YYYYMMDD-XXXX
 */
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `INV-${dateStr}-${randomSuffix}`;
};

/**
 * POST /api/v1/payments/create-order
 * Initiates an order with the payment gateway abstraction.
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId, gatewayName } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const query = bookingId.startsWith('TMS-') ? { bookingId } : { _id: bookingId };
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership check
    if (
      req.user.role === 'customer' &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot pay for another customer’s booking'
      });
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({
        success: false,
        message: `Booking is in ${booking.status} status and cannot be paid for`
      });
    }

    // Check payment expiry
    if (new Date() > new Date(booking.paymentExpiresAt)) {
      // Auto cancel
      const itemId = booking.package || booking.hotel || booking.transport;
      await releaseInventory({
        itemType: booking.itemType,
        itemId,
        count: booking.numberOfTravellers,
        travelDate: booking.travelDate
      });
      booking.status = 'CANCELLED';
      booking.cancellation = {
        reason: 'Payment time window (15 mins) expired',
        cancelledAt: new Date(),
        refundPercentage: 0,
        refundAmount: 0,
        refundStatus: 'NONE'
      };
      await booking.save();

      return res.status(400).json({
        success: false,
        message: 'The 15-minute reservation window has expired. Please create a new booking.'
      });
    }

    const gateway = getPaymentGateway(gatewayName);
    const order = await gateway.createOrder(booking);

    // Create preliminary payment record
    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      amount: booking.priceBreakdown.total,
      gateway: order.gateway || 'MockGateway',
      gatewayOrderId: order.orderId,
      status: 'CREATED'
    });

    res.status(200).json({
      success: true,
      order,
      paymentId: payment._id,
      amount: booking.priceBreakdown.total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payments/verify
 * Verifies payment from gateway. Implements strict idempotency.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      orderId,
      paymentId,
      method = 'CARD',
      simulateSuccess = true,
      failureReason,
      gatewayName,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const query = bookingId.startsWith('TMS-') ? { bookingId } : { _id: bookingId };
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Determine target payment reference
    const targetGatewayPaymentId = razorpay_payment_id || paymentId;

    // --- IDEMPOTENCY CHECK ---
    // If this exact gateway payment ID has already been recorded and confirmed,
    // do NOT re-confirm, do NOT re-charge, and do NOT duplicate invoices!
    if (targetGatewayPaymentId) {
      const existingSuccess = await Payment.findOne({
        gatewayPaymentId: targetGatewayPaymentId,
        status: 'SUCCESS'
      });

      if (existingSuccess) {
        return res.status(200).json({
          success: true,
          idempotent: true,
          message: 'Payment already processed and verified successfully (Idempotent callback)',
          booking,
          payment: existingSuccess
        });
      }
    }

    // If booking is already confirmed, check if payment exists
    if (booking.status === 'CONFIRMED') {
      const existingPayment = await Payment.findOne({ booking: booking._id, status: 'SUCCESS' });
      return res.status(200).json({
        success: true,
        idempotent: true,
        message: 'Booking is already confirmed',
        booking,
        payment: existingPayment
      });
    }

    // Call payment gateway abstraction to verify
    const gateway = getPaymentGateway(gatewayName);
    const verifyResult = await gateway.verifyPayment({
      orderId: razorpay_order_id || orderId,
      paymentId: targetGatewayPaymentId,
      method,
      simulateSuccess,
      failureReason,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verifyResult.success) {
      // Payment failed
      const failedPayment = await Payment.create({
        booking: booking._id,
        user: booking.user,
        amount: booking.priceBreakdown.total,
        method,
        gateway: gateway.constructor.name || 'MockGateway',
        gatewayOrderId: orderId || razorpay_order_id,
        gatewayPaymentId: verifyResult.paymentId || `fail_${Date.now()}`,
        status: 'FAILED',
        failureReason: verifyResult.failureReason || 'Payment declined'
      });

      // Send failure notification
      const user = await User.findById(booking.user);
      if (user) {
        sendEmail({
          to: user.email,
          subject: `Payment Failed - Booking ${booking.bookingId}`,
          text: `Your payment of ₹${booking.priceBreakdown.total} for booking ${booking.bookingId} was unsuccessful. Reason: ${verifyResult.failureReason}. You can retry payment within your reservation window.`,
          eventType: 'PAYMENT_FAILED',
          userId: user._id
        }).catch((err) => console.error(`[Email Error] ${err.message}`));
      }

      return res.status(400).json({
        success: false,
        message: verifyResult.failureReason || 'Payment transaction was declined',
        payment: failedPayment
      });
    }

    // --- PAYMENT SUCCESS ---
    // Generate unique invoice number
    let invoiceNumber = generateInvoiceNumber();
    while (await Payment.findOne({ invoiceNumber })) {
      invoiceNumber = generateInvoiceNumber();
    }

    const successPayment = await Payment.create({
      booking: booking._id,
      user: booking.user,
      amount: booking.priceBreakdown.total,
      method: verifyResult.method || method,
      gateway: verifyResult.gateway || 'MockGateway',
      gatewayOrderId: verifyResult.orderId,
      gatewayPaymentId: verifyResult.paymentId,
      status: 'SUCCESS',
      invoiceNumber
    });

    // Update Booking status
    booking.status = 'CONFIRMED';
    booking.statusHistory.push({
      status: 'CONFIRMED',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: `Payment verified via ${verifyResult.method || method}. Reference: ${verifyResult.paymentId}. Invoice: ${invoiceNumber}`
    });
    await booking.save();

    // Increment offer usage if applicable
    if (booking.appliedOfferCode) {
      await PromotionalOffer.updateOne(
        { code: booking.appliedOfferCode },
        { $inc: { usedCount: 1 } }
      );
    }

    // Notifications
    const customer = await User.findById(booking.user);
    if (customer) {
      sendEmail({
        to: customer.email,
        subject: `Booking Confirmed! - ${booking.bookingId} [Invoice: ${invoiceNumber}]`,
        text: `Congratulations! Your booking ${booking.bookingId} has been confirmed. Total paid: ₹${booking.priceBreakdown.total}. Your official tax invoice ${invoiceNumber} is ready for download in your dashboard.`,
        eventType: 'PAYMENT_SUCCESS',
        userId: customer._id
      }).catch((err) => console.error(`[Email Error] ${err.message}`));

      if (customer.phone) {
        sendSMS({
          to: customer.phone,
          message: `TMS: Booking ${booking.bookingId} CONFIRMED! Paid ₹${booking.priceBreakdown.total}. Invoice: ${invoiceNumber}. Happy Journey!`,
          eventType: 'PAYMENT_SUCCESS',
          userId: customer._id
        }).catch((err) => console.error(`[SMS Error] ${err.message}`));
      }
    }

    // Notify employees
    sendEmail({
      to: 'agent@tms.test',
      subject: `[Internal Alert] New Confirmed Booking: ${booking.bookingId}`,
      text: `Customer ${customer ? customer.name : 'Unknown'} has confirmed booking ${booking.bookingId} for ₹${booking.priceBreakdown.total}.`,
      eventType: 'NEW_BOOKING_ALERT'
    }).catch((err) => console.error(`[Employee Alert Error] ${err.message}`));

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully!',
      booking,
      payment: successPayment,
      invoiceNumber
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payments/webhook
 * Public idempotent webhook endpoint for simulated or 3rd-party callbacks.
 */
const handlePaymentWebhook = async (req, res, next) => {
  try {
    const { event, payload } = req.body;
    console.log(`[Payment Webhook Received] Event: ${event}`);

    if (payload && payload.paymentId) {
      const existing = await Payment.findOne({
        gatewayPaymentId: payload.paymentId,
        status: 'SUCCESS'
      });
      if (existing) {
        return res.status(200).json({
          status: 'ok',
          idempotent: true,
          message: 'Webhook duplicate event ignored safely'
        });
      }
    }

    res.status(200).json({ status: 'ok', message: 'Webhook processed' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payments/:id/invoice
 * Generates and downloads PDF invoice.
 */
const downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by payment ID or invoiceNumber or bookingId
    let payment = null;
    if (id.startsWith('INV-')) {
      payment = await Payment.findOne({ invoiceNumber: id });
    } else if (id.startsWith('TMS-')) {
      const booking = await Booking.findOne({ bookingId: id });
      if (booking) {
        payment = await Payment.findOne({ booking: booking._id, status: 'SUCCESS' });
      }
    } else {
      payment = await Payment.findById(id);
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record or invoice not found' });
    }

    const booking = await Booking.findById(payment.booking)
      .populate('package')
      .populate('hotel')
      .populate('transport');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Associated booking not found' });
    }

    // Ownership check: Customer can only download their own invoice
    if (
      req.user.role === 'customer' &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot download an invoice for another customer'
      });
    }

    const user = await User.findById(booking.user);
    const pdfBuffer = await generateInvoicePDF(booking, payment, user || req.user);

    const filename = `Invoice-${payment.invoiceNumber || booking.bookingId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handlePaymentWebhook,
  downloadInvoice
};
