import React from 'react';
import { Utensils, Waves, Sparkles, Compass } from 'lucide-react';

export const AmenitiesSection: React.FC = () => {
  const experiences = [
    {
      title: 'Michelin Coastal Gastronomy',
      description:
        'Savor tasting menus crafted with fresh Mediterranean catch, Provençal truffles, and rare vintage crus paired by our Head Sommelier.',
      icon: <Utensils size={28} color="var(--color-champagne-gold)" />,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Cliffside Infinity Pool & Coves',
      description:
        'Drift in heated sea-salt water perched 40 meters above the bay, with secluded teak cabanas and continuous champagne service.',
      icon: <Waves size={28} color="var(--color-champagne-gold)" />,
      image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Holistic Thalassotherapy Spa',
      description:
        'Revitalize mind and body through custom hydrotherapy circuits, marine algae wraps, and private outdoor eucalyptus saunas.',
      icon: <Sparkles size={28} color="var(--color-champagne-gold)" />,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Private Yacht & Helicopter Charter',
      description:
        'Embark directly from our private deep-water dock to Saint-Tropez, Monaco, or the secluded Îles de Lérins archipelago.',
      icon: <Compass size={28} color="var(--color-champagne-gold)" />,
      image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <section id="amenities" className="section-spacing" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 64px auto' }}>
          <div
            style={{
              fontSize: '0.8rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--color-champagne-gold)',
              marginBottom: '16px',
              fontWeight: 600,
            }}
          >
            Exclusive Experiences
          </div>
          <h2 style={{ fontSize: 'clamp(2.25rem, 3.5vw, 3.25rem)', marginBottom: '20px' }}>
            Art of Hospitality, Mastered
          </h2>
          <p style={{ lineHeight: '1.7' }}>
            Every moment at Roomly properties is carefully orchestrated to inspire delight, quiet contemplation, and uncompromised luxury.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(20px, 3vw, 32px)',
          }}
        >
          {experiences.map((exp, idx) => (
            <div
              key={idx}
              className="luxury-card"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ height: '220px', overflow: 'hidden' }}>
                <img
                  src={exp.image}
                  alt={exp.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                />
              </div>

              <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '16px' }}>{exp.icon}</div>
                <h3 style={{ fontSize: '1.45rem', marginBottom: '12px' }}>{exp.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
