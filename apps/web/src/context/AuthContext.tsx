import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types/index.js';
import { apiClient, setAuthToken } from '../api/client.js';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  quickLogin: (role: 'admin' | 'manager' | 'frontdesk' | 'housekeeper' | 'guest') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = sessionStorage.getItem('roomly_token');
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data.data.user);
        } catch {
          setAuthToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { user: authUser, tokens } = res.data.data;
    setAuthToken(tokens.accessToken);
    setUser(authUser);
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
    const res = await apiClient.post('/auth/register', data);
    const { user: authUser, tokens } = res.data.data;
    setAuthToken(tokens.accessToken);
    setUser(authUser);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    }
    setAuthToken(null);
    setUser(null);
  };

  const quickLogin = async (role: 'admin' | 'manager' | 'frontdesk' | 'housekeeper' | 'guest') => {
    const credentials = {
      admin: { email: 'admin@roomly.luxury', password: 'AdminPass123!' },
      manager: { email: 'manager@riviera.luxury', password: 'ManagerPass123!' },
      frontdesk: { email: 'frontdesk@riviera.luxury', password: 'StaffPass123!' },
      housekeeper: { email: 'housekeeper@riviera.luxury', password: 'StaffPass123!' },
      guest: { email: 'guest@example.com', password: 'GuestPass123!' },
    };

    const cred = credentials[role];
    await login(cred.email, cred.password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, quickLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
