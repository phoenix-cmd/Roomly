import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Search } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface BookingBarProps {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialChildren?: number;
  onSearch?: (params: { checkInDate: string; checkOutDate: string; adults: number; children: number }) => void;
}

export const BookingBar: React.FC<BookingBarProps> = ({
  initialCheckIn,
  initialCheckOut,
  initialAdults = 2,
  initialChildren = 0,
  onSearch,
}) => {
  const navigate = useNavigate();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const defaultCheckIn = initialCheckIn || format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const defaultCheckOut = initialCheckOut || format(addDays(new Date(), 4), 'yyyy-MM-dd');

  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  const [adults, setAdults] = useState(initialAdults);
  const [childrenCount, setChildrenCount] = useState(initialChildren);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (checkOutDate <= checkInDate) {
      setError('Check-out date must be after check-in date.');
      return;
    }
    setError(null);

    if (onSearch) {
      onSearch({ checkInDate, checkOutDate, adults, children: childrenCount });
    } else {
      navigate(
        `/rooms?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=${adults}&children=${childrenCount}`
      );
    }
  };

  return (
    <div className="booking-bar-wrapper">
      <form onSubmit={handleSubmit} className="luxury-card booking-bar-form">
        {/* Check-In Date */}
        <div>
          <label
            htmlFor="booking-check-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}
          >
            <Calendar size={14} color="var(--color-champagne-gold)" /> Check-In
          </label>
          <input
            id="booking-check-in"
            type="date"
            min={todayStr}
            value={checkInDate}
            onChange={(e) => {
              setCheckInDate(e.target.value);
              if (checkOutDate <= e.target.value) {
                setCheckOutDate(format(addDays(new Date(e.target.value), 2), 'yyyy-MM-dd'));
              }
            }}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              outline: 'none',
              backgroundColor: '#FAFAF7',
            }}
          />
        </div>

        {/* Check-Out Date */}
        <div>
          <label
            htmlFor="booking-check-out"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}
          >
            <Calendar size={14} color="var(--color-champagne-gold)" /> Check-Out
          </label>
          <input
            id="booking-check-out"
            type="date"
            min={checkInDate}
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              outline: 'none',
              backgroundColor: '#FAFAF7',
            }}
          />
        </div>

        {/* Adults Count */}
        <div>
          <label
            htmlFor="booking-adults"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}
          >
            <Users size={14} color="var(--color-champagne-gold)" /> Adults
          </label>
          <select
            id="booking-adults"
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              backgroundColor: '#FAFAF7',
            }}
          >
            <option value={1}>1 Adult</option>
            <option value={2}>2 Adults</option>
            <option value={3}>3 Adults</option>
            <option value={4}>4 Adults</option>
          </select>
        </div>

        {/* Children Count */}
        <div>
          <label
            htmlFor="booking-children"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}
          >
            <Users size={14} color="var(--color-champagne-gold)" /> Children
          </label>
          <select
            id="booking-children"
            value={childrenCount}
            onChange={(e) => setChildrenCount(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              backgroundColor: '#FAFAF7',
            }}
          >
            <option value={0}>No Children</option>
            <option value={1}>1 Child</option>
            <option value={2}>2 Children</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="booking-bar-submit-wrap">
          <button
            type="submit"
            className="btn btn-gold booking-bar-submit"
          >
            <Search size={16} /> Check Availability
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            borderRadius: '4px',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
