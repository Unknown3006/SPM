import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import BookingModal from '../../components/booking/BookingModal';
import {
  Building2,
  MapPin,
  Star,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  CreditCard,
  Wifi,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [nights, setNights] = useState(2);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchHotel = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hotels/${id}`);
        setHotel(res.data.hotel);
        if (res.data.hotel?.roomTypes?.length > 0) {
          setSelectedRoom(res.data.hotel.roomTypes[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Hotel not found');
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading hotel details...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Hotel Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested hotel does not exist.'}</p>
        <Link
          to="/hotels"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Hotels
        </Link>
      </div>
    );
  }

  const primaryImage =
    hotel.images && hotel.images.length > 0
      ? hotel.images[0]
      : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';

  const totalPrice = (hotel.pricePerNight || 0) * nights;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/hotels"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Hotels
      </Link>

      {/* Visual Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl h-80 sm:h-96">
        <img src={primaryImage} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>

        <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 text-white space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-600/90 backdrop-blur text-white">
              {hotel.city}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white">
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>{hotel.rating} Rating</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold">{hotel.name}</h1>
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-400" /> {hotel.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Amenities */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Hotel Amenities & Services</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {hotel.amenities?.map((am, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>{am}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Types */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Available Room Types</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hotel.roomTypes?.map((rt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedRoom(rt)}
                  className={`p-4 rounded-2xl border text-left text-xs font-semibold transition ${
                    selectedRoom === rt
                      ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-sm font-bold">{rt}</p>
                  <p className="text-[11px] text-slate-500 font-normal mt-1">King Bed, En-suite bath, City/Garden View</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6 lg:sticky lg:top-24">
          <div>
            <span className="text-xs text-slate-400 font-medium">Starting from</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-slate-900">
                ₹{hotel.pricePerNight?.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500">/ night</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Number of Nights</label>
            <input
              type="number"
              min="1"
              max="30"
              value={nights}
              onChange={(e) => setNights(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>{nights} Nights × ₹{hotel.pricePerNight?.toLocaleString('en-IN')}</span>
              <span className="font-semibold">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (5%)</span>
              <span className="font-semibold">₹{Math.round(totalPrice * 0.05).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
              <span>Estimated Total:</span>
              <span className="text-teal-700">₹{(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => setShowBookingModal(true)}
            className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-xs bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Reserve This Hotel Room
          </button>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          item={hotel}
          itemType="hotel"
        />
      )}
    </div>
  );
};

export default HotelDetailPage;
