import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import BookingModal from '../../components/booking/BookingModal';
import {
  MapPin,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Star,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Share2,
  ChevronDown,
  Info
} from 'lucide-react';

const PackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchPackage = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/packages/${id}`);
        setTour(res.data.package);
        if (res.data.package?.availableDates?.length > 0) {
          setSelectedDate(res.data.package.availableDates[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Tour package not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading tour package details...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Package Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested package does not exist.'}</p>
        <Link
          to="/packages"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Packages Catalog
        </Link>
      </div>
    );
  }

  const primaryImage =
    tour.images && tour.images.length > 0
      ? tour.images[0]
      : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80';

  const handleBookNow = () => {
    setShowBookingModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/packages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Packages
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 capitalize">
            {tour.category}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-bold text-slate-700">{tour.destination}</span>
        </div>
      </div>

      {/* Hero Visual Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl h-80 sm:h-96 lg:h-[450px]">
        <img
          src={primaryImage}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>

        {/* Floating Content Banner */}
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur border border-white/30 text-white">
              {tour.category}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/80 backdrop-blur text-white">
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>{tour.ratingAverage}</span>
              <span className="text-amber-100 font-normal">({tour.ratingCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur text-white">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{tour.destination}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {tour.title}
          </h1>
        </div>
      </div>

      {/* Main Grid: Details (Left 2 cols) & Booking Sticky Card (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Overview, Itinerary, Inclusions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm text-center">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Duration</p>
              <p className="text-sm font-extrabold text-slate-900">{tour.durationDays} Days / {tour.durationDays - 1} Nights</p>
            </div>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Group Size</p>
              <p className="text-sm font-extrabold text-slate-900">Up to {tour.maxGroupSize} People</p>
            </div>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Tour Guide</p>
              <p className="text-sm font-extrabold text-slate-900">Certified Local</p>
            </div>
          </div>

          {/* Overview Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Tour Overview</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
              {tour.description}
            </p>
          </div>

          {/* Day by Day Itinerary */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Day-by-Day Itinerary</h2>
                <p className="text-xs text-slate-500 mt-0.5">Explore the planned daily schedule</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg">
                {tour.itinerary?.length || 0} Days Planned
              </span>
            </div>

            <div className="space-y-4">
              {tour.itinerary && tour.itinerary.length > 0 ? (
                tour.itinerary.map((dayPlan) => (
                  <div
                    key={dayPlan.day}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {dayPlan.day}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Day {dayPlan.day}: {dayPlan.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-10">
                      {dayPlan.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Customized itinerary will be shared upon booking.</p>
              )}
            </div>
          </div>

          {/* Inclusions List */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">What's Included in This Package</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {tour.inclusions && tour.inclusions.length > 0 ? (
                tour.inclusions.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{inc}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">All standard inclusions apply.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Price per person
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  ₹{tour.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500">+ 5% GST on checkout</span>
              </div>
            </div>

            {/* Departure Dates Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Select Departure Date
              </label>
              <div className="space-y-2">
                {tour.availableDates && tour.availableDates.length > 0 ? (
                  tour.availableDates.map((item, idx) => {
                    const isSelected = selectedDate?._id === item._id;
                    const dateFormatted = new Date(item.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(item)}
                        className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between text-xs ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50 text-sky-950 font-semibold shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                          <span>{dateFormatted}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            item.seatsLeft <= 5
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.seatsLeft} seats left
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">Dates available upon request.</p>
                )}
              </div>
            </div>

            {/* Refund & Security Notice */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Guaranteed Departure & Refund Protection
              </p>
              <p className="text-slate-500 leading-tight">
                Cancel 7+ days before travel for a 90% instant refund via our automated refund policy.
              </p>
            </div>

            {/* Booking CTA Button */}
            <button
              onClick={handleBookNow}
              className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 shadow-lg shadow-sky-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Book This Tour Package
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          item={tour}
          itemType="package"
        />
      )}
    </div>
  );
};

export default PackageDetailPage;
