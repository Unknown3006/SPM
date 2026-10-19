import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  UserCheck,
  Send,
  Loader2,
  RefreshCw,
  MessageSquare,
  Shield,
  Phone,
  Mail,
  Calendar,
  X,
  ChevronRight,
  Eye,
  CheckCircle
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'complaints'

  // Bookings queue state
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Complaints queue state
  const [complaints, setComplaints] = useState([]);
  const [complaintLoading, setComplaintLoading] = useState(true);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Note and resolution form state
  const [noteText, setNoteText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Overall stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    openComplaints: 0,
    confirmedBookings: 0,
    resolvedComplaints: 0
  });

  const fetchStats = async () => {
    try {
      const res = await api.get('/reports/stats');
      if (res.data?.success) {
        const s = res.data.stats;
        setStats({
          totalBookings: s.totalBookings || 0,
          openComplaints: s.openComplaints || 0,
          confirmedBookings: s.bookingsByStatus?.CONFIRMED || 0,
          resolvedComplaints: s.complaintsByStatus?.RESOLVED || 0
        });
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchBookings = async () => {
    setBookingLoading(true);
    try {
      const params = {};
      if (bookingStatusFilter) params.status = bookingStatusFilter;
      if (bookingSearch) params.search = bookingSearch;

      const res = await api.get('/bookings', { params });
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setComplaintLoading(true);
    try {
      const params = {};
      if (complaintStatusFilter) params.status = complaintStatusFilter;
      if (complaintSearch) params.search = complaintSearch;

      const res = await api.get('/complaints', { params });
      if (res.data?.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setComplaintLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchBookings();
    fetchComplaints();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [bookingStatusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [complaintStatusFilter]);

  // Handle booking status change
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await api.patch(`/bookings/${bookingId}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by Agent ${user.name}`
      });
      if (res.data?.success) {
        setBookings((prev) =>
          prev.map((b) => (b.bookingId === bookingId ? { ...b, status: newStatus } : b))
        );
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  // Handle adding note to complaint
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedComplaint) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await api.post(`/complaints/${selectedComplaint.complaintId}/notes`, {
        text: noteText.trim()
      });
      if (res.data?.success) {
        setNoteText('');
        setActionMsg('Staff note added to ticket thread');
        // Refresh selected complaint
        const updated = await api.get(`/complaints/${selectedComplaint.complaintId}`);
        if (updated.data?.success) {
          setSelectedComplaint(updated.data.complaint);
        }
        fetchComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle complaint status & resolution update
  const handleUpdateComplaintStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      const payload = {};
      if (statusUpdate) payload.status = statusUpdate;
      if (resolutionText.trim()) payload.resolution = resolutionText.trim();

      const res = await api.patch(`/complaints/${selectedComplaint.complaintId}`, payload);
      if (res.data?.success) {
        setActionMsg('Complaint status & resolution updated successfully');
        const updated = await api.get(`/complaints/${selectedComplaint.complaintId}`);
        if (updated.data?.success) {
          setSelectedComplaint(updated.data.complaint);
        }
        fetchComplaints();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update complaint');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Travel Operations Console</h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Agent RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong>{user?.name}</strong> ({user?.email}). Manage traveller bookings, dispatch vouchers, and address complaints.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" /> Bookings Queue ({stats.totalBookings})
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'complaints'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Complaints Queue ({stats.openComplaints} Open)
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
          <p className="text-2xl font-extrabold text-slate-900">{stats.totalBookings}</p>
          <span className="text-[11px] text-emerald-600 font-medium">All customer records</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirmed Trips</p>
          <p className="text-2xl font-extrabold text-emerald-600">{stats.confirmedBookings}</p>
          <span className="text-[11px] text-slate-500 font-medium">Ready for travel</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Complaints</p>
          <p className="text-2xl font-extrabold text-rose-600">{stats.openComplaints}</p>
          <span className="text-[11px] text-rose-500 font-medium">Needs agent review</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved Tickets</p>
          <p className="text-2xl font-extrabold text-sky-600">{stats.resolvedComplaints}</p>
          <span className="text-[11px] text-slate-500 font-medium">Cases solved</span>
        </div>
      </div>

      {/* TAB 1: BOOKINGS QUEUE */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {['', 'PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setBookingStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    bookingStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === '' ? 'All Bookings' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchBookings();
              }}
              className="relative w-full sm:w-64"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search Booking ID or Customer..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </form>
          </div>

          {bookingLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <p className="text-sm font-medium">Loading operations queue...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <p className="text-slate-500 text-sm">No bookings match the selected filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Travel Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {b.bookingId}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{b.user?.name || 'Customer'}</p>
                          <p className="text-[10px] text-slate-400">{b.user?.email}</p>
                        </td>
                        <td className="py-3 px-4 capitalize">
                          <span className="font-medium text-slate-700">{b.itemType}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {b.travelDate
                            ? new Date(b.travelDate).toLocaleDateString()
                            : b.checkInDate
                            ? new Date(b.checkInDate).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{b.priceBreakdown?.total?.toLocaleString('en-IN') || 0}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'PENDING_PAYMENT'
                                ? 'bg-amber-100 text-amber-800'
                                : b.status === 'COMPLETED'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateBookingStatus(b.bookingId, e.target.value)}
                              className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="View Booking Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPLAINTS QUEUE */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setComplaintStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    complaintStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === '' ? 'All Tickets' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchComplaints();
              }}
              className="relative w-full sm:w-64"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                placeholder="Search Ticket CMP-..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </form>
          </div>

          {complaintLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <p className="text-sm font-medium">Loading complaints queue...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <p className="text-slate-500 text-sm">No complaints found for current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {complaints.map((c) => (
                <div
                  key={c._id}
                  onClick={() => {
                    setSelectedComplaint(c);
                    setStatusUpdate(c.status);
                    setResolutionText(c.resolution || '');
                    setActionMsg(null);
                  }}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-amber-300 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {c.complaintId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'OPEN'
                            ? 'bg-rose-100 text-rose-800'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : c.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        From: <strong>{c.user?.name || 'Customer'}</strong> ({c.user?.email})
                      </span>
                      {c.booking && (
                        <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium">
                          Ref: {c.booking.bookingId || c.booking}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{c.subject}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>

                    {c.resolution && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                        <strong>Resolution:</strong> {c.resolution}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs text-slate-500 hidden sm:block">
                      <p>{c.notes?.length || 0} internal notes</p>
                      <p className="text-[10px] text-amber-600 font-bold">Click to manage & respond</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {selectedBooking.bookingId}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Booking Operations Detail</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p className="font-bold text-slate-700">Customer Details:</p>
                <p>Name: {selectedBooking.user?.name}</p>
                <p>Email: {selectedBooking.user?.email}</p>
                <p>Phone: {selectedBooking.user?.phone || 'N/A'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p className="font-bold text-slate-700">Travellers ({selectedBooking.travellers?.length || 0}):</p>
                {selectedBooking.travellers?.map((t, idx) => (
                  <p key={idx} className="text-slate-600">
                    {idx + 1}. {t.name} ({t.age} yrs, {t.gender})
                  </p>
                ))}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p className="font-bold text-slate-700">Financial Breakdown:</p>
                <p>Base Fare: ₹{selectedBooking.priceBreakdown?.basePrice?.toLocaleString('en-IN')}</p>
                <p>Discount: -₹{selectedBooking.priceBreakdown?.discount?.toLocaleString('en-IN')}</p>
                <p>Taxes: ₹{selectedBooking.priceBreakdown?.taxes?.toLocaleString('en-IN')}</p>
                <p className="font-bold text-slate-900 text-sm">
                  Total: ₹{selectedBooking.priceBreakdown?.total?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Manage & Resolution Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden p-6 space-y-5 animate-in fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedComplaint.complaintId}
                  </span>
                  <span className="text-xs text-slate-400">
                    Opened by {selectedComplaint.user?.name} ({selectedComplaint.user?.email})
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedComplaint.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {actionMsg}
              </div>
            )}

            {/* Description */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-700">Customer Description:</p>
              <p className="text-slate-800 whitespace-pre-wrap">{selectedComplaint.description}</p>
            </div>

            {/* Staff Notes History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Staff Notes & Log ({selectedComplaint.notes?.length || 0})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {selectedComplaint.notes?.map((n, idx) => (
                  <div key={idx} className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold">
                      <span>{n.author?.name || 'Agent'} ({n.author?.role || 'Staff'})</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-800">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Append Staff Note Form */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Append internal note (e.g. called hotel manager, seat changed)..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={actionLoading || !noteText.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> Add Note
              </button>
            </form>

            {/* Status & Resolution Update Form */}
            <form onSubmit={handleUpdateComplaintStatus} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Update Ticket Status & Resolution
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Resolution Note (Sent to Customer)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sea-view room allocated, voucher updated..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  Save & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
