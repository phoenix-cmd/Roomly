import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-deep-charcoal)',
        color: 'var(--color-warm-ivory)',
        padding: '80px 0 40px 0',
        marginTop: '80px',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '48px',
            marginBottom: '60px',
          }}
        >
          {/* Brand Info */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-editorial)',
                fontSize: '2rem',
                letterSpacing: '0.2em',
                marginBottom: '16px',
                color: '#FFFFFF',
              }}
            >
              ROOMLY
            </div>
            <p style={{ color: 'var(--color-sandstone)', fontSize: '0.9rem', lineHeight: '1.7' }}>
              Curating rare sanctuaries of architectural grace, tranquil seclusion, and Michelin-starred Mediterranean gastronomy.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-champagne-gold)',
                marginBottom: '20px',
              }}
            >
              Sanctuaries
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link to="/rooms" style={{ color: 'var(--color-sandstone)', fontSize: '0.9rem' }}>
                  The Grand Azure Riviera (Cannes)
                </Link>
              </li>
              <li>
                <Link to="/rooms" style={{ color: 'var(--color-sandstone)', fontSize: '0.9rem' }}>
                  Aethelgard Manor & Alpine Spa (St. Moritz)
                </Link>
              </li>
              <li>
                <Link to="/rooms" style={{ color: 'var(--color-sandstone)', fontSize: '0.9rem' }}>
                  Private Coastal Villas
                </Link>
              </li>
            </ul>
          </div>

          {/* Concierge & Policies */}
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-champagne-gold)',
                marginBottom: '20px',
              }}
            >
              Hospitality Concierge
            </div>
            <p style={{ color: 'var(--color-sandstone)', fontSize: '0.9rem', marginBottom: '8px' }}>
              Email: concierge@riviera.luxury
            </p>
            <p style={{ color: 'var(--color-sandstone)', fontSize: '0.9rem', marginBottom: '8px' }}>
              Direct: +33 4 93 39 00 00
            </p>
            <p style={{ color: 'var(--color-sandstone)', fontSize: '0.9rem' }}>
              Check-in 15:00 • Check-out 11:00
            </p>
          </div>

          {/* Accreditations */}
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-champagne-gold)',
                marginBottom: '20px',
              }}
            >
              Accolades
            </div>
            <p style={{ color: 'var(--color-sandstone)', fontSize: '0.85rem', lineHeight: '1.6' }}>
              • Leading Hotels of the World (5-Star Diamond)<br />
              • Prix Versailles Architecture Laureate 2025<br />
              • Michelin Guide Key Award 2026
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(230, 222, 210, 0.15)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--color-sandstone)',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>© {new Date().getFullYear()} Roomly Hospitality Group. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Reservation</span>
            <span>Guest Charter</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
