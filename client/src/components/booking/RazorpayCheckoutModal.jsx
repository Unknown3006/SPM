import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
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
  X,
  ShieldCheck,
  Check,
  Zap,
  Info
} from 'lucide-react';

// Safely load Razorpay checkout SDK dynamically when needed without blocking page load
const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        // Blocked by ad-blocker or offline; fallback cleanly
        resolve(false);
      };
      document.body.appendChild(script);
    } catch (e) {
      resolve(false);
    }
  });
};

const RazorpayCheckoutModal = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess
}) => {
  if (!isOpen || !booking) return null;

  const { user } = useAuth();
  const [method, setMethod] = useState('CARD'); // 'CARD' | 'UPI' | 'NETBANKING'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [useFallbackModal, setUseFallbackModal] = useState(false);

  // Card details
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('883');

  // UPI details
  const [upiId, setUpiId] = useState('success@razorpay');

  // Netbanking details
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  const totalAmount = booking.priceBreakdown?.total || 0;

  // Initialize order and check Razorpay config
  useEffect(() => {
    let isMounted = true;

    const initOrder = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Get Razorpay Config from server
        const configRes = await api.get('/payments/razorpay-config');
        if (isMounted && configRes.data?.success) {
          setConfig(configRes.data);
        }

        // 2. Create Razorpay order
        const orderRes = await api.post('/payments/create-order', {
          bookingId: booking.bookingId,
          gatewayName: 'Razorpay'
        });

        if (isMounted && orderRes.data?.success) {
          const order = orderRes.data.order;
          setOrderData(order);

          // If real key exists, try loading Razorpay SDK
          if (configRes.data?.isRealKey && typeof window !== 'undefined') {
            const sdkReady = await loadRazorpaySDK();
            if (sdkReady && window.Razorpay) {
              try {
                const options = {
                  key: configRes.data.keyId,
                  amount: order.amountInPaise,
                  currency: order.currency || 'INR',
                  name: 'TMS Travel & Tour',
                  description: `Booking #${booking.bookingId}`,
                  order_id: order.orderId,
                  handler: async function (response) {
                    await handleVerifyPayment({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      method: 'RAZORPAY_CHECKOUT'
                    });
                  },
                  prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || '9876543210'
                  },
                  theme: {
                    color: '#0284c7'
                  },
                  modal: {
                    ondismiss: function () {
                      setError('Payment was cancelled. Your booking remains reserved in Pending Payment.');
                    }
                  }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                  setError(`Payment Failed: ${response.error.description || 'Transaction declined'}`);
                });
                rzp.open();
                setLoading(false);
                return;
              } catch (sdkErr) {
                console.warn('[Razorpay SDK Notice] Opening standard interactive test modal:', sdkErr.message);
                setUseFallbackModal(true);
              }
            } else {
              setUseFallbackModal(true);
            }
          } else {
            // Standard interactive Razorpay Test Modal
            setUseFallbackModal(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Could not initiate Razorpay order. Using test simulation.');
          setUseFallbackModal(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initOrder();

    return () => {
      isMounted = false;
    };
  }, [booking.bookingId]);

  // Verify payment on backend
  const handleVerifyPayment = async ({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    methodToUse = method,
    simulateSuccess = true
  }) => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        bookingId: booking.bookingId,
        orderId: razorpay_order_id || orderData?.orderId || `order_rzp_${Date.now()}`,
        paymentId: razorpay_payment_id || `pay_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        method: methodToUse,
        simulateSuccess,
        failureReason: simulateSuccess ? null : 'Payment declined: Insufficient test funds or OTP expired',
        gatewayName: 'Razorpay'
      };

      if (razorpay_signature) {
        payload.razorpay_signature = razorpay_signature;
        payload.razorpay_order_id = razorpay_order_id;
        payload.razorpay_payment_id = razorpay_payment_id;
      }

      const res = await api.post('/payments/verify', payload);

      if (res.data?.success) {
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick simulated Razorpay payment
  const handleSimulatePayment = (success = true) => {
    const orderIdToUse = orderData?.orderId || `order_rzp_${Date.now()}`;
    const paymentIdToUse = `pay_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    handleVerifyPayment({
      razorpay_order_id: orderIdToUse,
      razorpay_payment_id: paymentIdToUse,
      methodToUse: method,
      simulateSuccess: success
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all animate-fadeIn">
        {/* Razorpay Branded Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                RAZORPAY TEST MODE
              </span>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
              title="Close payment window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Paying for Booking:</p>
              <p className="text-base font-mono font-bold text-white mt-0.5">
                {booking.bookingId}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 capitalize">
                {booking.itemType} • {booking.numberOfTravellers} Traveller(s)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Payable</span>
              <p className="text-2xl font-black text-sky-400 tracking-tight">
                ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-shake">
              <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Transaction Failed</p>
                <p className="mt-0.5 text-[11px]">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMethod('CARD')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                method === 'CARD'
                  ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${method === 'CARD' ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('UPI')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                method === 'UPI'
                  ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone className={`w-5 h-5 ${method === 'UPI' ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('NETBANKING')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                method === 'NETBANKING'
                  ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className={`w-5 h-5 ${method === 'NETBANKING' ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>NetBanking</span>
            </button>
          </div>

          {/* Method 1: Card Form */}
          {method === 'CARD' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">Razorpay Test Card Details</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                  Test Credentials
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Method 2: UPI Form */}
          {method === 'UPI' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="font-semibold text-slate-700 text-xs">Virtual Payment Address (VPA)</span>
              <div>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. success@razorpay or name@okhdfcbank"
                  className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Test VPAs: <code className="text-sky-700 font-bold">success@razorpay</code> or <code className="text-sky-700 font-bold">failure@razorpay</code>
              </p>
            </div>
          )}

          {/* Method 3: NetBanking */}
          {method === 'NETBANKING' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="font-semibold text-slate-700 text-xs">Select Authorized Bank</span>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBank(b)}
                    className={`p-2.5 rounded-xl border text-xs text-left transition font-medium ${
                      selectedBank === b
                        ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Razorpay Test Mode Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSimulatePayment(true)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 active:scale-98 text-white font-bold text-xs rounded-2xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Razorpay Transaction...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" /> Pay ₹{totalAmount.toLocaleString('en-IN')} (Razorpay Test Mode)
                </>
              )}
            </button>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSimulatePayment(false)}
                className="w-1/2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-xl border border-rose-200 transition"
              >
                Test Payment Failure
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="w-1/2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl transition"
              >
                Cancel Payment
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Razorpay Test Mode Enabled
            </span>
            <span>No real money will be charged</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCheckoutModal;
