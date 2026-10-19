const TourPackage = require('../models/TourPackage');
const Hotel = require('../models/Hotel');
const TransportService = require('../models/TransportService');

/**
 * Checks and reserves seats or rooms for a pending booking.
 * Throws an error if insufficient availability.
 */
const reserveInventory = async ({ itemType, itemId, count, travelDate }) => {
  const quantity = Math.max(1, count);

  if (itemType === 'package') {
    const pkg = await TourPackage.findById(itemId);
    if (!pkg) throw new Error('Tour package not found');

    if (pkg.availableDates && pkg.availableDates.length > 0 && travelDate) {
      const targetDate = new Date(travelDate).toISOString().split('T')[0];
      const dateSlot = pkg.availableDates.find(
        (d) => new Date(d.date).toISOString().split('T')[0] === targetDate
      );

      if (dateSlot) {
        if (dateSlot.seatsLeft < quantity) {
          throw new Error(`Only ${dateSlot.seatsLeft} seat(s) remaining for ${targetDate}. Requested: ${quantity}`);
        }
        // Decrement seats atomically
        dateSlot.seatsLeft -= quantity;
        await pkg.save();
      } else if (pkg.maxGroupSize && quantity > pkg.maxGroupSize) {
        throw new Error(`Group size exceeds package limit of ${pkg.maxGroupSize} travellers`);
      }
    }
  } else if (itemType === 'hotel') {
    const hotel = await Hotel.findById(itemId);
    if (!hotel) throw new Error('Hotel not found');

    if (hotel.availableRooms < quantity) {
      throw new Error(`Only ${hotel.availableRooms} room(s) available. Requested: ${quantity}`);
    }

    hotel.availableRooms -= quantity;
    await hotel.save();
  } else if (itemType === 'transport') {
    const transport = await TransportService.findById(itemId);
    if (!transport) throw new Error('Transport service not found');

    if (transport.seatsAvailable < quantity) {
      throw new Error(`Only ${transport.seatsAvailable} seat(s) available. Requested: ${quantity}`);
    }

    transport.seatsAvailable -= quantity;
    await transport.save();
  }
};

/**
 * Releases seats or rooms back to inventory when a booking is cancelled, fails, or expires.
 */
const releaseInventory = async ({ itemType, itemId, count, travelDate }) => {
  const quantity = Math.max(1, count);

  try {
    if (itemType === 'package') {
      const pkg = await TourPackage.findById(itemId);
      if (pkg && pkg.availableDates && travelDate) {
        const targetDate = new Date(travelDate).toISOString().split('T')[0];
        const dateSlot = pkg.availableDates.find(
          (d) => new Date(d.date).toISOString().split('T')[0] === targetDate
        );
        if (dateSlot) {
          dateSlot.seatsLeft += quantity;
          await pkg.save();
        }
      }
    } else if (itemType === 'hotel') {
      const hotel = await Hotel.findById(itemId);
      if (hotel) {
        hotel.availableRooms += quantity;
        await hotel.save();
      }
    } else if (itemType === 'transport') {
      const transport = await TransportService.findById(itemId);
      if (transport) {
        transport.seatsAvailable += quantity;
        await transport.save();
      }
    }
  } catch (err) {
    console.error(`[ReservationService] Failed to release inventory: ${err.message}`);
  }
};

/**
 * Cleanup expired pending bookings older than 15 minutes.
 * Releases inventory and marks booking as CANCELLED.
 */
const cleanupExpiredPendingBookings = async () => {
  const Booking = require('../models/Booking');
  const now = new Date();

  const expiredBookings = await Booking.find({
    status: 'PENDING_PAYMENT',
    paymentExpiresAt: { $lt: now }
  });

  for (const booking of expiredBookings) {
    const itemId = booking.package || booking.hotel || booking.transport;
    await releaseInventory({
      itemType: booking.itemType,
      itemId,
      count: booking.numberOfTravellers,
      travelDate: booking.travelDate
    });

    booking.status = 'CANCELLED';
    booking.cancellation = {
      reason: 'Auto-cancelled: Payment window (15 mins) expired',
      cancelledAt: now,
      refundPercentage: 0,
      refundAmount: 0,
      refundStatus: 'NONE'
    };
    booking.statusHistory.push({
      status: 'CANCELLED',
      changedAt: now,
      note: 'Auto-cancelled due to expired payment window'
    });
    await booking.save();
  }

  return expiredBookings.length;
};

module.exports = {
  reserveInventory,
  releaseInventory,
  cleanupExpiredPendingBookings
};
