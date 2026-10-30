import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const [activePolicy, setActivePolicy] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    if (!activePolicy) return;
    document.body.classList.add('drawer-open');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePolicy(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('drawer-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePolicy]);

  const policyContent: Record<string, { title: string; content: string }> = {
    privacy: {
      title: 'Privacy Policy',
      content:
        'Roomly Hospitality Group respects your privacy. Guest information is collected solely to process luxury reservations, provide personalized concierge services, and ensure security during your stay. We do not sell your personal data to third parties. All payment processing conforms to PCI-DSS Level 1 specifications.',
    },
    terms: {
      title: 'Terms of Reservation',
      content:
        'All suite reservations are guaranteed with credit card authorization. Cancellations made more than 48 hours prior to 15:00 local time on check-in date are eligible for a full refund. Check-in commences at 15:00 and check-out is required by 11:00. Room allotments and holds expire within 15 minutes if payment is not completed.',
    },
    charter: {
      title: 'Guest Charter & Tranquility Standards',
      content:
        'To ensure an atmosphere of peerless peace and seclusion for all guests, Roomly properties observe quiet hours between 22:00 and 07:00. Smoking is strictly prohibited within all suites and enclosed premises. Our concierge team is at your continuous disposal to fulfill bespoke requests.',
    },
  };
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 'clamp(28px, 4vw, 48px)',
            marginBottom: '60px',
          }}
        >
          {/* Brand Info */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-editorial)',
                fontSize: 'clamp(1.75rem, 4vw, 2rem)',
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
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0 }}>
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
          <div style={{ display: 'flex', gap: 'clamp(14px, 3vw, 24px)', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActivePolicy(policyContent.privacy)}
              style={{ background: 'none', border: 'none', color: 'var(--color-sandstone)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-sandstone)')}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActivePolicy(policyContent.terms)}
              style={{ background: 'none', border: 'none', color: 'var(--color-sandstone)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-sandstone)')}
            >
              Terms of Reservation
            </button>
            <button
              onClick={() => setActivePolicy(policyContent.charter)}
              style={{ background: 'none', border: 'none', color: 'var(--color-sandstone)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-sandstone)')}
            >
              Guest Charter
            </button>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {activePolicy && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(36, 35, 31, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 24px)',
          }}
          onClick={() => setActivePolicy(null)}
        >
          <div
            className="luxury-card card-padding-responsive"
            style={{ maxWidth: '560px', width: '100%', backgroundColor: '#FFFFFF', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePolicy(null)}
              aria-label="Close policy"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-champagne-gold)', marginBottom: '12px' }}>
              <ShieldCheck size={20} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Legal & Hospitality Policy
              </span>
            </div>

            <h3 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.75rem)', marginBottom: '16px', color: 'var(--color-deep-charcoal)' }}>
              {activePolicy.title}
            </h3>

            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '24px' }}>
              {activePolicy.content}
            </p>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setActivePolicy(null)} className="btn btn-gold btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
