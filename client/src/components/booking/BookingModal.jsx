import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PriceBreakdown from './PriceBreakdown';
import MockCheckoutModal from './MockCheckoutModal';
import {
  Calendar,
  Users,
  Plus,
  Trash2,
  Tag,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

const BookingModal = ({ isOpen, onClose, item, itemType = 'package' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen || !item) return null;

  // Selected date
  const [travelDate, setTravelDate] = useState(() => {
    if (itemType === 'package' && item.availableDates && item.availableDates.length > 0) {
      return item.availableDates[0].date;
    }
    return '';
  });

  // Hotel room & nights
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [roomType, setRoomType] = useState(
    item.roomTypes && item.roomTypes.length > 0 ? item.roomTypes[0].type : ''
  );

  // Travellers list
  const [travellers, setTravellers] = useState([
    { name: user?.name || '', age: 28, gender: 'male' }
  ]);

  // Coupon state
  const [offerCode, setOfferCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [offerError, setOfferError] = useState('');
  const [validatingOffer, setValidatingOffer] = useState(false);

  // Live pricing state
  const [priceData, setPriceData] = useState({
    unitPrice: item.price || item.pricePerNight || 0,
    basePrice: 0,
    discount: 0,
    taxes: 0,
    total: 0
  });

  // Flow State
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Recalculate price preview locally or via server
  useEffect(() => {
    let unit = item.price || item.pricePerNight || 0;
    let nights = 1;

    if (itemType === 'hotel') {
      if (checkInDate && checkOutDate) {
        const inD = new Date(checkInDate);
        const outD = new Date(checkOutDate);
        nights = Math.max(1, Math.ceil((outD - inD) / (1000 * 60 * 60 * 24)));
      }
      if (roomType && item.roomTypes) {
        const matched = item.roomTypes.find((r) => r.type === roomType);
        if (matched) unit = matched.pricePerNight * nights;
      }
    }

    const count = travellers.length;
    const base = unit * count;

    let disc = 0;
    if (appliedOffer) {
      if (appliedOffer.discountType === 'PERCENT') {
        const raw = Math.round((base * appliedOffer.discountValue) / 100);
        disc = appliedOffer.maxDiscount ? Math.min(raw, appliedOffer.maxDiscount) : raw;
      } else if (appliedOffer.discountType === 'FLAT') {
        disc = Math.min(appliedOffer.discountValue, base);
      }
    }

    const taxable = Math.max(0, base - disc);
    const tax = Math.round(taxable * 0.05 * 100) / 100;
    const tot = Math.round((taxable + tax) * 100) / 100;

    setPriceData({
      unitPrice: unit,
      basePrice: base,
      discount: disc,
      taxes: tax,
      total: tot
    });
  }, [travellers.length, appliedOffer, checkInDate, checkOutDate, roomType, item]);

  // Handle Add/Remove Travellers
  const addTraveller = () => {
    setTravellers([...travellers, { name: '', age: 25, gender: 'male' }]);
  };

  const removeTraveller = (index) => {
    if (travellers.length <= 1) return;
    setTravellers(travellers.filter((_, i) => i !== index));
  };

  const updateTraveller = (index, field, value) => {
    const updated = [...travellers];
    updated[index][field] = value;
    setTravellers(updated);
  };

  // Validate Promo Coupon
  const handleApplyCoupon = async () => {
    if (!offerCode.trim()) return;
    setValidatingOffer(true);
    setOfferError('');

    try {
      const res = await api.post('/offers/validate', {
        code: offerCode.trim().toUpperCase(),
        bookingAmount: priceData.basePrice
      });

      if (res.data.success && res.data.valid) {
        setAppliedOffer({
          code: res.data.code,
          discountType: res.data.discountType,
          discountValue: res.data.discountValue,
          maxDiscount: res.data.maxDiscount,
          calculatedDiscount: res.data.calculatedDiscount
        });
      } else {
        setOfferError(res.data.message || 'Coupon code is invalid or not applicable');
        setAppliedOffer(null);
      }
    } catch (err) {
      setOfferError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedOffer(null);
    } finally {
      setValidatingOffer(false);
    }
  };

  const removeCoupon = () => {
    setAppliedOffer(null);
    setOfferCode('');
    setOfferError('');
  };

  // Submit Booking -> calls POST /api/v1/bookings
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    // Validate travellers
    for (let i = 0; i < travellers.length; i++) {
      if (!travellers[i].name.trim()) {
        setBookingError(`Please enter a name for Traveller ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    setBookingError('');

    try {
      const payload = {
        itemType,
        itemId: item._id,
        travellers,
        travelDate: travelDate || undefined,
        checkInDate: checkInDate || undefined,
        checkOutDate: checkOutDate || undefined,
        roomType: roomType || undefined,
        offerCode: appliedOffer ? appliedOffer.code : undefined
      };

      const res = await api.post('/bookings', payload);

      if (res.data.success) {
        setCreatedBooking(res.data.booking);
        setShowCheckout(true);
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Failed to reserve booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (paymentResult) => {
    setShowCheckout(false);
    onClose();
    navigate('/booking/confirmation', {
      state: {
        booking: paymentResult.booking || createdBooking,
        payment: paymentResult.payment,
        invoiceNumber: paymentResult.invoiceNumber
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transform transition-all animate-fadeIn">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded">
                Instant Reservation
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                {item.title || item.name || `${item.operator} (${item.type?.toUpperCase()})`}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.destination || item.city || `${item.from} → ${item.to}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitBooking} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Date Selection */}
            {itemType === 'package' && item.availableDates && item.availableDates.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-600" /> Select Departure Date
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {item.availableDates.map((slot) => {
                    const isSelected = travelDate === slot.date;
                    const dateObj = new Date(slot.date);
                    return (
                      <button
                        type="button"
                        key={slot.date}
                        onClick={() => setTravelDate(slot.date)}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/80 ring-2 ring-sky-500'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-bold text-slate-800">
                          {dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span
                          className={`text-[10px] font-semibold block mt-0.5 ${
                            slot.seatsLeft <= 5 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {slot.seatsLeft} seats left
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hotel Stay Dates */}
            {itemType === 'hotel' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Travellers Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" /> Travellers / Guests ({travellers.length})
                </label>
                <button
                  type="button"
                  onClick={addTraveller}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Traveller
                </button>
              </div>

              <div className="space-y-2.5">
                {travellers.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl"
                  >
                    <span className="text-[11px] font-bold text-slate-500 w-6">#{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={t.name}
                      onChange={(e) => updateTraveller(idx, 'name', e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      min="1"
                      max="110"
                      required
                      value={t.age}
                      onChange={(e) => updateTraveller(idx, 'age', Number(e.target.value))}
                      className="w-20 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <select
                      value={t.gender}
                      onChange={(e) => updateTraveller(idx, 'gender', e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>

                    {travellers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTraveller(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Promotional Offer / Coupon Section */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-600" /> Have a Promo Code?
              </label>

              {appliedOffer ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs text-emerald-800">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Coupon '{appliedOffer.code}' Applied!
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME10, FLAT500)"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    className="flex-1 text-xs uppercase px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    disabled={validatingOffer || !offerCode.trim()}
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {validatingOffer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}

              {offerError && (
                <p className="text-[11px] text-rose-600 font-medium mt-1.5">{offerError}</p>
              )}
            </div>

            {/* Embedded Live Price Breakdown */}
            <PriceBreakdown
              unitPrice={priceData.unitPrice}
              numberOfTravellers={travellers.length}
              basePrice={priceData.basePrice}
              discount={priceData.discount}
              appliedOfferCode={appliedOffer?.code}
              taxes={priceData.taxes}
              total={priceData.total}
            />

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Reserving Inventory...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Reserve & Proceed to Pay ₹{priceData.total.toLocaleString('en-IN')}
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Seats will be held for 15 minutes while you checkout.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Mock Checkout Modal Trigger */}
      {showCheckout && createdBooking && (
        <MockCheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          booking={createdBooking}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default BookingModal;
