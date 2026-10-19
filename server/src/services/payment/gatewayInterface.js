/**
 * Base Interface / Contract for Payment Gateways.
 */
class PaymentGatewayInterface {
  /**
   * Creates an order with the gateway.
   * @param {Object} booking Mongoose Booking document
   * @returns {Promise<{ orderId: string, amount: number, currency: string, keyId?: string }>}
   */
  async createOrder(booking) {
    throw new Error('createOrder() must be implemented by payment gateway provider');
  }

  /**
   * Verifies the payment callback / payload.
   * @param {Object} payload Payment verification payload
   * @returns {Promise<{ success: boolean, paymentId: string, orderId: string, method: string, failureReason?: string }>}
   */
  async verifyPayment(payload) {
    throw new Error('verifyPayment() must be implemented by payment gateway provider');
  }

  /**
   * Processes a refund via the gateway.
   * @param {Object} payment Mongoose Payment document
   * @param {number} amount Refund amount in INR
   * @param {string} reason Reason for refund
   * @returns {Promise<{ success: boolean, refundId: string, amount: number }>}
   */
  async refund(payment, amount, reason) {
    throw new Error('refund() must be implemented by payment gateway provider');
  }
}

module.exports = PaymentGatewayInterface;
