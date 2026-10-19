import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import NoResultsFound from '../../components/common/NoResultsFound';
import {
  Search,
  SlidersHorizontal,
  Compass,
  MapPin,
  Calendar,
  Clock,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All Packages' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'beach', label: 'Beach & Coastal' },
  { id: 'cultural', label: 'Heritage & Culture' },
  { id: 'family', label: 'Family Getaways' },
  { id: 'luxury', label: 'Royal Luxury' },
  { id: 'honeymoon', label: 'Romantic Honeymoon' }
];

const getCategoryColor = (category) => {
  switch (category) {
    case 'adventure':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'beach':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'cultural':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'family':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'luxury':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'honeymoon':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const PackagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [packages, setPackages] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 9,
        sortBy
      };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await api.get('/packages', { params });
      setPackages(res.data.packages || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tour packages');
    } finally {
      setLoading(false);
    }
  };

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sortBy !== 'newest') params.set('sortBy', sortBy);
    if (page > 1) params.set('page', page);

    setSearchParams(params, { replace: true });
    fetchPackages();
  }, [category, sortBy, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPackages();
  };

  const handleApplyBudget = () => {
    setPage(1);
    fetchPackages();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-teal-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sky-200 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" /> Curated Tour Packages
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Discover Your Next Dream Destination
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 font-light">
            Browse through {total} verified holiday tours across India and international retreats, complete with day-by-day itineraries and seat availability.
          </p>
        </div>

        {/* Search bar inside header */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destination, city, or tour..."
              className="w-full pl-10 pr-4 py-3 bg-white text-slate-800 text-xs rounded-2xl shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </form>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.id);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              category === cat.id
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Content Layout (Sidebar + Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-slate-700">
            {total} Packages Found
          </span>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>

        {/* Sidebar Filters */}
        <aside
          className={`space-y-6 ${
            showMobileFilters ? 'block' : 'hidden lg:block'
          } lg:col-span-1`}
        >
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-sky-600" /> Filter Catalog
              </div>
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 transition"
              >
                Reset All
              </button>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Sort Results
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 font-medium"
              >
                <option value="newest">Featured & Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Customer Rated</option>
                <option value="duration">Trip Duration</option>
              </select>
            </div>

            {/* Price Budget Range */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Budget Range (₹ INR)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Min (₹)</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="5,000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Max (₹)</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="70,000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyBudget}
                className="w-full mt-3 py-2 px-3 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition"
              >
                Apply Budget
              </button>
            </div>

            {/* Quick Price Shortcuts */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Quick Budgets:
              </span>
              <button
                type="button"
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('15000');
                  setPage(1);
                  fetchPackages();
                }}
                className="w-full text-left py-1 px-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Under ₹15,000</span>
                <span className="text-[11px] text-slate-400 font-mono">Budget</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMinPrice('15000');
                  setMaxPrice('35000');
                  setPage(1);
                  fetchPackages();
                }}
                className="w-full text-left py-1 px-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>₹15,000 - ₹35,000</span>
                <span className="text-[11px] text-slate-400 font-mono">Standard</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMinPrice('35000');
                  setMaxPrice('');
                  setPage(1);
                  fetchPackages();
                }}
                className="w-full text-left py-1 px-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Above ₹35,000</span>
                <span className="text-[11px] text-purple-600 font-mono">Luxury</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Packages Results Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Status info bar */}
          <div className="hidden lg:flex items-center justify-between text-xs text-slate-500 pb-2">
            <span>
              Showing <strong className="text-slate-800">{packages.length}</strong> of{' '}
              <strong className="text-slate-800">{total}</strong> holiday packages
            </span>
            <span>
              Page <strong className="text-slate-800">{page}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong>
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse p-4 space-y-4"
                >
                  <div className="h-48 bg-slate-200 rounded-2xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : packages.length === 0 ? (
            <NoResultsFound
              message={
                search
                  ? `No packages found matching "${search}".`
                  : 'No packages found matching the selected filters.'
              }
              onReset={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const primaryImage =
                  pkg.images && pkg.images.length > 0
                    ? pkg.images[0]
                    : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80';

                // Next available date
                const nextDate =
                  pkg.availableDates && pkg.availableDates.length > 0
                    ? new Date(pkg.availableDates[0].date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : null;
                const seatsLeft =
                  pkg.availableDates && pkg.availableDates.length > 0
                    ? pkg.availableDates[0].seatsLeft
                    : null;

                return (
                  <div
                    key={pkg._id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                  >
                    {/* Card Image Banner */}
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      <img
                        src={primaryImage}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent pointer-events-none"></div>

                      {/* Category Pill */}
                      <span
                        className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm uppercase tracking-wider ${getCategoryColor(
                          pkg.category
                        )}`}
                      >
                        {pkg.category}
                      </span>

                      {/* Destination Pill */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold drop-shadow">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        <span>{pkg.destination}</span>
                      </div>

                      {/* Rating */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur text-white text-xs font-bold">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{pkg.ratingAverage}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-sky-600 transition leading-snug line-clamp-2">
                          {pkg.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed font-light">
                          {pkg.description}
                        </p>
                      </div>

                      {/* Highlights */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pkg.durationDays} Days / {pkg.durationDays - 1} N</span>
                        </div>
                        {nextDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Depart: {nextDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Price and CTA */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                            Starting from
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-extrabold text-slate-900">
                              ₹{pkg.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-500">/ person</span>
                          </div>
                        </div>

                        <Link
                          to={`/packages/${pkg._id}`}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 group-hover:translate-x-0.5"
                        >
                          View Details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                    page === num
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackagesPage;
