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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('kho_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kho_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const savedToken = localStorage.getItem('kho_token');
      if (savedToken) {
        try {
          const profile: any = await api.get('/auth/profile', { skipCache: true });
          setUser(profile);
          localStorage.setItem('kho_user', JSON.stringify(profile));
        } catch (err: any) {
          console.error('Fetch profile error:', err);
          // Chỉ logout nếu token thực sự không hợp lệ / hết hạn
          if (err?.response?.status === 401 || err?.status === 401) {
            logout();
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('kho_user');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (credentials: any) => {
    const response: any = await api.post('/auth/login', credentials);
    const { token: receivedToken, user: receivedUser } = response;
    localStorage.setItem('kho_token', receivedToken);
    localStorage.setItem('kho_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return response;
  };

  const register = async (data: any) => {
    const response: any = await api.post('/auth/register', data);
    const { token: receivedToken, user: receivedUser } = response;
    localStorage.setItem('kho_token', receivedToken);
    localStorage.setItem('kho_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('kho_token');
    localStorage.removeItem('kho_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      localStorage.setItem('kho_user', JSON.stringify(newUser));
      return newUser;
    });
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
