import React from 'react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: 'clamp(520px, 75vh, 760px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage:
          'linear-gradient(rgba(36, 35, 31, 0.45), rgba(36, 35, 31, 0.65)), url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#FFFFFF',
        textAlign: 'center',
        padding: 'clamp(60px, 10vw, 100px) clamp(16px, 4vw, 32px)',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <div
          style={{
            fontSize: 'clamp(0.72rem, 1.8vw, 0.85rem)',
            letterSpacing: 'clamp(0.15em, 2vw, 0.3em)',
            textTransform: 'uppercase',
            color: 'var(--color-champagne-light)',
            marginBottom: '16px',
            fontWeight: 500,
          }}
        >
          Côte d'Azur • French Riviera
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-editorial)',
            color: '#FFFFFF',
            fontSize: 'clamp(2.1rem, 5.5vw, 4.75rem)',
            fontWeight: 400,
            lineHeight: 1.12,
            marginBottom: '20px',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}
        >
          Where Timeless Mediterranean Grace Meets Serene Seclusion
        </h1>

        <p
          style={{
            color: 'var(--color-sandstone-light)',
            fontSize: 'clamp(0.95rem, 1.8vw, 1.25rem)',
            maxWidth: '720px',
            margin: '0 auto 32px auto',
            lineHeight: '1.6',
            fontWeight: 300,
          }}
        >
          An extraordinary sanctuary on the cliffs of Cannes. Private cove beaches, Michelin-starred coastal dining, and suites framed by the Mediterranean horizon.
        </p>

        <div className="btn-stack-mobile" style={{ justifyContent: 'center' }}>
          <Link to="/rooms" className="btn btn-gold">
            Explore Suites & Villas
          </Link>
          <a href="/#story" className="btn btn-outline" style={{ borderColor: '#FFFFFF', color: '#FFFFFF' }}>
            Discover The Sanctuary
          </a>
        </div>
      </div>
    </section>
  );
};
