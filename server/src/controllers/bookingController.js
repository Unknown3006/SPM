const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const TourPackage = require('../models/TourPackage');
const Hotel = require('../models/Hotel');
const TransportService = require('../models/TransportService');
const User = require('../models/User');
const { calculatePricing } = require('../services/pricingService');
const { reserveInventory, releaseInventory, cleanupExpiredPendingBookings } = require('../services/reservationService');
const { calculateRefundPreview } = require('../services/cancellationService');
const { getPaymentGateway } = require('../services/payment/gatewayFactory');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

/**
 * Generate human-friendly Booking ID: TMS-YYYYMMDD-XXXX
 */
const generateBookingId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `TMS-${dateStr}-${randomSuffix}`;
};

/**
 * POST /api/v1/bookings
 * Create new booking in PENDING_PAYMENT status with server-side price calculation and seat reservation.
 */
const createBooking = async (req, res, next) => {
  try {
    const {
      itemType,
      itemId,
      travelDate,
      checkInDate,
      checkOutDate,
      roomType,
      travellers,
      offerCode
    } = req.body;

    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, message: 'itemType and itemId are required' });
    }

    if (!travellers || !Array.isArray(travellers) || travellers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one traveller is required' });
    }

    const numberOfTravellers = travellers.length;

    // Fetch the target item from database
    let item = null;
    let packageId = null;
    let hotelId = null;
    let transportId = null;
    let numberOfNights = 1;

    if (itemType === 'package') {
      item = await TourPackage.findById(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Tour package not found' });
      packageId = item._id;
    } else if (itemType === 'hotel') {
      item = await Hotel.findById(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Hotel not found' });
      hotelId = item._id;
      if (checkInDate && checkOutDate) {
        const inDate = new Date(checkInDate);
        const outDate = new Date(checkOutDate);
        const diffDays = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
        numberOfNights = Math.max(1, diffDays);
      }
    } else if (itemType === 'transport') {
      item = await TransportService.findById(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Transport service not found' });
      transportId = item._id;
    } else {
      return res.status(400).json({ success: false, message: `Invalid itemType: ${itemType}` });
    }

    // 1. Recompute price strictly on the server
    const pricing = await calculatePricing({
      itemType,
      item,
      numberOfTravellers,
      offerCode,
      numberOfNights,
      roomType
    });

    // 2. Reserve inventory (seats/rooms) atomically
    await reserveInventory({
      itemType,
      itemId: item._id,
      count: numberOfTravellers,
      travelDate: travelDate || checkInDate
    });

    // 3. Create Booking record
    let bookingId = generateBookingId();
    // Ensure uniqueness
    while (await Booking.findOne({ bookingId })) {
      bookingId = generateBookingId();
    }

    const booking = await Booking.create({
      bookingId,
      user: req.user._id,
      itemType,
      package: packageId,
      hotel: hotelId,
      transport: transportId,
      travelDate: travelDate ? new Date(travelDate) : null,
      checkInDate: checkInDate ? new Date(checkInDate) : null,
      checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
      roomType: roomType || null,
      travellers,
      numberOfTravellers,
      priceBreakdown: {
        unitPrice: pricing.unitPrice,
        basePrice: pricing.basePrice,
        discount: pricing.discount,
        discountDetails: pricing.discountDetails,
        taxes: pricing.taxes,
        total: pricing.total
      },
      appliedOfferCode: pricing.offerValid ? pricing.discountDetails.code : null,
      status: 'PENDING_PAYMENT',
      paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      statusHistory: [
        {
          status: 'PENDING_PAYMENT',
          changedAt: new Date(),
          changedBy: req.user._id,
          note: 'Booking initiated; awaiting customer payment'
        }
      ]
    });

    // Non-blocking notification
    sendEmail({
      to: req.user.email,
      subject: `Booking Reserved - ${booking.bookingId}`,
      text: `Your booking ${booking.bookingId} is reserved for 15 minutes. Total payable: ₹${pricing.total}. Please complete payment to confirm.`,
      eventType: 'BOOKING_CREATED',
      userId: req.user._id
    }).catch((err) => console.error(`[Email Notification Error] ${err.message}`));

    if (req.user.phone) {
      sendSMS({
        to: req.user.phone,
        message: `TMS: Booking ${booking.bookingId} reserved! Pay ₹${pricing.total} within 15 mins to confirm.`,
        eventType: 'BOOKING_CREATED',
        userId: req.user._id
      }).catch((err) => console.error(`[SMS Notification Error] ${err.message}`));
    }

    // Populate for response
    await booking.populate('package hotel transport');

    res.status(201).json({
      success: true,
      message: 'Booking reserved successfully. Please complete payment within 15 minutes.',
      booking,
      priceBreakdown: booking.priceBreakdown,
      offerMessage: pricing.offerMessage
    });
  } catch (error) {
    if (
      error.message &&
      (error.message.includes('seat') ||
        error.message.includes('remaining') ||
        error.message.includes('available') ||
        error.message.includes('limit') ||
        error.message.includes('exceed'))
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * GET /api/v1/bookings/mine
 * Retrieve current customer's booking history.
 */
const getMyBookings = async (req, res, next) => {
  try {
    // Run cleanup for expired bookings
    cleanupExpiredPendingBookings().catch((err) =>
      console.error(`[Cleanup Error] ${err.message}`)
    );

    const query = { user: req.user._id };
    if (req.query.includeHidden !== 'true') {
      query.hiddenByCustomer = { $ne: true };
    }

    const bookings = await Booking.find(query)
      .populate('package')
      .populate('hotel')
      .populate('transport')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/bookings/:id
 * Retrieve single booking by ID.
 * RBAC + Ownership check: Customer can only view their own booking.
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check by _id or bookingId
    const query = id.startsWith('TMS-') ? { bookingId: id } : { _id: id };
    const booking = await Booking.findOne(query)
      .populate('package')
      .populate('hotel')
      .populate('transport')
      .populate('user', 'name email phone')
      .populate('assignedAgent', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Customer can only view their own booking
    if (
      req.user.role === 'customer' &&
      booking.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/bookings/:id/cancel-preview
 * Shows customer the exact refund calculation before they confirm cancellation.
 */
const getCancelPreview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('TMS-') ? { bookingId: id } : { _id: id };
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
        message: 'Access denied: You cannot cancel another customer’s booking'
      });
    }

    // Look for successful payment
    const payment = await Payment.findOne({ booking: booking._id, status: 'SUCCESS' });
    const paidAmount = payment ? payment.amount : (booking.status === 'CONFIRMED' ? booking.priceBreakdown.total : 0);

    const preview = calculateRefundPreview(booking, paidAmount);

    res.status(200).json({
      success: true,
      bookingId: booking.bookingId,
      status: booking.status,
      preview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/bookings/:id/cancel
 * Cancel booking, release seats, and process tiered refund.
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const query = id.startsWith('TMS-') ? { bookingId: id } : { _id: id };
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
        message: 'Access denied: You cannot cancel another customer’s booking'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Completed trips cannot be cancelled' });
    }

    // Find successful payment if booking was confirmed
    const payment = await Payment.findOne({ booking: booking._id, status: 'SUCCESS' });
    const paidAmount = payment ? payment.amount : (booking.status === 'CONFIRMED' ? booking.priceBreakdown.total : 0);

    const refundPreview = calculateRefundPreview(booking, paidAmount);
    let refundPaymentRecord = null;

    // Process refund if payment exists and refund amount > 0
    if (payment && refundPreview.refundAmount > 0) {
      const gateway = getPaymentGateway(payment.gateway);
      await gateway.refund(payment, refundPreview.refundAmount, reason);

      refundPaymentRecord = await Payment.create({
        booking: booking._id,
        user: booking.user,
        amount: refundPreview.refundAmount,
        method: payment.method,
        gateway: payment.gateway,
        status: 'REFUNDED',
        gatewayPaymentId: `rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      });
    }

    // Release seats/rooms back to inventory
    const itemId = booking.package || booking.hotel || booking.transport;
    await releaseInventory({
      itemType: booking.itemType,
      itemId,
      count: booking.numberOfTravellers,
      travelDate: booking.travelDate || booking.checkInDate
    });

    // Update booking status
    booking.status = 'CANCELLED';
    booking.cancellation = {
      reason,
      cancelledAt: new Date(),
      refundPercentage: refundPreview.refundPercentage,
      refundAmount: refundPreview.refundAmount,
      refundStatus: refundPreview.refundAmount > 0 ? 'PROCESSED' : 'NONE',
      refundPaymentId: refundPaymentRecord ? refundPaymentRecord._id : null
    };

    booking.statusHistory.push({
      status: 'CANCELLED',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: `Cancelled. Refund ₹${refundPreview.refundAmount} (${refundPreview.refundPercentage}%). Reason: ${reason}`
    });

    await booking.save();

    // Notify user
    sendEmail({
      to: req.user.email,
      subject: `Booking Cancelled - ${booking.bookingId}`,
      text: `Your booking ${booking.bookingId} has been cancelled. Refund amount: ₹${refundPreview.refundAmount} (${refundPreview.refundPercentage}% refund).`,
      eventType: 'BOOKING_CANCELLED',
      userId: req.user._id
    }).catch((err) => console.error(`[Email Notification Error] ${err.message}`));

    if (req.user.phone) {
      sendSMS({
        to: req.user.phone,
        message: `TMS: Booking ${booking.bookingId} cancelled. Refund of ₹${refundPreview.refundAmount} processed.`,
        eventType: 'BOOKING_CANCELLED',
        userId: req.user._id
      }).catch((err) => console.error(`[SMS Notification Error] ${err.message}`));
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
      refund: refundPreview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/bookings/:id/hide
 * Soft-hides a completed or cancelled booking from customer's view.
 * Record is preserved for employee/admin reports.
 */
const hideBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('TMS-') ? { bookingId: id } : { _id: id };
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
        message: 'Access denied: You cannot modify another customer’s booking'
      });
    }

    if (booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled or completed bookings can be cleared from history'
      });
    }

    booking.hiddenByCustomer = true;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking hidden from your history'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/bookings (Employee & Admin)
 * Filter and view all bookings across the platform.
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('package', 'title destination durationDays')
        .populate('hotel', 'name city')
        .populate('transport', 'operator type from to')
        .populate('user', 'name email phone')
        .populate('assignedAgent', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/bookings/:id/status (Employee & Admin)
 * Update booking status (e.g. mark COMPLETED or CONFIRMED).
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note = '' } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    booking.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: note || `Status updated to ${status} by agent`
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/bookings/:id/assign (Employee & Admin)
 * Assign employee to booking.
 */
const assignBookingAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const agent = await User.findById(agentId);
    if (!agent || (agent.role !== 'employee' && agent.role !== 'admin')) {
      return res.status(400).json({ success: false, message: 'Invalid agent ID' });
    }

    booking.assignedAgent = agent._id;
    booking.statusHistory.push({
      status: booking.status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: `Assigned to ${agent.name} (${agent.email})`
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking assigned to ${agent.name}`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getCancelPreview,
  cancelBooking,
  hideBooking,
  getAllBookings,
  updateBookingStatus,
  assignBookingAgent
};
