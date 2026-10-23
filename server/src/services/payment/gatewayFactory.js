const mockGateway = require('./mockGateway');
const razorpayGateway = require('./razorpayGateway');

/**
 * Returns the active payment gateway instance.
 * Returns razorpayGateway when preferredGateway is 'Razorpay'.
 * Defaults to mockGateway for offline test runner and automated Jest tests.
 */
const getPaymentGateway = (preferredGateway = null) => {
  if (preferredGateway === 'Razorpay' || preferredGateway === 'razorpay') {
    return razorpayGateway;
  }
  return mockGateway;
};

module.exports = {
  getPaymentGateway,
  mockGateway,
  razorpayGateway
};
