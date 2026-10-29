import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Sparkles, Shield, KeyRound, Building2, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: 'admin' | 'manager' | 'frontdesk' | 'housekeeper' | 'guest') => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      if (role === 'guest') navigate('/dashboard');
      else if (role === 'frontdesk') navigate('/staff/dashboard');
      else if (role === 'housekeeper') navigate('/staff/housekeeping');
      else if (role === 'manager') navigate('/manager/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="luxury-card" style={{ maxWidth: '460px', width: '100%', padding: '40px', backgroundColor: '#FFFFFF' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', letterSpacing: '0.2em', color: 'var(--color-deep-charcoal)' }}>
            ROOMLY
          </div>
          <p style={{ marginTop: '6px', fontSize: '0.9rem' }}>
            Enter your credentials to access your hospitality sanctuary.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '28px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. guest@example.com"
              style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-gold" style={{ width: '100%', padding: '14px 0' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Demo Login Shortcuts */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-champagne-gold)', marginBottom: '12px' }}>
            <Sparkles size={14} /> Instant Demo Account Access
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => handleDemo('guest')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <User size={13} /> Guest Account
            </button>
            <button
              onClick={() => handleDemo('frontdesk')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <KeyRound size={13} /> Front Desk Staff
            </button>
            <button
              onClick={() => handleDemo('housekeeper')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <Building2 size={13} /> Housekeeper
            </button>
            <button
              onClick={() => handleDemo('manager')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '8px 10px' }}
            >
              <Shield size={13} /> Hotel Manager
            </button>
          </div>

          <button
            onClick={() => handleDemo('admin')}
            className="btn btn-dark btn-sm"
            style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem' }}
          >
            <Shield size={13} /> Platform Administrator
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-champagne-gold)', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
