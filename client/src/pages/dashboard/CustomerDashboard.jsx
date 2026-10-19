import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import MockCheckoutModal from '../../components/booking/MockCheckoutModal';
import {
  Ticket,
  Search,
  Calendar,
  Users,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  EyeOff,
  CreditCard,
  Loader2,
  RefreshCw,
  Compass,
  ArrowRight
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, CONFIRMED, PENDING_PAYMENT, COMPLETED, CANCELLED

  // Checkout modal state (for Pay Now on pending bookings)
  const [payingBooking, setPayingBooking] = useState(null);

  // Cancellation Modal state
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change in schedule');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelActionLoading, setCancelActionLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/mine');
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Download PDF Invoice
  const handleDownloadInvoice = async (bookingId) => {
    try {
      const res = await api.get(`/payments/${bookingId}/invoice`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Invoice-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Could not download invoice. Please try again later.');
    }
  };

  // Open Cancel Modal & Fetch Refund Preview
  const handleOpenCancelModal = async (booking) => {
    setCancellingBooking(booking);
    setCancelLoading(true);
    setCancelPreview(null);
    try {
      const res = await api.get(`/bookings/${booking.bookingId}/cancel-preview`);
      if (res.data?.success) {
        setCancelPreview(res.data.preview);
      }
    } catch (err) {
      console.error('Failed to fetch cancel preview:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  // Confirm Cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setCancelActionLoading(true);
    try {
      const res = await api.post(`/bookings/${cancellingBooking.bookingId}/cancel`, {
        reason: cancelReason
      });
      if (res.data?.success) {
        setCancellingBooking(null);
        await fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelActionLoading(false);
    }
  };

  // Soft-hide booking from customer view
  const handleHideBooking = async (bookingId) => {
    if (!window.confirm('Clear this booking from your view? (Records will still be preserved for admin records)')) {
      return;
    }
    try {
      const res = await api.patch(`/bookings/${bookingId}/hide`);
      if (res.data?.success) {
        setBookings(bookings.filter((b) => b.bookingId !== bookingId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hide booking');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Bookings & Trips</h1>
            <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Customer Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome, {user?.name}. Manage your reservations, download tax invoices, and track your refunds.
          </p>
        </div>

        <Link
          to="/packages"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Search className="w-3.5 h-3.5" /> Book Another Trip
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'CONFIRMED', 'PENDING_PAYMENT', 'COMPLETED', 'CANCELLED'].map((tab) => {
          const count =
            tab === 'ALL'
              ? bookings.length
              : bookings.filter((b) => b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.replace('_', ' ')}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === tab ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <p className="text-xs text-slate-500">Loading your travel reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No {filter !== 'ALL' ? filter.replace('_', ' ').toLowerCase() : ''} bookings found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Explore our curated holiday tour packages, luxury hotels, and express flights.
            </p>
          </div>
          <Link
            to="/packages"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition"
          >
            Explore Catalog &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const title =
              b.package?.title ||
              b.hotel?.name ||
              b.transport?.operator ||
              'Holiday Reservation';
            const locationText =
              b.package?.destination ||
              b.hotel?.city ||
              (b.transport ? `${b.transport.from} → ${b.transport.to}` : '');

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {b.bookingId}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                      {b.itemType}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {b.status === 'CONFIRMED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                      </span>
                    )}
                    {b.status === 'PENDING_PAYMENT' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Payment
                      </span>
                    )}
                    {b.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Trip Completed
                      </span>
                    )}
                    {b.status === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Middle: Trip Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-base font-bold text-slate-900">{title}</h3>
                    {locationText && (
                      <p className="text-xs text-slate-500 font-medium">{locationText}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      {b.travelDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>
                            {new Date(b.travelDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{b.numberOfTravellers} Traveller(s)</span>
                      </div>
                    </div>

                    {b.cancellation && b.cancellation.refundAmount > 0 && (
                      <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                        <span>
                          Refund Processed ({b.cancellation.refundPercentage}% policy):
                        </span>
                        <strong className="font-bold">
                          ₹{b.cancellation.refundAmount.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Price & Summary */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Total Amount</span>
                      <span className="text-xl font-black text-slate-900">
                        ₹{b.priceBreakdown?.total?.toLocaleString('en-IN')}
                      </span>
                      {b.appliedOfferCode && (
                        <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Promo: {b.appliedOfferCode} (-₹{b.priceBreakdown?.discount})
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 flex flex-wrap items-center gap-2">
                      {b.status === 'PENDING_PAYMENT' && (
                        <button
                          onClick={() => setPayingBooking(b)}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay Now
                        </button>
                      )}

                      {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
                        <button
                          onClick={() => handleDownloadInvoice(b.bookingId)}
                          className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-600" /> Invoice
                        </button>
                      )}

                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleOpenCancelModal(b)}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition"
                        >
                          Cancel Trip
                        </button>
                      )}

                      {(b.status === 'CANCELLED' || b.status === 'COMPLETED') && (
                        <button
                          onClick={() => handleHideBooking(b.bookingId)}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-xl transition flex items-center gap-1"
                          title="Hide from my view"
                        >
                          <EyeOff className="w-3.5 h-3.5" /> Clear History
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Now Checkout Modal */}
      {payingBooking && (
        <MockCheckoutModal
          isOpen={Boolean(payingBooking)}
          onClose={() => setPayingBooking(null)}
          booking={payingBooking}
          onPaymentSuccess={() => {
            setPayingBooking(null);
            fetchBookings();
          }}
        />
      )}

      {/* Cancellation & Refund Preview Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-5 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  Cancellation Request
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Cancel Booking {cancellingBooking.bookingId}
                </h3>
              </div>
              <button
                onClick={() => setCancellingBooking(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {cancelLoading ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
                <p className="text-xs text-slate-500">Calculating your refund amount...</p>
              </div>
            ) : cancelPreview ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Days until departure:</span>
                    <strong className="text-slate-900">{cancelPreview.daysUntilTravel} days</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Applicable Refund Tier:</span>
                    <strong className="text-emerald-700">{cancelPreview.refundPercentage}%</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-800">Total Refund Payable:</span>
                    <span className="text-xl font-black text-emerald-600">
                      ₹{cancelPreview.refundAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                  Policy: {cancelPreview.policyDescription}
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Reason for cancellation
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Change in schedule">Change in office/holiday schedule</option>
                    <option value="Personal / Medical emergency">Personal / Medical emergency</option>
                    <option value="Found alternative plan">Found alternative transport/package</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancellingBooking(null)}
                    disabled={cancelActionLoading}
                    className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    disabled={cancelActionLoading}
                    onClick={handleConfirmCancel}
                    className="w-1/2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    {cancelActionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
