const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide hotel name'],
      trim: true,
      maxlength: 150
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
      index: true
    },
    address: {
      type: String,
      required: [true, 'Please provide hotel address']
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please provide price per night in INR'],
      min: 0,
      index: true
    },
    roomTypes: {
      type: [String],
      default: ['Deluxe Room', 'Executive Suite']
    },
    amenities: {
      type: [String],
      default: ['Free WiFi', 'Air Conditioning', 'Breakfast Included', 'Swimming Pool']
    },
    images: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      default: 4.2,
      min: 1,
      max: 5
    },
    availableRooms: {
      type: Number,
      required: [true, 'Please specify available rooms'],
      default: 10,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

hotelSchema.index({ city: 'text', name: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);
