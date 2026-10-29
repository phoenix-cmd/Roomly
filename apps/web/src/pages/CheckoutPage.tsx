import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { IRoomCategory, IHotel, IBooking, IAvailabilityInfo } from '../types/index.js';
import { ShieldCheck, Clock, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const categoryId = searchParams.get('categoryId') || '';
  const hotelId = searchParams.get('hotelId') || '';
  const checkInDate = searchParams.get('checkInDate') || format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const checkOutDate = searchParams.get('checkOutDate') || format(addDays(new Date(), 4), 'yyyy-MM-dd');
  const adults = parseInt(searchParams.get('adults') || '2', 10);
  const children = parseInt(searchParams.get('children') || '0', 10);

  const [category, setCategory] = useState<IRoomCategory | null>(null);
  const [hotel, setHotel] = useState<IHotel | null>(null);
  const [availability, setAvailability] = useState<IAvailabilityInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState(user?.firstName || 'Eleanora');
  const [lastName, setLastName] = useState(user?.lastName || 'Vane');
  const [email, setEmail] = useState(user?.email || 'guest@example.com');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [specialRequests, setSpecialRequests] = useState('Chilled champagne on arrival');

  // Checkout process state
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'PROCESSING'>('DETAILS');
  const [holdBooking, setHoldBooking] = useState<IBooking | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins (900 seconds)
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch category and live pricing snapshot
  useEffect(() => {
    async function loadPricing() {
      setLoading(true);
      try {
        const hotelRes = await apiClient.get(`/hotels/${hotelId}`);
        setHotel(hotelRes.data.data.hotel);

        const catRes = await apiClient.get(`/rooms/${hotelId}/categories/${categoryId}`);
        setCategory(catRes.data.data.category);

        const availRes = await apiClient.get(`/inventory/${hotelId}/category/${categoryId}`, {
          params: { checkInDate, checkOutDate },
        });
        setAvailability(availRes.data.data.availability);
      } catch (err: any) {
        setError(err.message || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    }
    if (hotelId && categoryId) {
      loadPricing();
    }
  }, [hotelId, categoryId, checkInDate, checkOutDate]);

  // 2. Countdown timer for hold
  useEffect(() => {
    if (step === 'PAYMENT' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // 3. Initiate temporary reservation hold
  const handleCreateHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      // Guide user to login first
      setError('Please sign in or select a demo persona to secure this reservation.');
      return;
    }

    try {
      setStep('PROCESSING');
      const res = await apiClient.post('/bookings/hold', {
        hotelId,
        roomCategoryId: categoryId,
        checkInDate,
        checkOutDate,
        adults,
        children,
        guestDetails: { firstName, lastName, email, phone, specialRequests },
      });

      const booking: IBooking = res.data.data.booking;
      setHoldBooking(booking);
      setStep('PAYMENT');
      setTimeLeft(900); // 15 minutes
    } catch (err: any) {
      setStep('DETAILS');
      setError(err.message || 'Failed to hold suite inventory.');
    }
  };

  // 4. Confirm Payment
  const handleConfirmPayment = async () => {
    if (!holdBooking) return;
    setError(null);
    setStep('PROCESSING');

    try {
      // 1. Create Payment Intent
      await apiClient.post('/payments/create-intent', {
        bookingId: holdBooking._id,
      });

      // 2. Execute verified server-side payment confirmation (test-double adapter)
      const confirmRes = await apiClient.post('/payments/confirm-mock', {
        bookingId: holdBooking._id,
      });

      const confirmedBooking: IBooking = confirmRes.data.data.booking;
      navigate(`/confirmation/${confirmedBooking._id}`);
    } catch (err: any) {
      setStep('PAYMENT');
      setError(err.message || 'Payment confirmation failed.');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--color-text-muted)' }}>
        Preparing your reservation details...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', padding: '60px 0 100px 0' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-champagne-gold)', marginBottom: '8px' }}>
            Checkout & Confirmation
          </div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)' }}>Complete Your Reservation</h1>
        </div>

        {error && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              borderRadius: '4px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle size={20} />
            <div>{error}</div>
          </div>
        )}

        {/* Hold Active Timer Banner */}
        {step === 'PAYMENT' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              backgroundColor: '#FCF5EB',
              border: '1px solid var(--color-champagne-light)',
              borderRadius: '4px',
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="var(--color-warning)" />
              <span style={{ fontWeight: 600, color: 'var(--color-deep-charcoal)' }}>
                Suite Inventory Held Exclusively For You:
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-warning)' }}>
              {formatTimer(timeLeft)}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Form & Payment Actions */}
          <div className="luxury-card" style={{ padding: '36px' }}>
            {step === 'DETAILS' && (
              <form onSubmit={handleCreateHold}>
                <h3 style={{ fontSize: '1.75rem', marginBottom: '24px' }}>Guest Details</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Dietary requirements, high floor preference, airport transfer..."
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'var(--font-sans)' }}
                  />
                </div>

                <button type="submit" className="btn btn-gold" style={{ width: '100%', padding: '14px 0' }}>
                  Hold Suite & Proceed to Payment
                </button>
              </form>
            )}

            {step === 'PAYMENT' && (
              <div>
                <h3 style={{ fontSize: '1.75rem', marginBottom: '20px' }}>Payment Verification</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                  Your suite is locked. Complete simulated payment to finalize your booking and generate your authoritative confirmation code.
                </p>

                <div
                  style={{
                    padding: '20px',
                    border: '1px solid var(--color-champagne-light)',
                    backgroundColor: '#FAF7F2',
                    borderRadius: '4px',
                    marginBottom: '28px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <CreditCard size={18} color="var(--color-champagne-gold)" />
                    <strong style={{ fontSize: '0.9rem' }}>Roomly Secure Sandbox Gateway</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Test mode: No real card charges applied. Server will cryptographically verify order amount and transition hold to confirmed status.
                  </div>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  className="btn btn-gold"
                  style={{ width: '100%', padding: '16px 0', fontSize: '0.95rem' }}
                >
                  Confirm & Pay ${availability ? Math.round(availability.totalCents / 100).toLocaleString() : ''}
                </button>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => setStep('DETAILS')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Edit Guest Details
                  </button>
                </div>
              </div>
            )}

            {step === 'PROCESSING' && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Clock size={36} color="var(--color-champagne-gold)" style={{ animation: 'spin 2s linear infinite', marginBottom: '16px' }} />
                <h3>Verifying Payment with Gateway...</h3>
                <p style={{ marginTop: '8px' }}>Please do not close or refresh this window.</p>
              </div>
            )}
          </div>

          {/* Right Column: Authoritative Pricing Summary Snapshot */}
          <div className="luxury-card" style={{ padding: '36px', backgroundColor: '#FFFFFF' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-champagne-gold)', fontWeight: 600, marginBottom: '6px' }}>
              Reservation Summary
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>{category?.name}</h3>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              {hotel?.name} • {hotel?.address.city}, {hotel?.address.country}
            </div>

            {/* Dates & Guests */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px 0',
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                marginBottom: '24px',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Check-In</div>
                <div style={{ fontWeight: 600 }}>{checkInDate}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>From 15:00</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Check-Out</div>
                <div style={{ fontWeight: 600 }}>{checkOutDate}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Until 11:00</div>
              </div>
            </div>

            {/* Price Breakdown */}
            {availability && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                  <span>{availability.nightlyRates.length} Nights Accommodation</span>
                  <span>${Math.round(availability.subtotalCents / 100).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  <span>Local Hospitality Taxes ({availability.taxPercent}%)</span>
                  <span>${Math.round(availability.taxCents / 100).toLocaleString()}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderTop: '2px solid var(--color-border)',
                    paddingTop: '16px',
                    marginTop: '16px',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Authoritative Total</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="price-tag" style={{ fontSize: '2rem' }}>
                      ${Math.round(availability.totalCents / 100).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>USD (Fully inclusive)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation terms */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 16px',
                backgroundColor: '#FAF8F5',
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.6',
              }}
            >
              <ShieldCheck size={18} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Flexible Guarantee:</strong> Free cancellation up to 48 hours prior to arrival. No advance cancellation penalty.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
