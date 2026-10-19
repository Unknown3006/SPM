const mongoose = require('mongoose');

const transportServiceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['flight', 'train', 'bus'],
      required: [true, 'Please specify transport type'],
      index: true
    },
    operator: {
      type: String,
      required: [true, 'Please provide transport operator name'],
      trim: true
    },
    from: {
      type: String,
      required: [true, 'Please provide departure location'],
      trim: true,
      index: true
    },
    to: {
      type: String,
      required: [true, 'Please provide arrival destination'],
      trim: true,
      index: true
    },
    departureTime: {
      type: String,
      required: [true, 'Please provide departure time (e.g. 08:30 AM)']
    },
    arrivalTime: {
      type: String,
      required: [true, 'Please provide arrival time (e.g. 11:45 AM)']
    },
    duration: {
      type: String,
      default: '3h 15m'
    },
    price: {
      type: Number,
      required: [true, 'Please provide ticket price in INR'],
      min: 0,
      index: true
    },
    seatsAvailable: {
      type: Number,
      required: [true, 'Please provide seats available'],
      min: 0,
      default: 40
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

transportServiceSchema.index({ from: 1, to: 1, type: 1 });

module.exports = mongoose.model('TransportService', transportServiceSchema);
