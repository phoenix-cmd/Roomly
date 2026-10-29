import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { IBooking } from '../types/index.js';
import { Calendar, MapPin, Clock, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GuestDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/bookings/my-bookings');
      setBookings(res.data.data.bookings);
    } catch (err) {
      console.error('Error loading guest bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you certain you wish to cancel this reservation? All inventory will be released and refund initiated according to cancellation policy.')) {
      return;
    }

    try {
      await apiClient.post(`/bookings/${bookingId}/cancel`, {
        reason: 'Guest self-service cancellation from dashboard',
      });
      setActionMessage('Your reservation was cancelled successfully and inventory was restored.');
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="badge badge-success">Confirmed</span>;
      case 'CHECKED_IN':
        return <span className="badge badge-info">In House (Checked In)</span>;
      case 'CHECKED_OUT':
        return <span className="badge badge-info">Completed Stay</span>;
      case 'CANCELLED':
        return <span className="badge badge-error">Cancelled</span>;
      case 'PENDING_PAYMENT':
        return <span className="badge badge-warning">Pending Payment</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-champagne-gold)', fontWeight: 600 }}>
            Guest Sanctuary
          </div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)', marginTop: '4px' }}>
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Manage your past and upcoming hotel reservations, track refund requests, and access stay itineraries.
          </p>
        </div>

        {actionMessage && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              borderRadius: '4px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <CheckCircle2 size={20} />
            <div>{actionMessage}</div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
            Retrieving your stay history...
          </div>
        ) : bookings.length === 0 ? (
          <div className="luxury-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '12px' }}>No Active Reservations</h3>
            <p style={{ maxWidth: '480px', margin: '0 auto 24px auto' }}>
              You do not have any active or past reservations under this guest account.
            </p>
            <Link to="/rooms" className="btn btn-gold">
              Explore Living Spaces & Reserve
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {bookings.map((b) => {
              const hotel = typeof b.hotelId === 'object' ? b.hotelId : null;
              const category = typeof b.roomCategoryId === 'object' ? b.roomCategoryId : null;
              const isCancellable = ['CONFIRMED', 'PENDING_PAYMENT'].includes(b.status);

              return (
                <div key={b._id} className="luxury-card" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.4rem', fontWeight: 600 }}>
                          {b.confirmationCode}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <h2 style={{ fontSize: '1.75rem' }}>{category?.name || 'Living Suite'}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                        <MapPin size={14} />
                        <span>{hotel?.name} ({hotel?.address.city}, {hotel?.address.country})</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="price-tag">${Math.round(b.pricingSnapshot.totalCents / 100).toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total settled (USD)</div>
                    </div>
                  </div>

                  {/* Dates & Specs */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '16px',
                      padding: '16px 20px',
                      backgroundColor: '#FAF8F5',
                      borderRadius: '4px',
                      marginBottom: '20px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Check-In</div>
                      <div style={{ fontWeight: 600 }}>{b.checkInDate} (15:00)</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Check-Out</div>
                      <div style={{ fontWeight: 600 }}>{b.checkOutDate} (11:00)</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Nights & Guests</div>
                      <div style={{ fontWeight: 600 }}>{b.nights} Nights • {b.adults} Adults</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Link to={`/confirmation/${b._id}`} className="btn btn-outline btn-sm">
                      View Itinerary
                    </Link>
                    {isCancellable && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
