import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  CheckCircle2,
  Download,
  Calendar,
  Users,
  CreditCard,
  FileText,
  ArrowRight,
  Compass
} from 'lucide-react';

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const booking = state.booking;
  const payment = state.payment;
  const invoiceNumber = state.invoiceNumber || payment?.invoiceNumber;

  const handleDownloadInvoice = async () => {
    try {
      const identifier = invoiceNumber || booking?.bookingId || payment?._id;
      const res = await api.get(`/payments/${identifier}/invoice`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Invoice-${invoiceNumber || booking?.bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Invoice download failed:', err);
      alert('Could not download invoice. Please try again from My Bookings.');
    }
  };

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No Booking Details Found</h2>
        <p className="text-xs text-slate-500">
          Please check your existing reservations in your customer dashboard.
        </p>
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-xl"
        >
          View My Bookings &rarr;
        </Link>
      </div>
    );
  }

  const itemName =
    booking.package?.title ||
    booking.hotel?.name ||
    booking.transport?.operator ||
    'Holiday Reservation';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-fadeIn">
      {/* Success Hero Banner */}
      <div className="bg-emerald-600 text-white rounded-3xl p-8 text-center shadow-xl shadow-emerald-600/10 space-y-3 relative overflow-hidden">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-2 text-white">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="bg-emerald-500/80 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Payment Confirmed
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white">
          You're All Set to Travel!
        </h1>
        <p className="text-emerald-100 text-xs max-w-md mx-auto">
          We've sent your official booking confirmation and receipt to your registered email and phone.
        </p>
      </div>

      {/* Confirmation & Invoice Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Booking Reference
            </span>
            <h2 className="text-xl font-mono font-bold text-slate-900 mt-0.5">
              {booking.bookingId}
            </h2>
            {invoiceNumber && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 mt-1">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                Invoice: <strong className="text-slate-800">{invoiceNumber}</strong>
              </span>
            )}
          </div>

          <button
            onClick={handleDownloadInvoice}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Download className="w-4 h-4 text-sky-400" /> Download PDF Invoice
          </button>
        </div>

        {/* Item & Traveller Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Trip Reservation Summary</h3>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                  {booking.itemType?.toUpperCase()}
                </span>
                <h4 className="text-base font-bold text-slate-900">{itemName}</h4>
              </div>
              <span className="text-base font-bold text-slate-900">
                ₹{booking.priceBreakdown?.total?.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
              {booking.travelDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    Departure: {new Date(booking.travelDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span>
                  {booking.numberOfTravellers} {booking.numberOfTravellers === 1 ? 'Traveller' : 'Travellers'}
                </span>
              </div>
            </div>

            {booking.travellers && booking.travellers.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-[11px] font-semibold text-slate-500 mb-1">Registered Travellers:</p>
                <div className="flex flex-wrap gap-2">
                  {booking.travellers.map((t, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700"
                    >
                      {t.name} ({t.age}y, {t.gender})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
          <Link
            to="/my-bookings"
            className="w-full sm:w-auto text-center px-5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 transition"
          >
            Go to My Bookings Hub
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Compass className="w-3.5 h-3.5" /> Explore More Packages &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
