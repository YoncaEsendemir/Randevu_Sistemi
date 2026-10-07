import { createContext, useContext, useState, type ReactNode } from 'react';
import apiClient from '../api/client';
import type { User, AuthResponse } from '../types';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Sayfa yenilendiğinde oturumun kaybolmaması için başlangıç değeri
  // localStorage'dan okunuyor.
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  function persistSession(data: AuthResponse) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post<AuthResponse>('/login', { email, password });
      persistSession(data);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(payload: RegisterPayload) {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post<AuthResponse>('/register', payload);
      persistSession(data);
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Bileşenlerin içinde useAuth() ile oturum bilgisine ve
// login/register/logout fonksiyonlarına kolayca erişilebiliyor.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  }
  return context;
}