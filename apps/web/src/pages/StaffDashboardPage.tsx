import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { IBooking, IPhysicalRoom } from '../types/index.js';
import { Users, LogIn, LogOut, CheckCircle2, Bed, AlertCircle, RefreshCw } from 'lucide-react';

export const StaffDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const hotelId = user?.memberships?.[0]?.hotelId || '';

  const [stats, setStats] = useState<any>(null);
  const [arrivals, setArrivals] = useState<IBooking[]>([]);
  const [departures, setDepartures] = useState<IBooking[]>([]);
  const [rooms, setRooms] = useState<IPhysicalRoom[]>([]);
  const [activeTab, setActiveTab] = useState<'ARRIVALS' | 'DEPARTURES' | 'ROOMS'>('ARRIVALS');
  const [loading, setLoading] = useState(true);

  // Check-in modal state
  const [selectedArrival, setSelectedArrival] = useState<IBooking | null>(null);
  const [assignedRoomId, setAssignedRoomId] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedArrival) return;
    document.body.classList.add('drawer-open');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedArrival(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('drawer-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedArrival]);

  const loadData = async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [statsRes, arrivalsRes, departuresRes, roomsRes] = await Promise.all([
        apiClient.get(`/operations/${hotelId}/dashboard`),
        apiClient.get(`/operations/${hotelId}/arrivals`),
        apiClient.get(`/operations/${hotelId}/departures`),
        apiClient.get(`/rooms/${hotelId}/physical-rooms`),
      ]);

      setStats(statsRes.data.data.stats);
      setArrivals(arrivalsRes.data.data.arrivals);
      setDepartures(departuresRes.data.data.departures);
      setRooms(roomsRes.data.data.rooms);
    } catch (err) {
      console.error('Error loading front desk operations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hotelId]);

  const handleExecuteCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArrival || !assignedRoomId) return;

    try {
      await apiClient.post(`/operations/${hotelId}/check-in`, {
        bookingId: selectedArrival._id,
        assignedRoomId,
      });

      setActionSuccess(`Guest ${selectedArrival.guestDetails.firstName} ${selectedArrival.guestDetails.lastName} successfully checked in.`);
      setSelectedArrival(null);
      setAssignedRoomId('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Check-in failed.');
    }
  };

  const handleExecuteCheckOut = async (bookingId: string) => {
    if (!window.confirm('Complete departure check-out for this guest? Room will be automatically queued for housekeeping turnover.')) {
      return;
    }

    try {
      await apiClient.post(`/operations/${hotelId}/check-out`, { bookingId });
      setActionSuccess('Guest checked out. Turnover clean task dispatched to Housekeeping team.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Check-out failed.');
    }
  };

  // Filter available rooms matching the category
  const availableCategoryRooms = rooms.filter(
    (r) =>
      r.status === 'AVAILABLE' &&
      (!selectedArrival || r.roomCategoryId?._id === (selectedArrival.roomCategoryId as any)?._id)
  );

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="luxury-spinner" />
      </div>
    );
  }

  if (!hotelId) {
    return (
      <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div className="luxury-card" style={{ padding: '48px 36px', backgroundColor: '#FFFFFF' }}>
            <AlertCircle size={44} style={{ color: 'var(--color-champagne-gold)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>No Property Assigned</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Your account is not currently assigned to an active hotel property. Please contact the hotel manager or administrator to be granted property staff access.
            </p>
            <a href="/" className="btn btn-gold">Return to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', padding: '40px 0 80px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-info)', fontWeight: 600 }}>
              Front-Desk Operations
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', marginTop: '4px' }}>
              Daily Arrivals & Departures
            </h1>
          </div>

          <button onClick={loadData} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh Board
          </button>
        </div>

        {actionSuccess && (
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              borderRadius: '4px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle2 size={18} />
            <div>{actionSuccess}</div>
          </div>
        )}

        {/* Live KPI Metric Cards */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '20px',
              marginBottom: '36px',
            }}
          >
            <div className="luxury-card card-padding-responsive">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Today's Arrivals
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--color-info)' }}>
                {stats.expectedArrivals}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Expected check-ins</div>
            </div>

            <div className="luxury-card card-padding-responsive">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Today's Departures
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--color-warning)' }}>
                {stats.expectedDepartures}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Expected check-outs</div>
            </div>

            <div className="luxury-card card-padding-responsive">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Occupancy Rate
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--color-success)' }}>
                {stats.occupancyPercent}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {stats.occupiedRooms} / {stats.totalRooms} Rooms Occupied
              </div>
            </div>

            <div className="luxury-card card-padding-responsive">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Housekeeping Queue
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--color-error)' }}>
                {stats.cleaningRooms}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Rooms awaiting cleaning</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--color-border)', marginBottom: '28px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'nowrap', maxWidth: '100%' }}>
          <button
            onClick={() => setActiveTab('ARRIVALS')}
            style={{
              padding: '12px 20px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'ARRIVALS' ? '3px solid var(--color-champagne-gold)' : '3px solid transparent',
              color: activeTab === 'ARRIVALS' ? 'var(--color-deep-charcoal)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Arrivals ({arrivals.length})
          </button>

          <button
            onClick={() => setActiveTab('DEPARTURES')}
            style={{
              padding: '12px 20px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'DEPARTURES' ? '3px solid var(--color-champagne-gold)' : '3px solid transparent',
              color: activeTab === 'DEPARTURES' ? 'var(--color-deep-charcoal)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Departures ({departures.length})
          </button>

          <button
            onClick={() => setActiveTab('ROOMS')}
            style={{
              padding: '12px 20px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'ROOMS' ? '3px solid var(--color-champagne-gold)' : '3px solid transparent',
              color: activeTab === 'ROOMS' ? 'var(--color-deep-charcoal)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Room Status Grid ({rooms.length})
          </button>
        </div>

        {/* Tab 1: Arrivals */}
        {activeTab === 'ARRIVALS' && (
          <div className="luxury-card card-padding-responsive" style={{ backgroundColor: '#FFFFFF' }}>
            {arrivals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
                No pending arrivals scheduled for today.
              </div>
            ) : (
              <div className="table-responsive-container">
                <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '12px 16px' }}>Confirmation</th>
                      <th style={{ padding: '12px 16px' }}>Guest Name</th>
                      <th style={{ padding: '12px 16px' }}>Suite Category</th>
                      <th style={{ padding: '12px 16px' }}>Stay Duration</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Operation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arrivals.map((b) => (
                      <tr key={b._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '16px', fontWeight: 600, fontFamily: 'var(--font-editorial)', fontSize: '1.1rem' }}>
                          {b.confirmationCode}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 500 }}>
                          {b.guestDetails.firstName} {b.guestDetails.lastName}
                        </td>
                        <td style={{ padding: '16px' }}>{(b.roomCategoryId as any)?.name || 'Living Space'}</td>
                        <td style={{ padding: '16px' }}>{b.checkInDate} to {b.checkOutDate} ({b.nights}n)</td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge ${b.status === 'CHECKED_IN' ? 'badge-info' : 'badge-success'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          {b.status === 'CONFIRMED' ? (
                            <button
                              onClick={() => {
                                setSelectedArrival(b);
                                setAssignedRoomId('');
                              }}
                              className="btn btn-gold btn-sm"
                            >
                              <LogIn size={14} /> Process Check-In
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              Assigned Room: {(b.assignedRoomId as any)?.roomNumber || 'Assigned'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Departures */}
        {activeTab === 'DEPARTURES' && (
          <div className="luxury-card card-padding-responsive" style={{ backgroundColor: '#FFFFFF' }}>
            {departures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
                No departures scheduled for today.
              </div>
            ) : (
              <div className="table-responsive-container">
                <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '12px 16px' }}>Room</th>
                      <th style={{ padding: '12px 16px' }}>Guest Name</th>
                      <th style={{ padding: '12px 16px' }}>Confirmation</th>
                      <th style={{ padding: '12px 16px' }}>Total Settled</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departures.map((b) => (
                      <tr key={b._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '16px', fontWeight: 600 }}>
                          Room {(b.assignedRoomId as any)?.roomNumber || '301'}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 500 }}>
                          {b.guestDetails.firstName} {b.guestDetails.lastName}
                        </td>
                        <td style={{ padding: '16px', fontFamily: 'var(--font-editorial)', fontSize: '1.1rem' }}>
                          {b.confirmationCode}
                        </td>
                        <td style={{ padding: '16px' }}>
                          ${Math.round(b.pricingSnapshot.totalCents / 100).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge ${b.status === 'CHECKED_OUT' ? 'badge-info' : 'badge-warning'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          {b.status === 'CHECKED_IN' ? (
                            <button
                              onClick={() => handleExecuteCheckOut(b._id)}
                              className="btn btn-dark btn-sm"
                            >
                              <LogOut size={14} /> Check Out & Clean
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              Checked Out
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Room Status Matrix */}
        {activeTab === 'ROOMS' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
              gap: '20px',
            }}
          >
            {rooms.map((r) => {
              let bg = '#FFFFFF';
              let badgeClass = 'badge-success';
              if (r.status === 'OCCUPIED') {
                bg = '#FCF5EB';
                badgeClass = 'badge-warning';
              } else if (r.status === 'CLEANING_REQUIRED') {
                bg = '#FBEAEA';
                badgeClass = 'badge-error';
              } else if (r.status === 'CLEANING_IN_PROGRESS') {
                bg = '#EDF3F8';
                badgeClass = 'badge-info';
              }

              return (
                <div key={r._id} className="luxury-card" style={{ padding: '20px', backgroundColor: bg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.75rem', fontWeight: 600 }}>
                      #{r.roomNumber}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Floor {r.floor}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '12px' }}>
                    {r.roomCategoryId?.name || 'Deluxe Suite'}
                  </div>
                  <span className={`badge ${badgeClass}`}>{r.status.replace(/_/g, ' ')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Check-In Modal with Physical Room Assignment */}
      {selectedArrival && (
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
          onClick={() => setSelectedArrival(null)}
        >
          <div
            className="luxury-card card-padding-responsive"
            style={{ maxWidth: '520px', width: '100%', backgroundColor: '#FFFFFF', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', marginBottom: '12px' }}>Check In Guest</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Assign a cleaned & inspected physical room to complete check-in for {selectedArrival.guestDetails.firstName} {selectedArrival.guestDetails.lastName}.
            </p>

            <form onSubmit={handleExecuteCheckIn}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Available Inspected Rooms ({(selectedArrival.roomCategoryId as any)?.name}):
                </label>
                <select
                  required
                  value={assignedRoomId}
                  onChange={(e) => setAssignedRoomId(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.9rem' }}
                >
                  <option value="">-- Select Room Number --</option>
                  {availableCategoryRooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      Room #{r.roomNumber} (Floor {r.floor} - {r.status})
                    </option>
                  ))}
                </select>
                {availableCategoryRooms.length === 0 && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-error)' }}>
                    No rooms in this category are marked AVAILABLE. Please inspect cleaned rooms first.
                  </div>
                )}
              </div>

              <div className="btn-stack-mobile" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedArrival(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!assignedRoomId}
                  className="btn btn-gold"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
