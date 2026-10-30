import React, { useEffect, useState } from 'react';
import { Hero } from '../components/public/Hero.js';
import { BookingBar } from '../components/public/BookingBar.js';
import { HotelStory } from '../components/public/HotelStory.js';
import { RoomCard } from '../components/public/RoomCard.js';
import { RoomDetailsModal } from '../components/public/RoomDetailsModal.js';
import { AmenitiesSection } from '../components/public/AmenitiesSection.js';
import { apiClient } from '../api/client.js';
import { IHotel, IRoomCategory } from '../types/index.js';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [hotel, setHotel] = useState<IHotel | null>(null);
  const [categories, setCategories] = useState<IRoomCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IRoomCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const hotelsRes = await apiClient.get('/hotels');
        const hotelsList: IHotel[] = hotelsRes.data.data.hotels;
        if (hotelsList.length > 0) {
          const mainHotel = hotelsList[0];
          setHotel(mainHotel);

          const catRes = await apiClient.get(`/rooms/${mainHotel._id}/categories`);
          setCategories(catRes.data.data.categories);
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <Hero />
      <BookingBar />
      <HotelStory />

      {/* Featured Suites & Villas */}
      <section className="section-spacing" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px auto' }}>
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
              Living Spaces
            </div>
            <h2 style={{ fontSize: 'clamp(2.25rem, 3.5vw, 3.25rem)', marginBottom: '16px' }}>
              Suites of Quiet Splendor
            </h2>
            <p>
              Each suite is an intimate architectural retreat designed for unhurried contemplation, offering boundless Mediterranean panoramas and bespoke French craftsmanship.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              Loading curated suites...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
                gap: 'clamp(20px, 3vw, 32px)',
                marginBottom: '48px',
              }}
            >
              {categories.map((cat) => (
                <RoomCard
                  key={cat._id}
                  category={cat}
                  onOpenDetails={(c) => setSelectedCategory(c)}
                />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link to="/rooms" className="btn btn-outline">
              View All Living Spaces & Availability
            </Link>
          </div>
        </div>
      </section>

      <AmenitiesSection />

      {/* Verified Guest Reviews */}
      <section className="section-spacing" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-champagne-gold)', marginBottom: '12px' }}>
              Guest Impressions
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)' }}>Words from Our Guests</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'clamp(18px, 2.5vw, 32px)',
            }}
          >
            <div className="luxury-card card-padding-responsive">
              <div style={{ display: 'flex', gap: '4px', color: 'var(--color-champagne-gold)', marginBottom: '16px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--color-champagne-gold)" />)}
              </div>
              <p style={{ fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.8' }}>
                "The Azure Panoramic Suite exceeded every expectation. Waking up to the Cannes sunrise over a private breakfast terrace was pure poetry. The butler team anticipated every wish."
              </p>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sir Julian Croft</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Stayed October 2026</div>
            </div>

            <div className="luxury-card card-padding-responsive">
              <div style={{ display: 'flex', gap: '4px', color: 'var(--color-champagne-gold)', marginBottom: '16px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--color-champagne-gold)" />)}
              </div>
              <p style={{ fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.8' }}>
                "Incomparable serenity. The cliffside heated pool and the private cove beach club make this the finest hospitality sanctuary in Western Europe. We have already rebooked for next summer."
              </p>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Countess Valerie Von Berg</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Stayed September 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* Room Details Modal */}
      <RoomDetailsModal
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
};
