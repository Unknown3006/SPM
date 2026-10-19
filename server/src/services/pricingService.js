const PromotionalOffer = require('../models/PromotionalOffer');

/**
 * Calculates itemized pricing strictly on the server.
 * Never trust prices sent by the client.
 *
 * @param {Object} params
 * @param {string} params.itemType 'package' | 'hotel' | 'transport'
 * @param {Object} params.item Mongoose document (TourPackage, Hotel, or TransportService)
 * @param {number} params.numberOfTravellers Number of passengers or guests
 * @param {string} [params.offerCode] Optional promo coupon code
 * @param {number} [params.numberOfNights=1] For hotel bookings
 * @param {string} [params.roomType] For hotel bookings
 * @returns {Promise<Object>} { unitPrice, basePrice, discount, discountDetails, taxes, total, offerValid, offerMessage }
 */
const calculatePricing = async ({
  itemType,
  item,
  numberOfTravellers = 1,
  offerCode = null,
  numberOfNights = 1,
  roomType = null
}) => {
  let unitPrice = 0;

  if (itemType === 'package') {
    unitPrice = Number(item.price) || 0;
  } else if (itemType === 'hotel') {
    if (roomType && item.roomTypes && item.roomTypes.length > 0) {
      const matchedRoom = item.roomTypes.find(
        (r) => r.type && r.type.toLowerCase() === roomType.toLowerCase()
      );
      if (matchedRoom) {
        unitPrice = matchedRoom.pricePerNight * Math.max(1, numberOfNights);
      } else {
        unitPrice = (Number(item.pricePerNight) || 0) * Math.max(1, numberOfNights);
      }
    } else {
      unitPrice = (Number(item.pricePerNight) || 0) * Math.max(1, numberOfNights);
    }
  } else if (itemType === 'transport') {
    unitPrice = Number(item.price) || 0;
  } else {
    throw new Error(`Unsupported itemType: ${itemType}`);
  }

  const basePrice = unitPrice * Math.max(1, numberOfTravellers);

  let discount = 0;
  let discountDetails = {
    code: null,
    discountType: null,
    discountValue: 0
  };
  let offerValid = false;
  let offerMessage = '';

  if (offerCode && offerCode.trim()) {
    const cleanCode = offerCode.trim().toUpperCase();
    const offer = await PromotionalOffer.findOne({ code: cleanCode });
    const now = new Date();

    if (!offer) {
      offerMessage = `Promo code '${cleanCode}' does not exist`;
    } else if (!offer.isActive) {
      offerMessage = `Promo code '${cleanCode}' is currently inactive`;
    } else if (now < offer.validFrom || now > offer.validTo) {
      offerMessage = `Promo code '${cleanCode}' has expired or is not yet valid`;
    } else if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      offerMessage = `Promo code '${cleanCode}' has reached its maximum usage limit`;
    } else if (basePrice < offer.minAmount) {
      offerMessage = `Promo code '${cleanCode}' requires a minimum booking amount of ₹${offer.minAmount}`;
    } else {
      offerValid = true;
      if (offer.discountType === 'PERCENT') {
        const rawDiscount = Math.round((basePrice * offer.discountValue) / 100);
        discount = offer.maxDiscount ? Math.min(rawDiscount, offer.maxDiscount) : rawDiscount;
      } else if (offer.discountType === 'FLAT') {
        discount = Math.min(offer.discountValue, basePrice);
      }

      discountDetails = {
        code: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue
      };
      offerMessage = `Coupon '${offer.code}' applied successfully!`;
    }
  }

  // 5% tax applied on the discounted amount
  const taxableAmount = Math.max(0, basePrice - discount);
  const taxes = Math.round(taxableAmount * 0.05 * 100) / 100;
  const total = Math.round((taxableAmount + taxes) * 100) / 100;

  return {
    unitPrice,
    basePrice,
    discount,
    discountDetails,
    taxes,
    total,
    offerValid,
    offerMessage
  };
};

module.exports = {
  calculatePricing
};
