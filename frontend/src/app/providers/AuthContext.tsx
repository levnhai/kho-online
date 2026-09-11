import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/shared/api/base';
import { User } from '@/shared/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kho_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const savedToken = localStorage.getItem('kho_token');
      if (savedToken) {
        try {
          const profile: any = await api.get('/auth/profile');
          setUser(profile);
        } catch (err) {
          console.error('Fetch profile error:', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (credentials: any) => {
    const response: any = await api.post('/auth/login', credentials);
    const { token: receivedToken, user: receivedUser } = response;
    localStorage.setItem('kho_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return response;
  };

  const register = async (data: any) => {
    const response: any = await api.post('/auth/register', data);
    const { token: receivedToken, user: receivedUser } = response;
    localStorage.setItem('kho_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('kho_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAdmin,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
