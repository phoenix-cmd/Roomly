import React, { useState } from 'react';
import { IRoomCategory } from '../../types/index.js';
import { X, Users, Bed, Maximize2, ShieldCheck, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoomDetailsModalProps {
  category: IRoomCategory | null;
  onClose: () => void;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  childrenCount?: number;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  category,
  onClose,
  checkInDate,
  checkOutDate,
  adults = 2,
  childrenCount = 0,
}) => {
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!category) return null;

  const handleBook = () => {
    onClose();
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

  const images = category.images.length > 0 ? category.images : [
    { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', caption: 'Suite Master View' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(36, 35, 31, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '4px',
          maxWidth: '850px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-modal)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <X size={20} />
        </button>

        {/* Gallery */}
        <div style={{ position: 'relative', height: '360px', backgroundColor: '#24231F' }}>
          <img
            src={images[activeImageIndex].url}
            alt={images[activeImageIndex].caption || category.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {images.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '6px 12px',
                borderRadius: '20px',
              }}
            >
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: idx === activeImageIndex ? 'var(--color-champagne-gold)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details Content */}
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-champagne-gold)', fontWeight: 600 }}>
                {category.viewType}
              </div>
              <h2 style={{ fontSize: '2.25rem', marginTop: '4px' }}>{category.name}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="price-tag">${Math.round(category.basePriceCents / 100)}<span className="price-period">/ Night</span></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Excl. 12% local taxes</div>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', marginBottom: '24px' }}>
            {category.description}
          </p>

          {/* Key Specs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              padding: '16px 20px',
              backgroundColor: '#FAF8F5',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color="var(--color-champagne-gold)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Occupancy</div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Up to {category.maxOccupancy} Guests</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bed size={18} color="var(--color-champagne-gold)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Bed Configuration</div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{category.bedConfiguration}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Maximize2 size={18} color="var(--color-champagne-gold)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Suite Area</div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{category.sizeSqFt} sq ft</div>
              </div>
            </div>
          </div>

          {/* Amenities Grid */}
          <h4 style={{ marginBottom: '16px' }}>Curated Suite Appointments</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '28px',
            }}
          >
            {category.amenities.map((amenity, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <Check size={14} color="var(--color-champagne-gold)" />
                <span>{amenity}</span>
              </div>
            ))}
          </div>

          {/* Policy Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              backgroundColor: '#F3F7F5',
              border: '1px solid #D2E4DA',
              borderRadius: '4px',
              marginBottom: '32px',
            }}
          >
            <ShieldCheck size={20} color="var(--color-success)" />
            <div style={{ fontSize: '0.85rem', color: '#2B573C' }}>
              <strong>Guaranteed Flexibility:</strong> Complimentary cancellation up to 48 hours prior to arrival date. No hidden resort fees.
            </div>
          </div>

          {/* Reserve Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={onClose} className="btn btn-outline">
              Close
            </button>
            <button onClick={handleBook} className="btn btn-gold">
              Proceed to Reserve Suite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
