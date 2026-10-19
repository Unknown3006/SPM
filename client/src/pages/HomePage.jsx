import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Compass,
  MapPin,
  Search,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Ticket,
  Tag,
  Star,
  Copy,
  Check,
  Percent
} from 'lucide-react';

const HomePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Search widget tab: 'packages' | 'hotels' | 'transport'
  const [activeTab, setActiveTab] = useState('packages');
  const [searchDestination, setSearchDestination] = useState('');
  const [activeOffers, setActiveOffers] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    // Fetch live active offers
    api.get('/offers/active')
      .then((res) => setActiveOffers(res.data.offers || []))
      .catch((err) => console.error('Failed to load active offers:', err));

    // Fetch featured packages
    api.get('/packages?limit=6&sortBy=rating')
      .then((res) => setFeaturedPackages(res.data.packages || []))
      .catch((err) => console.error('Failed to load featured packages:', err));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'packages') {
      navigate(`/packages?search=${encodeURIComponent(searchDestination)}`);
    } else if (activeTab === 'hotels') {
      navigate(`/hotels?city=${encodeURIComponent(searchDestination)}`);
    } else {
      navigate(`/transport?to=${encodeURIComponent(searchDestination)}`);
    }
  };

  const handleCopyOffer = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleQuickDemoLogin = async (email, password, role) => {
    const result = await login(email, password);
    if (result.success) {
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'employee') navigate('/agent/dashboard');
      else navigate('/my-bookings');
    }
  };

  const popularDestinations = [
    { name: 'Goa', tag: 'Sun, Sand & Shacks', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80', count: '4 Packages' },
    { name: 'Ladakh', tag: 'High Himalayan Passes', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80', count: '3 Packages' },
    { name: 'Rajasthan', tag: 'Forts & Royal Haveli', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&auto=format&fit=crop&q=80', count: '5 Packages' },
    { name: 'Kerala', tag: 'Backwaters & Tea Hills', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&auto=format&fit=crop&q=80', count: '3 Packages' },
    { name: 'Kashmir', tag: 'Paradise on Earth', image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&auto=format&fit=crop&q=80', count: '2 Packages' },
    { name: 'Dubai', tag: 'Skyscrapers & Safari', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&auto=format&fit=crop&q=80', count: '2 Packages' }
  ];

  return (
    <div className="flex-1 space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-950 via-sky-900 to-slate-900 text-white pt-16 pb-24 lg:pt-20 lg:pb-32">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sky-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300" /> Complete Catalog & Search Engine Active
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Find Your Perfect Holiday & Seamless Travel
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-light">
            Search holiday packages, heritage hotels, and scheduled transit across Indian and international destinations.
          </p>

          {/* Search Hero Widget */}
          <div className="max-w-3xl mx-auto pt-4">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-3xl border border-white/20 shadow-2xl">
              {/* Tab Selector */}
              <div className="flex items-center justify-center gap-1 p-1 bg-black/30 rounded-2xl max-w-md mx-auto mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('packages')}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'packages'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" /> Packages
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('hotels')}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'hotels'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Hotels
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('transport')}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'transport'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" /> Transport
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-2 p-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder={
                      activeTab === 'packages'
                        ? 'Where do you want to travel? (e.g. Goa, Ladakh, Kerala, Dubai)'
                        : activeTab === 'hotels'
                        ? 'Enter city for hotel booking (e.g. Jaipur, Manali, Mumbai)'
                        : 'Enter arrival destination for flights/trains (e.g. Goa, Delhi)'
                    }
                    className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-800 text-xs sm:text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium placeholder-slate-400 shadow-inner"
                  />
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <button
                  type="submit"
                  className="py-3.5 px-8 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>Search {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Quick Demo Credentials Switcher (Convenient Role Switcher) */}
          <div className="pt-4 max-w-2xl mx-auto">
            {!user ? (
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-left shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-teal-300" /> 1-Click Demo Login:
                  </span>
                  <span className="text-[10px] text-sky-200">Pre-seeded accounts</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickDemoLogin('admin@tms.test', 'Admin@123', 'admin')}
                    className="py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-xs font-bold transition text-center"
                  >
                    Admin Portal
                  </button>
                  <button
                    onClick={() => handleQuickDemoLogin('agent@tms.test', 'Agent@123', 'employee')}
                    className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-xs font-bold transition text-center"
                  >
                    Agent Portal
                  </button>
                  <button
                    onClick={() => handleQuickDemoLogin('customer@tms.test', 'Customer@123', 'customer')}
                    className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-bold transition text-center"
                  >
                    Customer Hub
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/10 backdrop-blur rounded-2xl border border-white/20 flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Signed in as: <strong className="text-white">{user.name}</strong> ({user.role})
                </span>
                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'employee' ? '/agent/dashboard' : '/my-bookings'}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition"
                >
                  Go to Dashboard &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Active Promotional Offers Banner */}
      {activeOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" /> Exclusive Discounts
              </div>
              <h3 className="text-2xl font-black tracking-tight">Active Coupon Offers</h3>
              <p className="text-xs text-amber-100 font-light">
                Copy and apply these coupon codes during checkout for instant server-calculated savings!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeOffers.map((off) => (
                <div
                  key={off.code}
                  className="bg-white/95 text-slate-900 px-4 py-3 rounded-2xl shadow-md border border-white flex items-center gap-3"
                >
                  <div>
                    <span className="font-mono font-black text-xs text-rose-600 block">
                      {off.code}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {off.discountType === 'PERCENT'
                        ? `${off.discountValue}% OFF (up to ₹${off.maxDiscount})`
                        : `Flat ₹${off.discountValue} OFF`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyOffer(off.code)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
                    title="Copy code"
                  >
                    {copiedCode === off.code ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Holiday Packages Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Top Rated Vacations</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Tour Packages
            </h2>
          </div>
          <Link
            to="/packages"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition"
          >
            Explore all packages <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPackages.map((pkg) => (
            <div
              key={pkg._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'}
                  alt={pkg.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-slate-800 shadow uppercase">
                  {pkg.category}
                </span>
                <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-bold drop-shadow">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{pkg.destination}</span>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-bold">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{pkg.ratingAverage}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-sky-600 transition line-clamp-1">
                    {pkg.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">From</span>
                    <span className="text-lg font-extrabold text-slate-900">
                      ₹{pkg.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Link
                    to={`/packages/${pkg._id}`}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Destinations Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Top Indian & Global Locations</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Popular Holiday Destinations
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularDestinations.map((dest) => (
            <Link
              key={dest.name}
              to={`/packages?destination=${encodeURIComponent(dest.name)}`}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition h-48 flex flex-col justify-end p-3.5"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent"></div>
              <div className="relative z-10 text-white">
                <h4 className="font-extrabold text-sm group-hover:text-teal-300 transition">{dest.name}</h4>
                <p className="text-[10px] text-slate-300 font-light truncate">{dest.tag}</p>
                <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full inline-block mt-1 font-medium">
                  {dest.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
