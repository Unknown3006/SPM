const crypto = require('crypto');
const PaymentGatewayInterface = require('./gatewayInterface');

class RazorpayGateway extends PaymentGatewayInterface {
  constructor() {
    super();
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  isConfigured() {
    return Boolean(this.keyId && this.keySecret);
  }

  async createOrder(booking) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay keys not configured in environment variables');
    }

    // In a production or test environment with real SDK, razorpay.orders.create is called
    // Here we create standard Razorpay test order payload format
    const amountInPaise = Math.round(booking.priceBreakdown.total * 100);
    const orderId = `order_rzp_${Date.now()}`;

    return {
      gateway: 'Razorpay',
      orderId,
      amount: booking.priceBreakdown.total,
      amountInPaise,
      currency: 'INR',
      keyId: this.keyId,
      bookingId: booking.bookingId,
      status: 'created'
    };
  }

  async verifyPayment(payload) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay keys not configured');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, method = 'CARD' } = payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        success: false,
        gateway: 'Razorpay',
        failureReason: 'Missing Razorpay signature or payment ID'
      };
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return {
        success: true,
        gateway: 'Razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        method
      };
    } else {
      return {
        success: false,
        gateway: 'Razorpay',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        failureReason: 'Invalid payment signature'
      };
    }
  }

  async refund(payment, amount, reason = 'Customer cancellation') {
    const refundId = `rfnd_rzp_${Date.now()}`;
    return {
      success: true,
      gateway: 'Razorpay',
      refundId,
      paymentId: payment.gatewayPaymentId,
      amount,
      reason,
      status: 'PROCESSED'
    };
  }
}

module.exports = new RazorpayGateway();
