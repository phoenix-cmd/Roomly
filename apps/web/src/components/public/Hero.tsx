import React from 'react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage:
          'linear-gradient(rgba(36, 35, 31, 0.45), rgba(36, 35, 31, 0.65)), url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#FFFFFF',
        textAlign: 'center',
        padding: '80px var(--space-lg)',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div
          style={{
            fontSize: '0.85rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--color-champagne-light)',
            marginBottom: '20px',
            fontWeight: 500,
          }}
        >
          Côte d'Azur • French Riviera
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-editorial)',
            color: '#FFFFFF',
            fontSize: 'clamp(2.75rem, 5.5vw, 4.75rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: '24px',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}
        >
          Where Timeless Mediterranean Grace Meets Serene Seclusion
        </h1>

        <p
          style={{
            color: 'var(--color-sandstone-light)',
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            maxWidth: '720px',
            margin: '0 auto 36px auto',
            lineHeight: '1.6',
            fontWeight: 300,
          }}
        >
          An extraordinary sanctuary on the cliffs of Cannes. Private cove beaches, Michelin-starred coastal dining, and suites framed by the Mediterranean horizon.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/rooms" className="btn btn-gold">
            Explore Suites & Villas
          </Link>
          <a href="#story" className="btn btn-outline" style={{ borderColor: '#FFFFFF', color: '#FFFFFF' }}>
            Discover The Sanctuary
          </a>
        </div>
      </div>
    </section>
  );
};
