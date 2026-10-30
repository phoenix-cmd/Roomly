import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#FAF8F5',
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 16px',
        textAlign: 'center',
      }}
    >
      <div className="container" style={{ maxWidth: '640px' }}>
        <div className="luxury-card" style={{ padding: '64px 32px', backgroundColor: '#FFFFFF' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#FAF7F2',
              color: 'var(--color-champagne-gold)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              border: '1px solid var(--color-champagne-light)',
            }}
          >
            <Compass size={32} />
          </div>

          <div
            style={{
              fontSize: '0.8rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--color-champagne-gold)',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            404 — Sanctuary Uncharted
          </div>

          <h1 style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)', marginBottom: '16px' }}>
            A Secluded Path Not Found
          </h1>

          <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', maxWidth: '480px', margin: '0 auto 36px auto' }}>
            The horizon you seek is beyond our present estate. Allow our concierge to guide you back to our curated suites and coastal grounds.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-gold">
              Return to Sanctuary
            </Link>
            <Link to="/rooms" className="btn btn-outline">
              Explore Available Suites
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

