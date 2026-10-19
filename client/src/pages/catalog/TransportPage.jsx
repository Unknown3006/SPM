import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ProviderStatusBanner from '../../components/common/ProviderStatusBanner';
import NoResultsFound from '../../components/common/NoResultsFound';
import BookingModal from '../../components/booking/BookingModal';
import {
  Plane,
  Train,
  Bus,
  MapPin,
  ArrowRight,
  Clock,
  Search,
  Filter,
  CreditCard,
  Ticket
} from 'lucide-react';

const TransportPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [transport, setTransport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingItem, setBookingItem] = useState(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState(null);

  const [type, setType] = useState(searchParams.get('type') || '');
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [preferExternal, setPreferExternal] = useState(
    searchParams.get('preferExternal') === 'true'
  );

  const fetchTransport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { preferExternal };
      if (type) params.type = type;
      if (from.trim()) params.from = from.trim();
      if (to.trim()) params.to = to.trim();

      const res = await api.get('/transport', { params });
      setTransport(res.data.transport || []);
      setFallbackUsed(res.data.fallbackUsed || false);
      setFallbackNotice(res.data.fallbackNotice || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transport services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, [type, preferExternal]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransport();
  };

  const handleResetFilters = () => {
    setType('');
    setFrom('');
    setTo('');
    setPreferExternal(false);
    setSearchParams({});
    fetchTransport();
  };

  const getTypeIcon = (transportType) => {
    switch (transportType) {
      case 'flight':
        return <Plane className="w-5 h-5 text-sky-600" />;
      case 'train':
        return <Train className="w-5 h-5 text-amber-600" />;
      case 'bus':
      default:
        return <Bus className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-sky-300 text-xs font-semibold uppercase tracking-wider">
          <Ticket className="w-3.5 h-3.5" /> Scheduled Transport Booking
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Flights, Express Trains & Luxury Buses
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-light max-w-xl">
          Search real scheduled passenger transit across Indian trunk routes with seat availability.
        </p>
      </div>

      {/* Provider Abstraction & Fallback Toggle */}
      <ProviderStatusBanner
        fallbackUsed={fallbackUsed}
        fallbackNotice={fallbackNotice}
        onReload={fetchTransport}
      />

      {/* Search Bar & Filter Tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          {[
            { id: '', label: 'All Modes' },
            { id: 'flight', label: 'Flights', icon: <Plane className="w-3.5 h-3.5" /> },
            { id: 'train', label: 'Trains', icon: <Train className="w-3.5 h-3.5" /> },
            { id: 'bus', label: 'Buses', icon: <Bus className="w-3.5 h-3.5" /> }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                type === t.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Origin / Destination Search Form */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Departure From</label>
            <div className="relative">
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="e.g. Delhi, Mumbai, Bangalore..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Arrival Destination</label>
            <div className="relative">
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="e.g. Goa, Manali, Srinagar..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" /> Search Transport
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Transport Results List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse p-4"
            ></div>
          ))}
        </div>
      ) : transport.length === 0 ? (
        <NoResultsFound
          message={
            from || to
              ? `No scheduled transport found for route ${from} -> ${to}.`
              : 'No transport services found matching the criteria.'
          }
          onReset={handleResetFilters}
        />
      ) : (
        <div className="space-y-4">
          {transport.map((item) => (
            <div
              key={item._id}
              className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* Left: Operator & Type */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {item.operator}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {item.type}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-700 font-semibold mt-0.5 block">
                    {item.seatsAvailable} seats available
                  </span>
                </div>
              </div>

              {/* Middle: Route & Times */}
              <div className="flex items-center gap-6 text-center w-full md:w-auto justify-between md:justify-center">
                <div>
                  <p className="text-sm font-black text-slate-900">{item.departureTime}</p>
                  <p className="text-xs text-slate-500 font-medium">{item.from}</p>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.duration}
                  </span>
                  <div className="w-24 h-0.5 bg-slate-200 relative my-1">
                    <div className="w-2 h-2 rounded-full bg-sky-600 absolute right-0 -top-0.5"></div>
                  </div>
                  <span className="text-[10px] text-teal-600 font-semibold">Non-stop</span>
                </div>

                <div>
                  <p className="text-sm font-black text-slate-900">{item.arrivalTime}</p>
                  <p className="text-xs text-slate-500 font-medium">{item.to}</p>
                </div>
              </div>

              {/* Right: Price & Action */}
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left md:text-right">
                  <span className="text-xs font-black text-slate-900 block text-lg">
                    ₹{item.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">per ticket</span>
                </div>

                <button
                  onClick={() => setBookingItem(item)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Book Seat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bookingItem && (
        <BookingModal
          isOpen={Boolean(bookingItem)}
          onClose={() => setBookingItem(null)}
          item={bookingItem}
          itemType="transport"
        />
      )}
    </div>
  );
};

export default TransportPage;
