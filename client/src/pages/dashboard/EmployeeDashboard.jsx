import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Ticket, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Travel Agent Dashboard</h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Agent RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {user?.name}. Process customer bookings and address complaint tickets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Bookings Queue</p>
            <p className="text-xl font-bold text-slate-800">Ready for Increment 3</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Customer Complaints</p>
            <p className="text-xl font-bold text-slate-800">Ready for Increment 4</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Agent Status</p>
            <p className="text-sm font-bold text-emerald-600">Active & Authorized</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-2">
        <h4 className="font-bold text-sm">Increment 1 Verification Note</h4>
        <p>
          You are currently authenticated with the <span className="font-bold">employee</span> role.
          You can view agent workflows, but if you attempt to access Administrator features, you will be rejected with 403 Forbidden.
        </p>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
