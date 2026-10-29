import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { IHousekeepingTask, IPhysicalRoom } from '../types/index.js';
import { CheckCircle2, Sparkles, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export const HousekeepingPage: React.FC = () => {
  const { user } = useAuth();
  const hotelId = user?.memberships?.[0]?.hotelId || '';

  const [tasks, setTasks] = useState<IHousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<IPhysicalRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const [tasksRes, roomsRes] = await Promise.all([
        apiClient.get(`/housekeeping/${hotelId}/tasks`),
        apiClient.get(`/rooms/${hotelId}/physical-rooms`),
      ]);
      setTasks(tasksRes.data.data.tasks);
      setRooms(roomsRes.data.data.rooms);
    } catch (err) {
      console.error('Error loading housekeeping:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hotelId]);

  const handleUpdateStatus = async (roomId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/housekeeping/${hotelId}/rooms/${roomId}/status`, {
        status: newStatus,
      });
      setMessage(`Room updated to ${newStatus.replace(/_/g, ' ')}.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiClient.post(`/housekeeping/${hotelId}/tasks/${taskId}/complete`);
      setMessage('Housekeeping task marked as completed.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete task.');
    }
  };

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', padding: '40px 0 80px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-muted-olive)', fontWeight: 600 }}>
              Hospitality Operations
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', marginTop: '4px' }}>
              Housekeeping & Turnover Board
            </h1>
          </div>

          <button onClick={loadData} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh Board
          </button>
        </div>

        {message && (
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
            <div>{message}</div>
          </div>
        )}

        {/* Priority Turnover Tasks Queue */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Active Cleaning & Turnover Tasks</h3>
          <div className="luxury-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)' }}>
                All scheduled housekeeping tasks are complete.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '12px' }}>Room</th>
                      <th style={{ padding: '12px' }}>Task Type</th>
                      <th style={{ padding: '12px' }}>Priority</th>
                      <th style={{ padding: '12px' }}>Notes</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '16px', fontWeight: 600, fontSize: '1.1rem', fontFamily: 'var(--font-editorial)' }}>
                          Room #{t.roomId?.roomNumber || '301'}
                        </td>
                        <td style={{ padding: '16px' }}>{t.taskType.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge ${t.priority === 'HIGH' || t.priority === 'URGENT' ? 'badge-error' : 'badge-warning'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>
                          {t.notes || 'Standard turnover hygiene protocol'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          {t.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCompleteTask(t._id)}
                              className="btn btn-gold btn-sm"
                            >
                              <CheckCircle2 size={14} /> Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Physical Rooms Real-Time Status & Transition Controls */}
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>All Physical Rooms Status</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {rooms.map((r) => {
              const isOccupied = r.status === 'OCCUPIED';
              const isDirty = r.status === 'CLEANING_REQUIRED';
              const isCleaning = r.status === 'CLEANING_IN_PROGRESS';
              const isInspected = r.status === 'INSPECTED';
              const isAvailable = r.status === 'AVAILABLE';

              return (
                <div key={r._id} className="luxury-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 600 }}>
                      Room #{r.roomNumber}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Floor {r.floor}</span>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    {r.roomCategoryId?.name || 'Luxury Category'}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <span
                      className={`badge ${
                        isAvailable
                          ? 'badge-success'
                          : isOccupied
                          ? 'badge-warning'
                          : isDirty
                          ? 'badge-error'
                          : 'badge-info'
                      }`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Operational Status Action Controls */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {isDirty && (
                      <button
                        onClick={() => handleUpdateStatus(r._id, 'CLEANING_IN_PROGRESS')}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%' }}
                      >
                        Start Cleaning
                      </button>
                    )}

                    {isCleaning && (
                      <button
                        onClick={() => handleUpdateStatus(r._id, 'INSPECTED')}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                      >
                        Mark Inspected
                      </button>
                    )}

                    {isInspected && (
                      <button
                        onClick={() => handleUpdateStatus(r._id, 'AVAILABLE')}
                        className="btn btn-gold btn-sm"
                        style={{ width: '100%' }}
                      >
                        Release for Check-In
                      </button>
                    )}

                    {isAvailable && (
                      <button
                        onClick={() => handleUpdateStatus(r._id, 'CLEANING_REQUIRED')}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', fontSize: '0.75rem' }}
                      >
                        Flag for Cleaning
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
