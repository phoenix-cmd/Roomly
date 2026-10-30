import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client.js';
import { IHotel } from '../types/index.js';
import { Shield, Building2, Users, DollarSign, Activity, Plus, Check } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New hotel modal state
  const [showAddHotel, setShowAddHotel] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const [tagline, setTagline] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!showAddHotel) return;
    document.body.classList.add('drawer-open');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddHotel(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('drawer-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAddHotel]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overRes, hotelsRes, logsRes, healthRes] = await Promise.all([
        apiClient.get('/admin/overview'),
        apiClient.get('/admin/hotels'),
        apiClient.get('/admin/audit-logs'),
        apiClient.get('/admin/health'),
      ]);

      setOverview(overRes.data.data.stats);
      setHotels(hotelsRes.data.data.hotels);
      setAuditLogs(logsRes.data.data.logs);
      setHealth(healthRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/hotels', {
        name: hotelName,
        tagline,
        description: 'New luxury property onboarded to Roomly platform.',
        address: { street: 'Main Promenade', city, state: city, country, postalCode: '00000' },
        contact: { email, phone },
        currency: 'USD',
      });
      setShowAddHotel(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to onboard property.');
    }
  };

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', padding: '40px 0 80px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-champagne-gold)', fontWeight: 600 }}>
              Global Administration
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', marginTop: '4px' }}>
              Platform Governance & System Health
            </h1>
          </div>

          <button onClick={() => setShowAddHotel(true)} className="btn btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Onboard New Property
          </button>
        </div>

        {/* Global Metric Cards */}
        {overview && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '24px',
              marginBottom: '36px',
            }}
          >
            <div className="luxury-card card-padding-responsive">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Hotel Properties
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--color-deep-charcoal)' }}>
                {overview.totalHotels}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Active luxury hotels</div>
            </div>

            <div className="luxury-card card-padding-responsive">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Platform Users
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--color-champagne-gold)' }}>
                {overview.totalUsers}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Guests, staff & managers</div>
            </div>

            <div className="luxury-card card-padding-responsive">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Total Reservations
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--color-info)' }}>
                {overview.totalBookings}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Processed system-wide</div>
            </div>

            <div className="luxury-card card-padding-responsive">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Gross Platform Volume
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--color-success)' }}>
                ${Math.round(overview.totalPlatformGrossCents / 100).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Settled guest charges</div>
            </div>
          </div>
        )}

        {/* System Health Diagnostics */}
        {health && (
          <div className="luxury-card card-padding-responsive" style={{ backgroundColor: '#FFFFFF', marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Activity size={20} color="var(--color-success)" />
              <h3 style={{ fontSize: '1.25rem' }}>Engine Diagnostics & Liveness</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '16px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Status: </span>
                <span className="badge badge-success">{health.status}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Database: </span>
                <span className="badge badge-success">{health.database?.status}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Node Process Uptime: </span>
                <strong>{health.uptimeSeconds}s</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Memory Heap: </span>
                <strong>{Math.round(health.memory?.heapUsed / 1024 / 1024)} MB</strong>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Property Directory */}
        <div className="luxury-card card-padding-responsive" style={{ backgroundColor: '#FFFFFF', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Managed Hotel Directory</h3>
          <div className="table-responsive-container">
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px' }}>Property Name</th>
                  <th style={{ padding: '12px' }}>Location</th>
                  <th style={{ padding: '12px' }}>Rating</th>
                  <th style={{ padding: '12px' }}>Contact</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((h) => (
                  <tr key={h._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, fontSize: '1.1rem', fontFamily: 'var(--font-editorial)' }}>
                      {h.name}
                    </td>
                    <td style={{ padding: '16px' }}>{h.address.city}, {h.address.country}</td>
                    <td style={{ padding: '16px' }}>{h.starRating} Stars Luxury</td>
                    <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>{h.contact.email}</td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge badge-success">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Security & Audit Trail */}
        <div className="luxury-card card-padding-responsive" style={{ backgroundColor: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Immutable Security Audit Trail</h3>
          <div className="table-responsive-container">
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px' }}>Timestamp</th>
                  <th style={{ padding: '12px' }}>Action</th>
                  <th style={{ padding: '12px' }}>Actor</th>
                  <th style={{ padding: '12px' }}>Resource Type</th>
                  <th style={{ padding: '12px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{log.action}</td>
                    <td style={{ padding: '12px' }}>{log.userId?.email || 'System'}</td>
                    <td style={{ padding: '12px' }}>{log.resourceType}</td>
                    <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Onboard Property Modal */}
      {showAddHotel && (
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
          onClick={() => setShowAddHotel(false)}
        >
          <div
            className="luxury-card card-padding-responsive"
            style={{ maxWidth: '540px', width: '100%', backgroundColor: '#FFFFFF', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.75rem)', marginBottom: '16px' }}>Onboard New Hotel Property</h3>
            <form onSubmit={handleCreateHotel}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Property Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Villa d'Este Sanctuary"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tagline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lake Como Waterfront Palace"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div className="btn-stack-mobile" style={{ justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddHotel(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  Create Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
