import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedGlobalRoles?: ('GUEST' | 'PLATFORM_ADMIN')[];
  allowedHotelRoles?: ('HOTEL_MANAGER' | 'FRONT_DESK' | 'HOUSEKEEPING')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedGlobalRoles,
  allowedHotelRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--color-text-muted)' }}>
        Authenticating access to sanctuary...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Platform Admins have full access to everything
  if (user.globalRole === 'PLATFORM_ADMIN') {
    return <>{children}</>;
  }

  // Check global role restriction
  if (allowedGlobalRoles && !allowedGlobalRoles.includes(user.globalRole)) {
    return <Navigate to="/" replace />;
  }

  // Check hotel membership role restriction
  if (allowedHotelRoles) {
    const hasRole = user.memberships?.some((m) =>
      allowedHotelRoles.includes(m.role as any)
    );
    if (!hasRole) {
      return (
        <div style={{ backgroundColor: '#FAF8F5', minHeight: '80vh', padding: '80px 16px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <div className="luxury-card" style={{ padding: '40px', backgroundColor: '#FFFFFF' }}>
              <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-warning)', fontWeight: 600, marginBottom: '8px' }}>
                Access Restricted
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Sanctuary Portal Authorization Required</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Your current account ({user.email}) does not possess staff or management credentials for this hotel property.
              </p>
              <a href="/" className="btn btn-gold">
                Return to Sanctuary Home
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

