import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">TMS Prototype</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Academic 2-Person Prototype of a web-based Tourism Management System built on the MERN stack.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> Role-Based Access Control Active
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-white transition">Home Catalog</Link></li>
              <li><Link to="/help" className="hover:text-white transition">FAQ & User Guides</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Create Account</Link></li>
            </ul>
          </div>

          {/* Demo Accounts */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Demo Credentials</h4>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p><span className="text-purple-300 font-semibold">Admin:</span> admin@tms.test / Admin@123</p>
              <p><span className="text-amber-300 font-semibold">Agent:</span> agent@tms.test / Agent@123</p>
              <p><span className="text-emerald-300 font-semibold">Customer:</span> customer@tms.test / Customer@123</p>
            </div>
          </div>

          {/* System info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Prototype Status</h4>
            <p className="text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              Increment 1 (Core Auth & RBAC) Complete.
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              All routes rate-limited, sanitised against NoSQL injection, and protected via signed JWTs.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Tourism Management System (TMS). All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for Academic Evaluation
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
