import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import ProviderStatusBanner from '../../components/common/ProviderStatusBanner';
import NoResultsFound from '../../components/common/NoResultsFound';
import {
  Building2,
  MapPin,
  Star,
  Search,
  Wifi,
  Coffee,
  Sparkles,
  ArrowRight,
  BedDouble,
  DollarSign
} from 'lucide-react';

const HotelsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState(null);

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating');
  const [preferExternal, setPreferExternal] = useState(
    searchParams.get('preferExternal') === 'true'
  );

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        sortBy,
        preferExternal
      };
      if (city.trim()) params.city = city.trim();
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await api.get('/hotels', { params });
      setHotels(res.data.hotels || []);
      setFallbackUsed(res.data.fallbackUsed || false);
      setFallbackNotice(res.data.fallbackNotice || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [sortBy, preferExternal]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHotels();
  };

  const handleResetFilters = () => {
    setCity('');
    setMaxPrice('');
    setSortBy('rating');
    setPreferExternal(false);
    setSearchParams({});
    fetchHotels();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-sky-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-teal-200 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> Luxury & Heritage Hotels
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Book Verified Stays Across India & Abroad
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 font-light">
            From regal palace suites in Udaipur to serene beachside villas in Goa, explore handpicked resorts.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search by city (e.g. Goa, Jaipur, Mumbai)..."
              className="w-full pl-10 pr-4 py-3 bg-white text-slate-800 text-xs rounded-2xl shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </form>
      </div>

      {/* Provider Abstraction Status Banner & Simulation Toggle */}
      <ProviderStatusBanner
        fallbackUsed={fallbackUsed}
        fallbackNotice={fallbackNotice}
        onReload={fetchHotels}
      />

      {/* Controls Bar: External Provider Toggle + Sort Dropdown */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={preferExternal}
              onChange={(e) => setPreferExternal(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Query via External Travel Partner API (GlobalGDS)</span>
          </label>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="font-semibold text-slate-600">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            <option value="rating">Top Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Hotels Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
            >
              <div className="h-44 bg-slate-200 rounded-2xl"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <NoResultsFound
          message={city ? `No hotels found in "${city}".` : 'No hotels match the current search criteria.'}
          onReset={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((htl) => {
            const img =
              htl.images && htl.images.length > 0
                ? htl.images[0]
                : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';

            return (
              <div
                key={htl._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={img}
                    alt={htl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-white text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>{htl.city}</span>
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-bold">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{htl.rating}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-sky-600 transition line-clamp-1">
                      {htl.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{htl.address}</p>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {htl.amenities?.slice(0, 3).map((am, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium"
                        >
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                        Per Night
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-slate-900">
                          ₹{htl.pricePerNight?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500">/ night</span>
                      </div>
                    </div>

                    <Link
                      to={`/hotels/${htl._id}`}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                    >
                      View Hotel <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HotelsPage;
