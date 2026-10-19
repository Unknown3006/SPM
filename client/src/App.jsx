import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/user/ProfilePage';
import PackagesPage from './pages/catalog/PackagesPage';
import PackageDetailPage from './pages/catalog/PackageDetailPage';
import HotelsPage from './pages/catalog/HotelsPage';
import HotelDetailPage from './pages/catalog/HotelDetailPage';
import TransportPage from './pages/catalog/TransportPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import BookingConfirmationPage from './pages/booking/BookingConfirmationPage';
import HelpPage from './pages/HelpPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-slate-50">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/packages/:id" element={<PackageDetailPage />} />
              <Route path="/hotels" element={<HotelsPage />} />
              <Route path="/hotels/:id" element={<HotelDetailPage />} />
              <Route path="/transport" element={<TransportPage />} />
              <Route path="/help" element={<HelpPage />} />

              {/* Protected User Profile Route */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Customer Route */}
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'employee', 'admin']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/booking/confirmation"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'employee', 'admin']}>
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                }
              />

              {/* Employee Route */}
              <Route
                path="/agent/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['employee', 'admin']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Route */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
