import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PriceBreakdown from './PriceBreakdown';

describe('PriceBreakdown Component', () => {
  it('renders base price, taxes, and total correctly without discount', () => {
    render(
      <PriceBreakdown
        unitPrice={15000}
        numberOfTravellers={2}
        basePrice={30000}
        discount={0}
        taxes={1500}
        total={31500}
      />
    );

    expect(screen.getByTestId('base-price-label')).toHaveTextContent('Base Fare (2 travellers × ₹15,000)');
    expect(screen.getByTestId('base-price-value')).toHaveTextContent('₹30,000');
    expect(screen.getByTestId('tax-value')).toHaveTextContent('₹1,500');
    expect(screen.getByTestId('total-amount-value')).toHaveTextContent('₹31,500');
    expect(screen.queryByTestId('discount-label')).toBeNull();
  });

  it('renders discount row and savings pill when promo coupon is applied', () => {
    render(
      <PriceBreakdown
        unitPrice={20000}
        numberOfTravellers={1}
        basePrice={20000}
        discount={2000}
        appliedOfferCode="WELCOME10"
        taxes={900}
        total={18900}
      />
    );

    expect(screen.getByTestId('discount-label')).toHaveTextContent("Coupon 'WELCOME10'");
    expect(screen.getByTestId('discount-value')).toHaveTextContent('- ₹2,000');
    expect(screen.getByTestId('savings-pill')).toHaveTextContent('You save ₹2,000 on this booking!');
    expect(screen.getByTestId('total-amount-value')).toHaveTextContent('₹18,900');
  });
});
