/**
 * Cancellation & Refund Policy Configuration
 */
const REFUND_TIERS = {
  SEVEN_PLUS_DAYS: {
    minDays: 7,
    percentage: 90,
    description: '90% refund for cancellations made 7 or more days before travel'
  },
  THREE_TO_SIX_DAYS: {
    minDays: 3,
    percentage: 50,
    description: '50% refund for cancellations made between 3 and 6 days before travel'
  },
  LESS_THAN_THREE_DAYS: {
    minDays: 0,
    percentage: 0,
    description: 'No refund for cancellations made fewer than 3 days before travel'
  }
};

/**
 * Calculates refund preview without committing changes.
 *
 * @param {Object} booking Mongoose booking document
 * @param {number} paidAmount Total amount successfully paid
 * @returns {Object} { daysUntilTravel, refundPercentage, refundAmount, policyDescription }
 */
const calculateRefundPreview = (booking, paidAmount = 0) => {
  if (booking.status === 'PENDING_PAYMENT') {
    return {
      daysUntilTravel: 0,
      refundPercentage: 0,
      refundAmount: 0,
      policyDescription: 'Booking is pending payment; no payment was captured, so no refund is needed.'
    };
  }

  const travelDate = booking.travelDate || booking.checkInDate;
  if (!travelDate) {
    return {
      daysUntilTravel: 0,
      refundPercentage: 0,
      refundAmount: 0,
      policyDescription: 'Travel date not specified; standard zero refund applies.'
    };
  }

  const now = new Date();
  const travelDateTime = new Date(travelDate);

  // Calculate calendar days difference
  const diffTime = travelDateTime.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  const daysUntilTravel = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let tier = REFUND_TIERS.LESS_THAN_THREE_DAYS;
  if (daysUntilTravel >= REFUND_TIERS.SEVEN_PLUS_DAYS.minDays) {
    tier = REFUND_TIERS.SEVEN_PLUS_DAYS;
  } else if (daysUntilTravel >= REFUND_TIERS.THREE_TO_SIX_DAYS.minDays) {
    tier = REFUND_TIERS.THREE_TO_SIX_DAYS;
  }

  const baseRefundable = paidAmount > 0 ? paidAmount : booking.priceBreakdown?.total || 0;
  const refundAmount = Math.round((baseRefundable * tier.percentage) / 100);

  return {
    daysUntilTravel,
    refundPercentage: tier.percentage,
    refundAmount,
    policyDescription: tier.description,
    totalPaid: baseRefundable
  };
};

module.exports = {
  REFUND_TIERS,
  calculateRefundPreview
};
