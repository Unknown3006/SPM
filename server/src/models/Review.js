const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true // Exactly one review per booking
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourPackage',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

// Post-save hook to recalculate package ratingAverage and ratingCount
reviewSchema.post('save', async function () {
  const TourPackage = mongoose.model('TourPackage');
  const stats = await this.constructor.aggregate([
    { $match: { package: this.package } },
    {
      $group: {
        _id: '$package',
        avgRating: { $avg: '$rating' },
        nRating: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await TourPackage.findByIdAndUpdate(this.package, {
      ratingAverage: Math.round(stats[0].avgRating * 10) / 10,
      ratingCount: stats[0].nRating
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
