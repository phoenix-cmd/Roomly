import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Header } from './components/common/Header.js';
import { Footer } from './components/common/Footer.js';
import { ProtectedRoute } from './components/common/ProtectedRoute.js';

// Lazy-loaded routes for code-splitting & optimal performance
const HomePage = lazy(() => import('./pages/HomePage.js').then((m) => ({ default: m.HomePage })));
const RoomsPage = lazy(() => import('./pages/RoomsPage.js').then((m) => ({ default: m.RoomsPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.js').then((m) => ({ default: m.CheckoutPage })));
const BookingConfirmationPage = lazy(() =>
  import('./pages/BookingConfirmationPage.js').then((m) => ({ default: m.BookingConfirmationPage }))
);
const GuestDashboardPage = lazy(() =>
  import('./pages/GuestDashboardPage.js').then((m) => ({ default: m.GuestDashboardPage }))
);
const StaffDashboardPage = lazy(() =>
  import('./pages/StaffDashboardPage.js').then((m) => ({ default: m.StaffDashboardPage }))
);
const HousekeepingPage = lazy(() =>
  import('./pages/HousekeepingPage.js').then((m) => ({ default: m.HousekeepingPage }))
);
const ManagerDashboardPage = lazy(() =>
  import('./pages/ManagerDashboardPage.js').then((m) => ({ default: m.ManagerDashboardPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage.js').then((m) => ({ default: m.AdminDashboardPage }))
);
const LoginPage = lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.js').then((m) => ({ default: m.NotFoundPage })));

const RouteLoadingFallback = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-text-muted)',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.9rem',
      letterSpacing: '0.05em',
    }}
  >
    Entering sanctuary...
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/confirmation/:id" element={<BookingConfirmationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Guest Portal */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <GuestDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Front-Desk Portal */}
                <Route
                  path="/staff/dashboard"
                  element={
                    <ProtectedRoute allowedHotelRoles={['FRONT_DESK', 'HOTEL_MANAGER']}>
                      <StaffDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Housekeeping Operations Portal */}
                <Route
                  path="/staff/housekeeping"
                  element={
                    <ProtectedRoute allowedHotelRoles={['HOUSEKEEPING', 'FRONT_DESK', 'HOTEL_MANAGER']}>
                      <HousekeepingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Hotel Manager Portal */}
                <Route
                  path="/manager/dashboard"
                  element={
                    <ProtectedRoute allowedHotelRoles={['HOTEL_MANAGER']}>
                      <ManagerDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Platform Administration Portal */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedGlobalRoles={['PLATFORM_ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Branded 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
