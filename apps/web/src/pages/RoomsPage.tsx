import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client.js';
import { IHotel, IRoomCategory, IAvailableCategoryResult } from '../types/index.js';
import { RoomCard } from '../components/public/RoomCard.js';
import { RoomDetailsModal } from '../components/public/RoomDetailsModal.js';
import { BookingBar } from '../components/public/BookingBar.js';
import { Filter, SlidersHorizontal } from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const checkInDate = searchParams.get('checkInDate') || '';
  const checkOutDate = searchParams.get('checkOutDate') || '';
  const adults = parseInt(searchParams.get('adults') || '2', 10);
  const childrenCount = parseInt(searchParams.get('children') || '0', 10);

  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [categories, setCategories] = useState<IRoomCategory[]>([]);
  const [availableCategories, setAvailableCategories] = useState<IAvailableCategoryResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IRoomCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState<number>(2000);

  // 1. Fetch Hotels
  useEffect(() => {
    async function loadHotels() {
      try {
        const res = await apiClient.get('/hotels');
        const list: IHotel[] = res.data.data.hotels;
        setHotels(list);
        if (list.length > 0) {
          setSelectedHotelId(list[0]._id);
        }
      } catch (err) {
        console.error('Error fetching hotels:', err);
      }
    }
    loadHotels();
  }, []);

  // 2. Fetch Categories or Search Availability
  useEffect(() => {
    if (!selectedHotelId) return;

    async function fetchRooms() {
      setLoading(true);
      try {
        if (checkInDate && checkOutDate) {
          // Live date-based availability search
          const res = await apiClient.get(`/inventory/${selectedHotelId}/search`, {
            params: {
              checkInDate,
              checkOutDate,
              adults,
              children: childrenCount,
            },
          });
          setAvailableCategories(res.data.data.availableCategories);
          setCategories([]);
        } else {
          // Default list of room categories
          const res = await apiClient.get(`/rooms/${selectedHotelId}/categories`, {
            params: { adults, children: childrenCount },
          });
          setCategories(res.data.data.categories);
          setAvailableCategories([]);
        }
      } catch (err) {
        console.error('Error fetching room inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, [selectedHotelId, checkInDate, checkOutDate, adults, childrenCount]);

  const handleSearchUpdate = (params: { checkInDate: string; checkOutDate: string; adults: number; children: number }) => {
    setSearchParams({
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: String(params.adults),
      children: String(params.children),
    });
  };

  const filteredCategories = categories.filter(
    (c) => Math.round(c.basePriceCents / 100) <= maxPrice
  );
  const filteredAvailable = availableCategories.filter(
    (item) => Math.round(item.category.basePriceCents / 100) <= maxPrice
  );

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Editorial Header */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--color-border)',
          padding: '60px 0 40px 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-champagne-gold)', marginBottom: '12px' }}>
            Curated Living Spaces
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', marginBottom: '16px' }}>
            Suites, Penthouses & Private Villas
          </h1>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--color-text-secondary)' }}>
            Filter by your desired travel dates to check real-time suite allotments and authoritative nightly rates.
          </p>
        </div>
      </div>

      {/* Booking Filter Bar */}
      <div className="container" style={{ marginTop: '24px' }}>
        <BookingBar
          initialCheckIn={checkInDate}
          initialCheckOut={checkOutDate}
          initialAdults={adults}
          initialChildren={childrenCount}
          onSearch={handleSearchUpdate}
        />

        {/* Property & Price Filter Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            margin: '32px 0 24px 0',
            padding: '16px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {/* Hotel Property Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Property:
            </span>
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                backgroundColor: '#FAF8F5',
              }}
            >
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} ({h.address.city}, {h.address.country})
                </option>
              ))}
            </select>
          </div>

          {/* Max Nightly Rate Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Max Rate: ${maxPrice} / night
            </span>
            <input
              type="range"
              min={300}
              max={2500}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ accentColor: 'var(--color-champagne-gold)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
            Checking live suite inventory...
          </div>
        ) : checkInDate && checkOutDate ? (
          /* When searching dates */
          filteredAvailable.length === 0 ? (
            <div className="luxury-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '12px' }}>No Available Suites for Selected Dates</h3>
              <p style={{ maxWidth: '500px', margin: '0 auto 24px auto' }}>
                All suites for this date range are currently reserved or hold capacity is reached. Please try alternative dates.
              </p>
              <button
                onClick={() => setSearchParams({})}
                className="btn btn-outline"
              >
                Clear Date Filter
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
              }}
            >
              {filteredAvailable.map((item) => (
                <RoomCard
                  key={item.category._id}
                  category={item.category}
                  availability={item.availability}
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  adults={adults}
                  childrenCount={childrenCount}
                  onOpenDetails={(c) => setSelectedCategory(c)}
                />
              ))}
            </div>
          )
        ) : (
          /* Default general catalog view */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px',
            }}
          >
            {filteredCategories.map((cat) => (
              <RoomCard
                key={cat._id}
                category={cat}
                adults={adults}
                childrenCount={childrenCount}
                onOpenDetails={(c) => setSelectedCategory(c)}
              />
            ))}
          </div>
        )}
      </div>

      <RoomDetailsModal
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        adults={adults}
        childrenCount={childrenCount}
      />
    </div>
  );
};
