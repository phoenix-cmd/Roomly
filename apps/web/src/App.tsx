import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Header } from './components/common/Header.js';
import { Footer } from './components/common/Footer.js';

// Pages
import { HomePage } from './pages/HomePage.js';
import { RoomsPage } from './pages/RoomsPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage.js';
import { GuestDashboardPage } from './pages/GuestDashboardPage.js';
import { StaffDashboardPage } from './pages/StaffDashboardPage.js';
import { HousekeepingPage } from './pages/HousekeepingPage.js';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/confirmation/:id" element={<BookingConfirmationPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Guest Portal */}
              <Route path="/dashboard" element={<GuestDashboardPage />} />

              {/* Staff Front-Desk Portal */}
              <Route path="/staff/dashboard" element={<StaffDashboardPage />} />

              {/* Housekeeping Operations Portal */}
              <Route path="/staff/housekeeping" element={<HousekeepingPage />} />

              {/* Hotel Manager Portal */}
              <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />

              {/* Platform Administration Portal */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
