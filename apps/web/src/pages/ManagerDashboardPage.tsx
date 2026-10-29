import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { DollarSign, TrendingUp, BarChart3, Calendar, Check, Save } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const ManagerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const hotelId = user?.memberships?.[0]?.hotelId || '';

  const [occupancyReport, setOccupancyReport] = useState<any>(null);
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [inventoryGrid, setInventoryGrid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      if (!hotelId) return;
      setLoading(true);
      try {
        const [occRes, finRes, gridRes] = await Promise.all([
          apiClient.get(`/reports/${hotelId}/occupancy`),
          apiClient.get(`/reports/${hotelId}/financial`),
          apiClient.get(`/inventory/${hotelId}/grid`),
        ]);

        setOccupancyReport(occRes.data.data.report);
        setFinancialReport(finRes.data.data.report);
        setInventoryGrid(gridRes.data.data.inventory.slice(0, 15)); // First 15 allotment records
      } catch (err) {
        console.error('Error fetching manager reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [hotelId]);

  const handleAllotmentChange = (index: number, newTotal: number) => {
    const updated = [...inventoryGrid];
    updated[index].totalInventory = newTotal;
    setInventoryGrid(updated);
  };

  const handlePriceChange = (index: number, newPriceDollars: number) => {
    const updated = [...inventoryGrid];
    updated[index].priceCents = newPriceDollars * 100;
    setInventoryGrid(updated);
  };

  const handleSaveGrid = async () => {
    try {
      await apiClient.post(`/inventory/${hotelId}/batch-update`, {
        updates: inventoryGrid.map((item) => ({
          roomCategoryId: item.roomCategoryId?._id || item.roomCategoryId,
          date: item.date,
          totalInventory: item.totalInventory,
          priceCents: item.priceCents,
        })),
      });
      setSaveSuccess('Inventory and dynamic rates updated successfully.');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save inventory updates.');
    }
  };

  const chartData = [
    { name: 'Panoramic Suite', revenue: 6500 },
    { name: 'Deluxe King', revenue: 4200 },
    { name: 'Coastal Villa', revenue: 12500 },
  ];

  const pieData = [
    { name: 'Occupied', value: occupancyReport?.totalNightsBooked || 12 },
    { name: 'Available', value: Math.max(0, (occupancyReport?.totalRooms || 10) * 30 - (occupancyReport?.totalNightsBooked || 12)) },
  ];

  const COLORS = ['#B69A68', '#E6DED2'];

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', padding: '40px 0 80px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-champagne-gold)', fontWeight: 600 }}>
              Property Executive Suite
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', marginTop: '4px' }}>
              Occupancy, Rates & Financial Performance
            </h1>
          </div>

          <button onClick={handleSaveGrid} className="btn btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> Save Grid Updates
          </button>
        </div>

        {saveSuccess && (
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
            <Check size={18} />
            <div>{saveSuccess}</div>
          </div>
        )}

        {/* Financial & Operational KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          <div className="luxury-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Net Settled Revenue
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--color-deep-charcoal)' }}>
              ${financialReport ? Math.round(financialReport.netCollectedCents / 100).toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {financialReport?.totalTransactions || 0} Transactions Settled
            </div>
          </div>

          <div className="luxury-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Average Daily Rate (ADR)
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--color-champagne-gold)' }}>
              ${occupancyReport ? Math.round(occupancyReport.averageDailyRateCents / 100).toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Authoritative room average</div>
          </div>

          <div className="luxury-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              RevPAR (Rev per Avail Room)
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--color-info)' }}>
              ${occupancyReport ? Math.round(occupancyReport.revParCents / 100).toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Revenue per available room</div>
          </div>

          <div className="luxury-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Occupancy Ratio
            </div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--color-success)' }}>
              {occupancyReport?.occupancyRate || 0}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {occupancyReport?.totalNightsBooked || 0} Room-Nights Sold
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px',
            marginBottom: '48px',
          }}
        >
          {/* Revenue by Room Category */}
          <div className="luxury-card" style={{ padding: '28px', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Revenue Contribution by Suite</h3>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#6B685F" fontSize={12} />
                  <YAxis stroke="#6B685F" fontSize={12} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#B69A68" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Occupancy Proportion */}
          <div className="luxury-card" style={{ padding: '28px', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Occupancy Allotment Ratio</h3>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Interactive Inventory Allotment & Seasonal Pricing Grid */}
        <div className="luxury-card" style={{ padding: '32px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem' }}>Daily Inventory & Seasonal Rate Planner</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Adjust total room allotments or override nightly rates for specific dates. Concurrency safeguards enforce atomic updates.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Total Allotment</th>
                  <th style={{ padding: '12px' }}>Booked / Held</th>
                  <th style={{ padding: '12px' }}>Available</th>
                  <th style={{ padding: '12px' }}>Nightly Rate ($)</th>
                </tr>
              </thead>
              <tbody>
                {inventoryGrid.map((inv, idx) => {
                  const available = Math.max(0, inv.totalInventory - (inv.bookedCount + inv.heldCount));
                  const priceDollars = Math.round((inv.priceCents || 0) / 100);

                  return (
                    <tr key={inv._id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 600 }}>{inv.date}</td>
                      <td style={{ padding: '14px 12px' }}>{inv.roomCategoryId?.name || 'Suite'}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={inv.totalInventory}
                          onChange={(e) => handleAllotmentChange(idx, Number(e.target.value))}
                          style={{ width: '60px', padding: '6px', border: '1px solid var(--color-border)', borderRadius: '2px' }}
                        />
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        {inv.bookedCount} booked / {inv.heldCount} held
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span className={`badge ${available > 0 ? 'badge-success' : 'badge-error'}`}>
                          {available} Available
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <input
                          type="number"
                          step={10}
                          value={priceDollars}
                          onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                          style={{ width: '90px', padding: '6px', border: '1px solid var(--color-border)', borderRadius: '2px' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
