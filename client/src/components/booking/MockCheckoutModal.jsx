import React, { useState } from 'react';
import api from '../../api/axios';
import {
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';

const MockCheckoutModal = ({ isOpen, onClose, booking, onPaymentSuccess }) => {
  if (!isOpen || !booking) return null;

  const [method, setMethod] = useState('CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idempotentMsg, setIdempotentMsg] = useState('');
  const [lastPaymentId, setLastPaymentId] = useState('');

  // Card details
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8890');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('782');

  // UPI details
  const [upiId, setUpiId] = useState('customer@okhdfcbank');

  // Netbanking details
  const [bank, setBank] = useState('HDFC Bank');

  const totalAmount = booking.priceBreakdown?.total || 0;

  const handlePay = async (simulateSuccess = true, forceDuplicate = false) => {
    setLoading(true);
    setError('');
    setIdempotentMsg('');

    try {
      // 1. Create Gateway Order
      const orderRes = await api.post('/payments/create-order', {
        bookingId: booking.bookingId,
        gatewayName: 'MockGateway'
      });

      const orderId = orderRes.data?.order?.orderId || `order_mock_${Date.now()}`;
      
      // Determine payment ID to use
      let paymentIdToUse = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      if (forceDuplicate && lastPaymentId) {
        paymentIdToUse = lastPaymentId; // Send duplicate paymentId to test idempotency
      }

      // 2. Verify Payment
      const verifyRes = await api.post('/payments/verify', {
        bookingId: booking.bookingId,
        orderId,
        paymentId: paymentIdToUse,
        method,
        simulateSuccess,
        failureReason: simulateSuccess ? null : 'Payment declined by bank: Insufficient funds or invalid OTP',
        gatewayName: 'MockGateway'
      });

      if (verifyRes.data?.success) {
        setLastPaymentId(paymentIdToUse);

        if (verifyRes.data?.idempotent) {
          setIdempotentMsg('Idempotency verified: Duplicate payment callback received! Backend safely returned existing confirmation without duplicate billing or double-invoicing.');
          setLoading(false);
          return;
        }

        if (onPaymentSuccess) {
          onPaymentSuccess(verifyRes.data);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment transaction failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                TEST MODE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {booking.bookingId}
              </span>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Payable</p>
              <h2 className="text-2xl font-black text-white tracking-tight">
                ₹{totalAmount.toLocaleString('en-IN')}
              </h2>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <Lock className="w-3.5 h-3.5" /> 256-bit Encrypted
              </div>
              <p className="text-[10px] text-slate-500">Mock Payment Gateway</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Method Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('CARD')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-semibold transition ${
                  method === 'CARD'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1" /> Credit / Debit Card
              </button>

              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-semibold transition ${
                  method === 'UPI'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5 mb-1" /> UPI / QR
              </button>

              <button
                type="button"
                onClick={() => setMethod('NETBANKING')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-semibold transition ${
                  method === 'NETBANKING'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-5 h-5 mb-1" /> Net Banking
              </button>
            </div>
          </div>

          {/* Method Specific Inputs (Simulated) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            {method === 'CARD' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Card Number (Demo)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'UPI' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@upi"
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepts Google Pay, PhonePe, Paytm, or BHIM VPA simulation.
                </p>
              </div>
            )}

            {method === 'NETBANKING' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Choose Bank
                </label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                </select>
              </div>
            )}
          </div>

          {/* Status Alerts */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <div>
                <span className="font-bold block">Payment Declined</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {idempotentMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 animate-fadeIn">
              <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 animate-spin" />
              <div>
                <span className="font-bold block">Idempotency Callback Handled</span>
                <span>{idempotentMsg}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePay(true, false)}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Pay ₹{totalAmount.toLocaleString('en-IN')} (Success Path)
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePay(false, false)}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" /> Pay (Simulate Failure)
              </button>

              <button
                type="button"
                disabled={loading || !lastPaymentId}
                onClick={() => handlePay(true, true)}
                title={lastPaymentId ? "Sends duplicate callback with previous payment ID" : "Execute a successful payment first"}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  lastPaymentId
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Test Idempotency
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockCheckoutModal;
