import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  CreditCard,
  RefreshCw,
  MessageSquare,
  UserCheck,
  ChevronDown
} from 'lucide-react';

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openSection, setOpenSection] = useState(null);

  const faqs = [
    {
      category: 'Account & Security',
      icon: <UserCheck className="w-4 h-4 text-sky-500" />,
      questions: [
        {
          q: 'How do roles work in TMS?',
          a: 'TMS has three distinct roles: Customer (can search, book, pay, cancel, complain, review), Employee / Travel Agent (can view all bookings, update booking status, view and resolve complaints), and Administrator (manages users, packages, hotels, offers, reports, and notification logs).'
        },
        {
          q: 'How do I reset my password?',
          a: 'Click "Forgot Password" on the sign-in screen, enter your email, and follow the link delivered to your inbox (or provided in development debug notice).'
        },
        {
          q: 'What happens if an account is deactivated?',
          a: 'A deactivated user cannot log in. Furthermore, any existing JWT token issued before deactivation is immediately rejected on the very next request by the backend security middleware.'
        }
      ]
    },
    {
      category: 'Bookings & Lifecycle',
      icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
      questions: [
        {
          q: 'What is the booking lifecycle?',
          a: 'Bookings start in PENDING_PAYMENT upon creation (reserving seats for 15 minutes). Once payment succeeds, status updates to CONFIRMED. After the travel date, an employee marks it COMPLETED. Bookings can be CANCELLED before the travel date.'
        },
        {
          q: 'How is pricing computed?',
          a: 'Pricing is computed strictly on the server: base = unitPrice × travellers/nights, promotional discounts are verified and capped, and 5% taxes are calculated.'
        }
      ]
    },
    {
      category: 'Payment & Checkout',
      icon: <CreditCard className="w-4 h-4 text-purple-500" />,
      questions: [
        {
          q: 'Can I test payment without a real card?',
          a: 'Yes! The prototype includes a MockGateway that supports simulated Card, UPI, and Net Banking checkouts with 1-click Success and Failure test paths.'
        },
        {
          q: 'What is payment idempotency?',
          a: 'TMS guarantees that processing the same gateway callback or webhook multiple times will never generate duplicate confirmations, invoices, or notifications.'
        }
      ]
    },
    {
      category: 'Cancellation & Refunds',
      icon: <RefreshCw className="w-4 h-4 text-amber-500" />,
      questions: [
        {
          q: 'What is the cancellation refund policy?',
          a: '7 or more days before travel: 90% refund. 3 to 6 days before travel: 50% refund. Fewer than 3 days before travel: no refund (0%). A live preview is always shown prior to confirmation.'
        }
      ]
    },
    {
      category: 'Complaints & Support',
      icon: <MessageSquare className="w-4 h-4 text-rose-500" />,
      questions: [
        {
          q: 'How are complaints handled?',
          a: 'Customers can submit complaints with an optional booking reference. Employees and admins receive real-time notifications, can add timestamped notes, and update statuses from OPEN to IN_PROGRESS, RESOLVED, and CLOSED.'
        }
      ]
    }
  ];

  const filteredCategories = faqs
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) =>
          item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter((cat) => cat.questions.length > 0);

  const toggleAccordion = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 items-center justify-center mb-1">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Help & Documentation</h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Search frequently asked questions, understand role permissions, and explore system business rules.
        </p>

        {/* Search */}
        <div className="pt-4 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search help by keyword (e.g. refund, roles, password)..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-6">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            No matching help articles found for "{searchTerm}".
          </div>
        ) : (
          filteredCategories.map((cat, catIdx) => (
            <div key={cat.category} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
                {cat.icon}
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {cat.category}
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {cat.questions.map((item, qIdx) => {
                  const globalIdx = `${catIdx}-${qIdx}`;
                  const isOpen = openSection === globalIdx;

                  return (
                    <div key={item.q} className="p-4 sm:p-5">
                      <button
                        onClick={() => toggleAccordion(globalIdx)}
                        className="w-full flex items-center justify-between text-left group"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isOpen ? 'transform rotate-180 text-sky-600' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-1 animate-in fade-in">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HelpPage;
