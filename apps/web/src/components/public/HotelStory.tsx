import React from 'react';

export const HotelStory: React.FC = () => {
  return (
    <section id="story" className="section-spacing" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '64px',
            alignItems: 'center',
          }}
        >
          {/* Story Text */}
          <div>
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
              The Sanctuary
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.25rem, 3.5vw, 3.25rem)',
                marginBottom: '24px',
                lineHeight: 1.15,
              }}
            >
              An Architectural Ode to Mediterranean Grandeur
            </h2>

            <p style={{ marginBottom: '20px', lineHeight: '1.8' }}>
              Carved into the historic seaside promontory of Cannes, The Grand Azure Riviera honors the golden era of French coastal hospitality. Designed by world-renowned architectural conservators, the estate marries belle époque balustrades with serene, sun-washed minimalist interiors.
            </p>

            <p style={{ marginBottom: '32px', lineHeight: '1.8' }}>
              Every suite is an individual gallery: bespoke French oak millwork, hand-chiseled Carrara marble baths, and private terraces cantilevered over crystal Mediterranean waves. Here, time slows to the rhythm of ocean breezes.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '24px',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--color-champagne-gold)' }}>
                  1928
                </div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                  Historic Heritage
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--color-champagne-gold)' }}>
                  3 Michelin Keys
                </div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                  World Hospitality Accolade
                </div>
              </div>
            </div>
          </div>

          {/* Asymmetric Image Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
            <img
              src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
              alt="Panoramic Mediterranean Terrace"
              style={{
                width: '100%',
                height: '420px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-card)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                alt="Heated Infinity Pool at Sunset"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              />
              <img
                src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"
                alt="Private Dining Pier"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
