const PaymentGatewayInterface = require('./gatewayInterface');

class MockGateway extends PaymentGatewayInterface {
  async createOrder(booking) {
    const orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      gateway: 'MockGateway',
      orderId,
      amount: booking.priceBreakdown.total,
      currency: 'INR',
      bookingId: booking.bookingId,
      status: 'created'
    };
  }

  async verifyPayment(payload) {
    const {
      orderId,
      paymentId,
      method = 'CARD',
      simulateSuccess = true,
      failureReason = 'Card declined by issuing bank (Simulated failure)'
    } = payload;

    if (simulateSuccess === false) {
      return {
        success: false,
        gateway: 'MockGateway',
        orderId,
        paymentId: paymentId || `pay_mock_fail_${Date.now()}`,
        method,
        failureReason
      };
    }

    const verifiedPaymentId = paymentId || `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      gateway: 'MockGateway',
      orderId,
      paymentId: verifiedPaymentId,
      method
    };
  }

  async refund(payment, amount, reason = 'Customer cancellation') {
    const refundId = `rfnd_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      gateway: 'MockGateway',
      refundId,
      paymentId: payment.gatewayPaymentId,
      amount,
      reason,
      status: 'PROCESSED'
    };
  }
}

module.exports = new MockGateway();
