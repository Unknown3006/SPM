import React from 'react';
import { Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';

/**
 * Reusable Price Breakdown Component.
 * Displays server-calculated fares, discounts, taxes, and total.
 */
const PriceBreakdown = ({
  unitPrice = 0,
  numberOfTravellers = 1,
  basePrice = 0,
  discount = 0,
  appliedOfferCode = null,
  taxes = 0,
  total = 0,
  className = ''
}) => {
  const calculatedBase = basePrice > 0 ? basePrice : unitPrice * numberOfTravellers;
  const calculatedTax = taxes > 0 ? taxes : Math.round((calculatedBase - discount) * 0.05 * 100) / 100;
  const calculatedTotal = total > 0 ? total : calculatedBase - discount + calculatedTax;

  return (
    <div
      data-testid="price-breakdown-card"
      className={`bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Price Summary
        </h4>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3 h-3" /> Best Price Guaranteed
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {/* Base Price Row */}
        <div className="flex justify-between text-slate-600">
          <span data-testid="base-price-label">
            Base Fare ({numberOfTravellers} {numberOfTravellers === 1 ? 'traveller' : 'travellers'} × ₹{unitPrice.toLocaleString('en-IN')})
          </span>
          <span data-testid="base-price-value" className="font-semibold text-slate-800">
            ₹{calculatedBase.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Discount Row (Conditional) */}
        {discount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
            <span className="flex items-center gap-1.5 font-medium" data-testid="discount-label">
              <Tag className="w-3.5 h-3.5" />
              Coupon {appliedOfferCode ? `'${appliedOfferCode}'` : 'Discount'}
            </span>
            <span data-testid="discount-value" className="font-bold">
              - ₹{discount.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Taxes Row */}
        <div className="flex justify-between text-slate-600">
          <span data-testid="tax-label">Statutory Taxes & GST (5%)</span>
          <span data-testid="tax-value" className="font-medium text-slate-700">
            ₹{calculatedTax.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Total Row */}
      <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-bold text-slate-900 block" data-testid="total-label">
            Total Amount Payable
          </span>
          <span className="text-[10px] text-slate-500">Includes all applicable taxes</span>
        </div>
        <div className="text-right">
          <span
            data-testid="total-amount-value"
            className="text-xl font-extrabold text-sky-600 tracking-tight"
          >
            ₹{calculatedTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {discount > 0 && (
        <div
          data-testid="savings-pill"
          className="text-center bg-emerald-100/60 text-emerald-800 text-[11px] font-semibold py-1 rounded-md"
        >
          You save ₹{discount.toLocaleString('en-IN')} on this booking!
        </div>
      )}
    </div>
  );
};

export default PriceBreakdown;
