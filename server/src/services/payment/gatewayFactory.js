const mockGateway = require('./mockGateway');
const razorpayGateway = require('./razorpayGateway');

/**
 * Returns the active payment gateway instance.
 * Defaults to MockGateway for 100% offline prototype demo without paid credentials.
 */
const getPaymentGateway = (preferredGateway = null) => {
  if (preferredGateway === 'Razorpay' && razorpayGateway.isConfigured()) {
    return razorpayGateway;
  }
  return mockGateway;
};

module.exports = {
  getPaymentGateway,
  mockGateway,
  razorpayGateway
};
