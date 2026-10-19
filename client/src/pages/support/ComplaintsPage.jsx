import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Ticket,
  ChevronRight,
  Send,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle,
  X
} from 'lucide-react';

const ComplaintsPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // New ticket state
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Active view modal
  const [activeComplaint, setActiveComplaint] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints/mine');
      if (res.data?.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const res = await api.get('/bookings/mine');
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchUserBookings();
  }, []);

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setSubmitError('Please fill in both the subject and detailed description.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        subject: subject.trim(),
        description: description.trim()
      };
      if (selectedBookingId) {
        payload.bookingId = selectedBookingId;
      }

      const res = await api.post('/complaints', payload);
      if (res.data?.success) {
        setSubmitSuccess(`Ticket registered successfully with ID: ${res.data.complaint.complaintId}`);
        setSubject('');
        setDescription('');
        setSelectedBookingId('');
        setTimeout(() => {
          setShowNewModal(false);
          setSubmitSuccess(null);
        }, 1800);
        fetchComplaints();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit complaint ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesFilter = filter === 'ALL' || c.status === filter;
    const matchesSearch =
      !search ||
      c.complaintId.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-medium border border-sky-400/30">
            <LifeBuoy className="w-3.5 h-3.5" /> Support & Resolution Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Customer Helpdesk & Complaints
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Track inquiries, report service discrepancies, or request trip modifications. Our travel agents typically respond within 2 business hours.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" /> Submit New Ticket
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket or topic..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <p className="text-sm font-medium">Retrieving your support tickets...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No support tickets found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {filter !== 'ALL' || search
                ? 'Try adjusting your search criteria or status filter.'
                : 'Have questions or service requests? Click "Submit New Ticket" to connect with an agent.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredComplaints.map((c) => (
            <div
              key={c._id}
              onClick={() => setActiveComplaint(c)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-sky-300 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {c.complaintId}
                  </span>
                  {getStatusBadge(c.status)}
                  <span className="text-[11px] text-slate-400">
                    Created on {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  {c.booking && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium">
                      <Ticket className="w-3 h-3" /> Booking {c.booking.bookingId || c.booking}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{c.subject}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                  {c.description}
                </p>

                {c.resolution && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Resolution:</strong> {c.resolution}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0">
                <div className="text-right text-xs text-slate-500 hidden sm:block">
                  <p>{c.notes?.length || 0} staff notes</p>
                  <p className="text-[10px] text-slate-400">Click to view thread</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600 transition">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register Support Ticket</h3>
                <p className="text-xs text-slate-500">Provide details for prompt agent response</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {submitSuccess}
              </div>
            )}

            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Related Booking (Optional)
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">General Inquiry / Not Linked to Booking</option>
                  {bookings.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bookingId} - {b.itemType?.toUpperCase()} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight schedule clarification or hotel upgrade"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={150}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe the issue, room number, or assistance required in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl transition shadow flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Thread Detail Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden p-6 space-y-5 animate-in fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {activeComplaint.complaintId}
                  </span>
                  {getStatusBadge(activeComplaint.status)}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{activeComplaint.subject}</h3>
                <p className="text-xs text-slate-400">
                  Opened on {new Date(activeComplaint.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveComplaint(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Customer Description
              </p>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {activeComplaint.description}
              </p>
            </div>

            {/* Resolution Banner */}
            {activeComplaint.resolution && (
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Official Staff Resolution
                </div>
                <p className="text-xs text-emerald-900 whitespace-pre-wrap leading-relaxed">
                  {activeComplaint.resolution}
                </p>
              </div>
            )}

            {/* Staff Notes Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Support Timeline & Notes ({activeComplaint.notes?.length || 0})
              </h4>
              {(!activeComplaint.notes || activeComplaint.notes.length === 0) ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
                  An agent has been notified and will post updates as soon as inquiry progress begins.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {activeComplaint.notes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold">
                        <span>Staff Agent ({note.author?.name || 'Support Staff'})</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveComplaint(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
