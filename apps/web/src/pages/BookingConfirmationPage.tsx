import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client.js';
import { IBooking } from '../types/index.js';
import { CheckCircle2, Calendar, MapPin, User, Printer } from 'lucide-react';

export const BookingConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await apiClient.get(`/bookings/${id}`);
        setBooking(res.data.data.booking);
      } catch (err) {
        console.error('Error fetching booking confirmation:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadBooking();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--color-text-muted)' }}>
        Loading your reservation confirmation...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2>Reservation Not Found</h2>
        <p style={{ marginTop: '12px', marginBottom: '24px' }}>
          We could not locate this booking record.
        </p>
        <Link to="/" className="btn btn-dark">Return to Home</Link>
      </div>
    );
  }

  const hotel = typeof booking.hotelId === 'object' ? booking.hotelId : null;
  const roomCategory = typeof booking.roomCategoryId === 'object' ? booking.roomCategoryId : null;

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        {/* Confirmation Banner */}
        <div
          className="luxury-card"
          style={{
            padding: '48px',
            textAlign: 'center',
            marginBottom: '32px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <div
            style={{
              fontSize: '0.8rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--color-champagne-gold)',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Reservation Confirmed
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', marginBottom: '16px' }}>
            We Await Your Arrival
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '580px', margin: '0 auto 28px auto' }}>
            A formal confirmation dossier has been dispatched to <strong>{booking.guestDetails.email}</strong>.
          </p>

          <div
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              backgroundColor: '#FAF7F2',
              border: '1px dashed var(--color-champagne-gold)',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>
              Official Confirmation Code
            </div>
            <div
              style={{
                fontFamily: 'var(--font-editorial)',
                fontSize: '2rem',
                letterSpacing: '0.1em',
                fontWeight: 600,
                color: 'var(--color-deep-charcoal)',
              }}
            >
              {booking.confirmationCode}
            </div>
          </div>
        </div>

        {/* Detailed Stay Dossier */}
        <div className="luxury-card" style={{ padding: '40px', backgroundColor: '#FFFFFF', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.75rem', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
            Stay Itinerary & Property
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-champagne-gold)', marginBottom: '6px' }}>
                <MapPin size={16} />
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                  Property
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{hotel?.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {hotel?.address.street}, {hotel?.address.city}, {hotel?.address.country}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-champagne-gold)', marginBottom: '6px' }}>
                <Calendar size={16} />
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                  Duration
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {booking.checkInDate} to {booking.checkOutDate}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {booking.nights} Nights • {booking.adults} Adults
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-champagne-gold)', marginBottom: '6px' }}>
                <User size={16} />
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                  Primary Guest
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {booking.guestDetails.firstName} {booking.guestDetails.lastName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {booking.guestDetails.phone || 'No phone supplied'}
              </div>
            </div>
          </div>

          {/* Pricing Settlement */}
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                Total Paid Settlement
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>
                Status: PAID IN FULL
              </div>
            </div>

            <div className="price-tag" style={{ fontSize: '2rem' }}>
              ${Math.round(booking.pricingSnapshot.totalCents / 100).toLocaleString()} USD
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} /> Print Itinerary
          </button>
          <Link to="/dashboard" className="btn btn-dark">
            View in Guest Dashboard
          </Link>
          <Link to="/" className="btn btn-gold">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
