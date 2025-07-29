import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';
import { mockApiService } from '../services/mockApiService';
import type { User, LoginRequest, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para detectar si el backend está disponible
  const isBackendAvailable = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('http://localhost:8080/api/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Backend no disponible, usando datos mock');
      return false;
    }
  };

  // Función para obtener el servicio API apropiado
  const getApiService = async () => {
    const backendAvailable = await isBackendAvailable();
    return backendAvailable ? apiService : mockApiService;
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const service = await getApiService();
      const response: LoginResponse = await service.login(credentials);
      
      // Guardar token
      localStorage.setItem('token', response.token);
      service.setToken(response.token);
      
      // Obtener usuario completo
      const fullUser = await service.getCurrentUser();
      setUser(fullUser as User);
      
    } catch (error: any) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const service = await getApiService();
      await service.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const service = await getApiService();
          service.setToken(token);
          const currentUser = await service.getCurrentUser();
          setUser(currentUser as User);
        }
      } catch (error) {
        console.error('Error inicializando auth:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 