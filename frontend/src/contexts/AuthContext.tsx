import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { mockApiService } from '../services/mockApiService';
import type { User, LoginRequest, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
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

  // Función para obtener el servicio API apropiado
  const getApiService = async () => {
    // Forzar uso de mockApiService para desarrollo
    return mockApiService;
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const service = await getApiService();
      const response: LoginResponse = await service.login(credentials);
      
      // Guardar token
      localStorage.setItem('token', response.token);
      service.setToken(response.token);
      
      // Obtener usuario completo con roles
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

  const updateProfile = async (userData: any) => {
    try {
      const service = await getApiService();
      if (user?.id) {
        const updatedUser = await service.updateUser(user.id, userData);
        setUser(updatedUser as User);
      }
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      throw error;
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
    updateProfile,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 