import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { User, LogOut, Shield, KeyRound, Sparkles, Building2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handlePersonaSelect = async (role: 'guest' | 'frontdesk' | 'housekeeper' | 'manager' | 'admin') => {
    setShowPersonaMenu(false);
    await quickLogin(role);
    if (role === 'guest') navigate('/dashboard');
    else if (role === 'frontdesk') navigate('/staff/dashboard');
    else if (role === 'housekeeper') navigate('/staff/housekeeping');
    else if (role === 'manager') navigate('/manager/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
  };

  const isStaff = user?.memberships && user.memberships.length > 0;
  const isAdmin = user?.globalRole === 'PLATFORM_ADMIN';

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '80px',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-editorial)',
            fontSize: '2rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-deep-charcoal)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>ROOMLY</span>
          <span style={{ color: 'var(--color-champagne-gold)', fontSize: '2.5rem', lineHeight: '0.5' }}>•</span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link
            to="/rooms"
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: location.pathname === '/rooms' ? 'var(--color-champagne-gold)' : 'var(--color-text-primary)',
            }}
          >
            Suites & Villas
          </Link>
          <a
            href="#story"
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            The Sanctuary
          </a>
          <a
            href="#amenities"
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Experiences
          </a>

          {/* Operational Portals if logged in */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: '12px' }}>
              <Link
                to="/dashboard"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: location.pathname.startsWith('/dashboard') ? 'var(--color-champagne-gold)' : 'inherit',
                }}
              >
                My Stays
              </Link>

              {isStaff && (
                <>
                  <Link
                    to="/staff/dashboard"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-info)',
                    }}
                  >
                    Front Desk
                  </Link>
                  <Link
                    to="/staff/housekeeping"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-muted-olive)',
                    }}
                  >
                    Housekeeping
                  </Link>
                  <Link
                    to="/manager/dashboard"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-warning)',
                    }}
                  >
                    Management
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-deep-charcoal)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Shield size={14} /> Admin
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Right Action / Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Demo Persona Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="btn btn-outline btn-sm"
              style={{
                borderColor: 'var(--color-champagne-gold)',
                color: 'var(--color-champagne-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Switch demo persona for testing"
            >
              <Sparkles size={14} />
              <span>Demo Persona</span>
            </button>

            {showPersonaMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-modal)',
                  borderRadius: '4px',
                  width: '240px',
                  padding: '8px 0',
                  zIndex: 200,
                }}
              >
                <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Test Persona
                </div>
                <button
                  onClick={() => handlePersonaSelect('guest')}
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F3EC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <User size={16} /> Guest (Eleanora Vane)
                </button>
                <button
                  onClick={() => handlePersonaSelect('frontdesk')}
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F3EC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <KeyRound size={16} /> Front Desk (Antoine)
                </button>
                <button
                  onClick={() => handlePersonaSelect('housekeeper')}
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F3EC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Building2 size={16} /> Housekeeper (Camille)
                </button>
                <button
                  onClick={() => handlePersonaSelect('manager')}
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F3EC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Shield size={16} /> Hotel Manager (Geneviève)
                </button>
                <button
                  onClick={() => handlePersonaSelect('admin')}
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F7F3EC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Shield size={16} style={{ color: 'var(--color-champagne-gold)' }} /> Platform Admin
                </button>
              </div>
            )}
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {user.firstName}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                title="Sign out"
                style={{ padding: '6px 12px' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-dark btn-sm">
              Sign In
            </Link>
          )}

          <Link to="/rooms" className="btn btn-gold btn-sm">
            Reserve Suite
          </Link>
        </div>
      </div>
    </header>
  );
};
