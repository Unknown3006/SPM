const TravelProviderInterface = require('./travelProviderInterface');
const env = require('../../config/env');

class MockExternalProvider extends TravelProviderInterface {
  constructor() {
    super();
    this.name = 'GlobalGDS_ExternalAPI';
    this.simulateFailure = env.SIMULATE_PROVIDER_FAILURE;
    this.simulatedLatencyMs = 400; // Simulated external latency
  }

  setSimulateFailure(state) {
    this.simulateFailure = Boolean(state);
  }

  async _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async searchHotels(query = {}) {
    await this._delay(this.simulatedLatencyMs);

    if (this.simulateFailure) {
      const err = new Error('GlobalGDS 504 Gateway Timeout: External hotel provider unresponsive');
      err.code = 'EXTERNAL_PROVIDER_TIMEOUT';
      throw err;
    }

    // Returns mock third-party syndicated hotel inventory
    return {
      provider: this.name,
      fallbackUsed: false,
      timestamp: new Date().toISOString(),
      data: [
        {
          _id: 'ext-htl-01',
          name: 'The Grand Hyatt Regency Partner Hotel',
          city: query.city || 'Mumbai',
          address: 'International Airport Zone, Terminal 2',
          pricePerNight: 9500,
          roomTypes: ['King Deluxe', 'Club Suite'],
          amenities: ['Airport Shuttle', 'Spa', 'Infinity Pool', 'Complimentary Breakfast'],
          rating: 4.8,
          availableRooms: 8,
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
          ],
          isExternal: true
        }
      ]
    };
  }

  async searchTransport(query = {}) {
    await this._delay(this.simulatedLatencyMs);

    if (this.simulateFailure) {
      const err = new Error('GlobalGDS 503 Service Unavailable: Transport partner API connection lost');
      err.code = 'EXTERNAL_PROVIDER_UNAVAILABLE';
      throw err;
    }

    return {
      provider: this.name,
      fallbackUsed: false,
      timestamp: new Date().toISOString(),
      data: [
        {
          _id: 'ext-trn-01',
          type: query.type || 'flight',
          operator: 'StarAir Partner Express',
          from: query.from || 'Delhi',
          to: query.to || 'Goa',
          departureTime: '06:15 AM',
          arrivalTime: '08:45 AM',
          duration: '2h 30m',
          price: 5200,
          seatsAvailable: 14,
          isExternal: true
        }
      ]
    };
  }

  async getAvailability(type, id) {
    await this._delay(this.simulatedLatencyMs);
    if (this.simulateFailure) {
      throw new Error('External provider availability check timed out');
    }
    return { available: true, unitsLeft: 5 };
  }
}

module.exports = new MockExternalProvider();
