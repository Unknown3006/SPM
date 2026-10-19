import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Users,
  Search,
  CheckCircle,
  XCircle,
  UserX,
  UserCheck,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Ticket,
  LifeBuoy,
  Tag,
  Download,
  Calendar,
  Trash2,
  PlusCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  FileText,
  BarChart3,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const STATUS_COLORS = {
  CONFIRMED: '#10b981', // emerald
  COMPLETED: '#0284c7', // sky
  PENDING_PAYMENT: '#f59e0b', // amber
  CANCELLED: '#ef4444' // rose
};

const AdminDashboard = () => {
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'offers' | 'reports'

  // Analytics state
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [userActionMsg, setUserActionMsg] = useState(null);
  const [userError, setUserError] = useState(null);

  // Offers state
  const [offers, setOffers] = useState([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [newOffer, setNewOffer] = useState({
    code: '',
    discountType: 'PERCENT',
    discountValue: 10,
    minBookingAmount: 0,
    maxDiscountAmount: 2000,
    validUntil: ''
  });
  const [offerActionMsg, setOfferActionMsg] = useState(null);

  // Reports state
  const [reportFormat, setReportFormat] = useState('csv');
  const [reportStatus, setReportStatus] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportDownloading, setReportDownloading] = useState(false);

  // 1. Fetch Analytics & Stats
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [statsRes, trendsRes] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/reports/revenue')
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
      if (trendsRes.data?.success) {
        setTrends(trendsRes.data.trends || trendsRes.data.revenueTrend || []);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const params = {};
      if (userSearch) params.search = userSearch;
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users || []);
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to fetch user directory');
    } finally {
      setUserLoading(false);
    }
  };

  // 3. Fetch Promotional Offers
  const fetchOffers = async () => {
    setOfferLoading(true);
    try {
      const res = await api.get('/offers');
      if (res.data?.success) {
        setOffers(res.data.offers || []);
      }
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setOfferLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'offers') fetchOffers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [roleFilter]);

  // Toggle User Status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    setUserActionMsg(null);
    setUserError(null);
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });
      if (res.data.success) {
        setUserActionMsg(res.data.message);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: !currentStatus } : u))
        );
      }
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  // Delete User
  const handleDeleteUser = async (userObj) => {
    if (userObj._id === currentAdmin?._id) {
      alert('Safeguard Alert: Administrators cannot delete their own account.');
      return;
    }
    if (!window.confirm(`Permanently delete user "${userObj.name}" (${userObj.email})?`)) {
      return;
    }

    setUserActionMsg(null);
    setUserError(null);
    try {
      const res = await api.delete(`/admin/users/${userObj._id}`);
      if (res.data?.success) {
        setUserActionMsg(res.data.message || 'User deleted successfully');
        setUsers((prev) => prev.filter((u) => u._id !== userObj._id));
      }
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Toggle Offer Status
  const handleToggleOfferStatus = async (offerId, currentActive) => {
    try {
      const res = await api.patch(`/offers/${offerId}`, {
        isActive: !currentActive
      });
      if (res.data?.success) {
        setOffers((prev) =>
          prev.map((o) => (o._id === offerId ? { ...o, isActive: !currentActive } : o))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update promo code');
    }
  };

  // Create New Offer
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: newOffer.code.trim().toUpperCase(),
        discountType: newOffer.discountType,
        discountValue: Number(newOffer.discountValue),
        minBookingAmount: Number(newOffer.minBookingAmount) || 0,
        maxDiscountAmount: Number(newOffer.maxDiscountAmount) || 0
      };
      if (newOffer.validUntil) {
        payload.validUntil = new Date(newOffer.validUntil);
      }

      const res = await api.post('/offers', payload);
      if (res.data?.success) {
        setOfferActionMsg(`Offer code ${payload.code} created successfully!`);
        setShowNewOfferModal(false);
        setNewOffer({
          code: '',
          discountType: 'PERCENT',
          discountValue: 10,
          minBookingAmount: 0,
          maxDiscountAmount: 2000,
          validUntil: ''
        });
        fetchOffers();
        setTimeout(() => setOfferActionMsg(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create promo code');
    }
  };

  // Download Report (CSV or PDF)
  const handleDownloadReport = async (format) => {
    setReportDownloading(true);
    try {
      const params = { format };
      if (reportStatus) params.status = reportStatus;
      if (reportStartDate) params.startDate = reportStartDate;
      if (reportEndDate) params.endDate = reportEndDate;

      const res = await api.get('/reports/bookings', {
        params,
        responseType: 'blob'
      });

      const mimeType = format === 'csv' ? 'text/csv' : 'application/pdf';
      const ext = format === 'csv' ? 'csv' : 'pdf';
      const blob = new Blob([res.data], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `TMS-Bookings-Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate export file. Please verify database connectivity.');
    } finally {
      setReportDownloading(false);
    }
  };

  // Transform booking status counts for Pie Chart
  const statusPieData = stats?.bookingsByStatus
    ? Object.keys(stats.bookingsByStatus).map((key) => ({
        name: key.replace('_', ' '),
        value: stats.bookingsByStatus[key],
        color: STATUS_COLORS[key] || '#94a3b8'
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Master Console</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              System Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System performance KPIs, RBAC user directory, promotional codes, and auditing exports.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" /> Analytics & Trends
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-600" /> Users & RBAC
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'offers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-600" /> Promo Offers
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Export Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            ₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">All settled payments</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bookings</span>
            <Ticket className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {stats?.totalBookings || 0}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Packages, Hotels & Transport</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Customers</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700">
            {stats?.totalUsers || 0}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Active platform accounts</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Complaints</span>
            <LifeBuoy className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600">
            {stats?.openComplaints || 0}
          </p>
          <span className="text-[11px] text-rose-500 font-medium">Require agent resolution</span>
        </div>
      </div>

      {/* TAB 1: ANALYTICS & RECHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Revenue & Booking Trends</h3>
                  <p className="text-xs text-slate-500">Monthly gross volume and settled transactions</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-sky-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Revenue (₹)
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                {trends.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    No historical revenue data recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0284c7"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bookings Breakdown Donut Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Booking Status Distribution</h3>
                <p className="text-xs text-slate-500">Proportions of confirmed, completed & cancelled</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                {statusPieData.length === 0 ? (
                  <p className="text-xs text-slate-400">No booking records found.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {statusPieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                    <span className="truncate">{entry.name}: <strong>{entry.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Destination Packages */}
          {stats?.topDestinations && stats.topDestinations.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900">Top-Selling Tour Packages</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {stats.topDestinations.map((pkg, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      Rank #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">{pkg.title || pkg.destination}</h4>
                    <p className="text-xs text-slate-500">Destination: {pkg.destination}</p>
                    <div className="flex items-center justify-between text-xs pt-1 font-semibold text-slate-700">
                      <span>{pkg.count} Bookings</span>
                      <span className="text-emerald-700">₹{pkg.totalRevenue?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS & RBAC */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {['', 'customer', 'employee', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    roleFilter === r
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === '' ? 'All Roles' : r.toUpperCase()}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchUsers();
              }}
              className="relative w-full sm:w-64"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </form>
          </div>

          {userActionMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {userActionMsg}
            </div>
          )}

          {userError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {userError}
            </div>
          )}

          {userLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm font-medium">Loading user directory...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Login</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isSelf = u._id === currentAdmin?._id;
                      return (
                        <tr key={u._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {u.name} {isSelf && <span className="text-[10px] text-purple-600 font-bold">(You)</span>}
                                </p>
                                <p className="text-[10px] text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 uppercase font-bold text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'employee'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{u.phone || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {u.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                                disabled={isSelf}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                                  u.isActive
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                } disabled:opacity-30`}
                                title={isSelf ? 'Cannot deactivate self' : 'Toggle account status'}
                              >
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={isSelf}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
                                title={isSelf ? 'Cannot delete self' : 'Delete user'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROMOTIONAL OFFERS */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Promotional Discounts & Coupons</h3>
              <p className="text-xs text-slate-500">Configure vouchers applied during checkout</p>
            </div>
            <button
              onClick={() => setShowNewOfferModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition"
            >
              <PlusCircle className="w-4 h-4" /> Create Promo Code
            </button>
          </div>

          {offerActionMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {offerActionMsg}
            </div>
          )}

          {offerLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm font-medium">Loading promotional codes...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <p className="text-slate-500 text-sm">No promotional offers configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {offers.map((off) => (
                <div
                  key={off._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        {off.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          off.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {off.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-lg font-extrabold text-slate-900">
                      {off.discountType === 'PERCENT'
                        ? `${off.discountValue}% OFF`
                        : `₹${off.discountValue} FLAT OFF`}
                    </p>

                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>Min Booking: ₹{off.minBookingAmount || 0}</p>
                      {off.maxDiscountAmount > 0 && <p>Max Discount: ₹{off.maxDiscountAmount}</p>}
                      <p>
                        Expires:{' '}
                        {off.validUntil
                          ? new Date(off.validUntil).toLocaleDateString()
                          : 'No expiry'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleOfferStatus(off._id, off.isActive)}
                      className={`text-xs font-semibold py-1 px-3 rounded-lg border transition ${
                        off.isActive
                          ? 'border-slate-300 text-slate-600 hover:bg-slate-50'
                          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {off.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <span className="text-[10px] text-slate-400">Uses: {off.usageCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT EXPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Audit & Bookings Report Export</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate full business audit reports containing booking records, passenger manifests, and transaction settlement proofs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Filter</label>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
            <button
              onClick={() => handleDownloadReport('csv')}
              disabled={reportDownloading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow transition flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV Spreadsheet
            </button>

            <button
              onClick={() => handleDownloadReport('pdf')}
              disabled={reportDownloading}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow transition flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-purple-400" /> Export Official PDF Report
            </button>
          </div>
        </div>
      )}

      {/* Create Promo Code Modal */}
      {showNewOfferModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Promo Code</h3>
              <button
                onClick={() => setShowNewOfferModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={newOffer.code}
                  onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 uppercase font-mono font-bold focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={newOffer.discountType}
                    onChange={(e) => setNewOffer({ ...newOffer, discountType: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PERCENT">PERCENT (%)</option>
                    <option value="FLAT">FLAT (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newOffer.discountValue}
                    onChange={(e) => setNewOffer({ ...newOffer, discountValue: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Booking (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newOffer.minBookingAmount}
                    onChange={(e) => setNewOffer({ ...newOffer, minBookingAmount: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newOffer.maxDiscountAmount}
                    onChange={(e) => setNewOffer({ ...newOffer, maxDiscountAmount: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={newOffer.validUntil}
                  onChange={(e) => setNewOffer({ ...newOffer, validUntil: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewOfferModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
