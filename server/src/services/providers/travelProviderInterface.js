/**
 * Travel Provider Base Interface
 */
class TravelProviderInterface {
  async searchHotels(query) {
    throw new Error('searchHotels() must be implemented');
  }

  async searchTransport(query) {
    throw new Error('searchTransport() must be implemented');
  }

  async getAvailability(type, id) {
    throw new Error('getAvailability() must be implemented');
  }
}

module.exports = TravelProviderInterface;
