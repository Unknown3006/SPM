import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ShieldCheck,
  Heart,
  Phone,
  Mail,
  MapPin,
  Send,
  Lock,
  CreditCard,
  CheckCircle,
  ExternalLink,
  Award,
  Globe2
} from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="mt-auto bg-slate-950 text-slate-300 border-t border-slate-800/80">
      {/* Top Value Propositions Strip */}
      <div className="border-b border-slate-900 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-100">100% Verified Stays</h5>
                <p className="text-[11px] text-slate-400">Audited resorts & certified tour guides</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-100">Secure Razorpay Payments</h5>
                <p className="text-[11px] text-slate-400">256-bit encrypted card & UPI transactions</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-100">Guaranteed Departure</h5>
                <p className="text-[11px] text-slate-400">Automated refund policy protection</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-100">24/7 Travel Concierge</h5>
                <p className="text-[11px] text-slate-400">Real-time support & grievance resolution</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-teal-300 bg-clip-text text-transparent">
                  TMS Travel & Tour
                </span>
                <span className="text-[10px] block text-slate-400 uppercase tracking-widest font-semibold">
                  Expeditions & Getaways
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Discover curated holiday packages, boutique heritage hotels, and seamless transport connectivity across India and premier international gateways. Designed for discerning travellers seeking authenticity, comfort, and transparent pricing.
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-2">
              <h5 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Exclusive Travel Deals & Insider Offers
              </h5>
              {subscribed ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-xl max-w-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Thank you! You have subscribed to seasonal discount alerts.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Col 3: Top Destinations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" /> Top Destinations
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/packages?search=Goa" className="hover:text-white transition">Goa Beach Retreats</Link>
              </li>
              <li>
                <Link to="/packages?search=Rajasthan" className="hover:text-white transition">Rajasthan Heritage Palaces</Link>
              </li>
              <li>
                <Link to="/packages?search=Kashmir" className="hover:text-white transition">Kashmir Valley & Gulmarg</Link>
              </li>
              <li>
                <Link to="/packages?search=Kerala" className="hover:text-white transition">Kerala Backwaters & Munnar</Link>
              </li>
              <li>
                <Link to="/packages?search=Manali" className="hover:text-white transition">Himachal & Manali Adventure</Link>
              </li>
              <li>
                <Link to="/packages?search=Dubai" className="hover:text-white transition">Dubai Luxury & Desert Safari</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-teal-400" /> Travel Catalog
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/packages" className="hover:text-white transition">Holiday Tour Packages</Link>
              </li>
              <li>
                <Link to="/hotels" className="hover:text-white transition">Luxury Resorts & Hotels</Link>
              </li>
              <li>
                <Link to="/transport" className="hover:text-white transition">Flights, Trains & Buses</Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-white transition">Manage My Reservations</Link>
              </li>
              <li>
                <Link to="/support/complaints" className="hover:text-white transition">Customer Support Tickets</Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition">Help Center & FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Contact & Concierge */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-purple-400" /> Concierge & Help
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="space-y-1">
                <p className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-400" /> 24/7 Toll-Free Support:
                </p>
                <p className="text-slate-100 font-mono text-sm font-bold">1800-123-TOUR (8687)</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-400" /> Official Email:
                </p>
                <a href="mailto:support@tms.test" className="text-sky-400 hover:underline">
                  support@tms.test
                </a>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-slate-900">
                Operational Headquarters:<br />
                Tourism Plaza, Cyber City, Sector 24, Gurugram, HR 122002
              </div>
            </div>
          </div>
        </div>

        {/* Security & Payment Methods Strip */}
        <div className="mt-12 pt-8 border-t border-slate-900/90 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
              Guaranteed Secure Checkout via
            </span>

            {/* Razorpay Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 font-bold text-xs tracking-tight">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              Razorpay Test & Live
            </div>

            {/* Card & Payment Badges */}
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Visa</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Mastercard</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">RuPay</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">UPI / GPay / PhonePe</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">NetBanking</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit SSL Banking-Grade Encryption</span>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Tourism Management System (TMS) Ltd. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link to="/help" className="hover:text-slate-300 transition">Privacy Policy</Link>
            <Link to="/help" className="hover:text-slate-300 transition">Terms of Service</Link>
            <Link to="/help" className="hover:text-slate-300 transition">Cancellation Rules</Link>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-slate-400">
              Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Explorers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
