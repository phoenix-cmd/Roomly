import React from 'react';
import { IRoomCategory, IAvailabilityInfo } from '../../types/index.js';
import { Users, Bed, Maximize2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoomCardProps {
  category: IRoomCategory;
  availability?: IAvailabilityInfo;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  childrenCount?: number;
  onOpenDetails: (category: IRoomCategory) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  category,
  availability,
  checkInDate,
  checkOutDate,
  adults = 2,
  childrenCount = 0,
  onOpenDetails,
}) => {
  const navigate = useNavigate();

  const primaryImage =
    category.images.find((img) => img.isPrimary)?.url ||
    category.images[0]?.url ||
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';

  const basePriceDollars = Math.round(category.basePriceCents / 100);
  const totalStayDollars = availability ? Math.round(availability.totalCents / 100) : null;

  const handleBookNow = () => {
    const params = new URLSearchParams({
      categoryId: category._id,
      hotelId: category.hotelId,
      ...(checkInDate && { checkInDate }),
      ...(checkOutDate && { checkOutDate }),
      adults: String(adults),
      children: String(childrenCount),
    });
    navigate(`/checkout?${params.toString()}`);
  };

  return (
    <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Room Image */}
      <div style={{ position: 'relative', height: 'clamp(200px, 30vw, 280px)', overflow: 'hidden' }}>
        <img
          src={primaryImage}
          alt={category.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        />
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(36, 35, 31, 0.85)',
            color: '#FFFFFF',
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(4px)',
          }}
        >
          {category.viewType}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: 'clamp(16px, 3vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.65rem', marginBottom: '8px' }}>{category.name}</h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '16px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {category.description}
          </p>

          {/* Quick Specs */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              borderTop: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              padding: '12px 0',
              marginBottom: '16px',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} color="var(--color-champagne-gold)" />
              <span>Up to {category.maxOccupancy} Guests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bed size={15} color="var(--color-champagne-gold)" />
              <span>{category.bedConfiguration}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Maximize2 size={15} color="var(--color-champagne-gold)" />
              <span>{category.sizeSqFt} sq ft</span>
            </div>
          </div>

          {/* Amenity Highlights */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {category.amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: '#F5F1EB',
                  padding: '3px 8px',
                  borderRadius: '2px',
                }}
              >
                <Check size={12} color="var(--color-champagne-gold)" /> {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '16px',
          }}
        >
          <div>
            {totalStayDollars ? (
              <>
                <div className="price-tag">${totalStayDollars.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Total for stay (inc. taxes)
                </div>
              </>
            ) : (
              <>
                <div className="price-tag">
                  ${basePriceDollars}
                  <span className="price-period">/ Night</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Excl. local taxes
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenDetails(category)}
              className="btn btn-outline btn-sm"
              style={{ padding: '8px 14px' }}
            >
              Details
            </button>
            <button onClick={handleBookNow} className="btn btn-gold btn-sm">
              Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
