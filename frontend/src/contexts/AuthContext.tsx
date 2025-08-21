import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import { apiService } from '../services/api';
import type { User, LoginRequest, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
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
  // const [isInitialized, setIsInitialized] = useState(false); // No usado actualmente

  // Función para obtener el servicio API apropiado
  const getApiService = useCallback(async () => {
    // Usar la API real del backend
    return apiService;
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      // Usar directamente la API real del backend
      const response: LoginResponse = await apiService.login(credentials);
      
      // Guardar token
      localStorage.setItem('token', response.token);
      apiService.setToken(response.token);
      
      // Obtener usuario completo con roles
      const fullUser = await apiService.getCurrentUser();
      setUser(fullUser as any);
      
    } catch (error: unknown) {
      console.error('Error en login:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const service = await getApiService();
      await service.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (userData: any) => {
    try {
      const service = await getApiService();
      if (user?.id) {
        const updatedUser = await service.updateUser(user.id, userData);
        setUser(updatedUser as any);
      }
    } catch (error: unknown) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token && isMounted) {
          const service = await getApiService();
          service.setToken(token);
          
          try {
            const currentUser = await service.getCurrentUser();
            if (isMounted) {
              setUser(currentUser as any);
            }
          } catch (authError) {
            console.error('Token inválido o expirado:', authError);
            // Limpiar token inválido
            if (isMounted) {
              localStorage.removeItem('token');
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error inicializando auth:', error);
        if (isMounted) {
          localStorage.removeItem('token');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          // setIsInitialized(true); // No usado actualmente
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []); // Sin dependencias - solo se ejecuta una vez

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const value: AuthContextType = useMemo(() => {
    console.log('🔐 AuthContext - Creando nuevo valor del contexto - TIMESTAMP:', new Date().toISOString());
    console.log('🔐 AuthContext - user:', user);
    console.log('🔐 AuthContext - isLoading:', isLoading);
    
    return {
      user,
      login,
      logout,
      updateProfile,
      isLoading,
      isAuthenticated: !!user,
    };
  }, [user, isLoading, login, logout, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 