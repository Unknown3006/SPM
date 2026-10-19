const TravelProviderInterface = require('./travelProviderInterface');
const Hotel = require('../../models/Hotel');
const TransportService = require('../../models/TransportService');

class LocalProvider extends TravelProviderInterface {
  constructor() {
    super();
    this.name = 'LocalDatabaseProvider';
  }

  async searchHotels(query = {}) {
    const mongoQuery = { isActive: true };

    if (query.city) {
      mongoQuery.city = { $regex: query.city, $options: 'i' };
    }
    if (query.maxPrice) {
      mongoQuery.pricePerNight = { $lte: Number(query.maxPrice) };
    }
    if (query.minRating) {
      mongoQuery.rating = { $gte: Number(query.minRating) };
    }

    const sortOption = {};
    if (query.sortBy === 'price_asc') sortOption.pricePerNight = 1;
    else if (query.sortBy === 'price_desc') sortOption.pricePerNight = -1;
    else if (query.sortBy === 'rating') sortOption.rating = -1;
    else sortOption.createdAt = -1;

    const hotels = await Hotel.find(mongoQuery).sort(sortOption);
    return {
      provider: this.name,
      fallbackUsed: false,
      count: hotels.length,
      data: hotels
    };
  }

  async searchTransport(query = {}) {
    const mongoQuery = { isActive: true };

    if (query.type) {
      mongoQuery.type = query.type.toLowerCase();
    }
    if (query.from) {
      mongoQuery.from = { $regex: query.from, $options: 'i' };
    }
    if (query.to) {
      mongoQuery.to = { $regex: query.to, $options: 'i' };
    }
    if (query.maxPrice) {
      mongoQuery.price = { $lte: Number(query.maxPrice) };
    }

    const sortOption = {};
    if (query.sortBy === 'price_asc') sortOption.price = 1;
    else if (query.sortBy === 'price_desc') sortOption.price = -1;
    else sortOption.departureTime = 1;

    const services = await TransportService.find(mongoQuery).sort(sortOption);
    return {
      provider: this.name,
      fallbackUsed: false,
      count: services.length,
      data: services
    };
  }

  async getAvailability(type, id) {
    if (type === 'hotel') {
      const hotel = await Hotel.findById(id);
      return {
        available: hotel ? hotel.availableRooms > 0 : false,
        unitsLeft: hotel ? hotel.availableRooms : 0
      };
    } else if (type === 'transport') {
      const service = await TransportService.findById(id);
      return {
        available: service ? service.seatsAvailable > 0 : false,
        unitsLeft: service ? service.seatsAvailable : 0
      };
    }
    return { available: false, unitsLeft: 0 };
  }
}

module.exports = new LocalProvider();
