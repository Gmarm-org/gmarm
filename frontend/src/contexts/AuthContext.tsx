import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import { apiService } from '../services/api';
import type { User, LoginRequest, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  activeRole: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  setActiveRole: (role: string) => void;
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
  const [activeRole, setActiveRoleState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  // const [isInitialized, setIsInitialized] = useState(false); // No usado actualmente
  
  // Configuración de inactividad (en milisegundos)
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
  const WARNING_TIMEOUT = 9 * 60 * 1000; // 9 minutos (advertencia 1 min antes)

  // Función para obtener el servicio API apropiado
  const getApiService = useCallback(async () => {
    // Usar la API real del backend
    return apiService;
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      // Limpiar rol activo anterior
      setActiveRoleState(null);
      localStorage.removeItem('activeRole');
      
      // Usar directamente la API real del backend
      const response: LoginResponse = await apiService.login(credentials);
      
      // Guardar token
      localStorage.setItem('token', response.token);
      apiService.setToken(response.token);
      
      // Obtener usuario completo con roles
      const fullUser = await apiService.getCurrentUser();
      console.log('🔍 AuthContext - Usuario recibido del backend:', fullUser);
      console.log('🔍 AuthContext - ID del usuario:', fullUser?.id);
      console.log('🔍 AuthContext - Roles del usuario:', fullUser?.roles);
      setUser(fullUser as any);
      
      // Establecer rol activo automáticamente si solo tiene un rol
      if (fullUser?.roles && Array.isArray(fullUser.roles) && fullUser.roles.length === 1) {
        const firstRole: any = fullUser.roles[0];
        const rolCodigo = firstRole?.rol?.codigo || firstRole?.codigo;
        if (rolCodigo) {
          console.log('🔍 AuthContext - Estableciendo rol activo automáticamente:', rolCodigo);
          setActiveRoleState(rolCodigo);
          localStorage.setItem('activeRole', rolCodigo);
        }
      }
      
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
      localStorage.removeItem('activeRole');
      setUser(null);
      setActiveRoleState(null);
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

  const setActiveRole = useCallback((role: string) => {
    console.log('🔄 AuthContext - Cambiando rol activo a:', role);
    setActiveRoleState(role);
    localStorage.setItem('activeRole', role);
  }, []);

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
              
                  // Cargar rol activo desde localStorage
                  const savedRole = localStorage.getItem('activeRole');
                  if (savedRole) {
                    console.log('🔄 AuthContext - Cargando rol activo desde localStorage:', savedRole);
                    // Validar que el rol guardado sea un código válido
                    const validRoleCodes = ['VENDOR', 'SALES_CHIEF', 'FINANCE', 'ADMIN', 'OPERATIONS'];
                    if (validRoleCodes.includes(savedRole)) {
                      setActiveRoleState(savedRole);
                    } else {
                      console.log('🔄 AuthContext - Rol inválido en localStorage, limpiando:', savedRole);
                      localStorage.removeItem('activeRole');
                    }
                  }
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

  // Manejo de inactividad - cerrar sesión después de 10 minutos sin actividad
  useEffect(() => {
    if (!user) return; // Solo activar si hay usuario logueado

    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;

    const resetTimers = () => {
      // Limpiar timers existentes
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (warningTimer) clearTimeout(warningTimer);
      setShowInactivityWarning(false);

      // Timer de advertencia (9 minutos)
      warningTimer = setTimeout(() => {
        setShowInactivityWarning(true);
        console.warn('⚠️ Advertencia: Sesión expirará en 1 minuto por inactividad');
      }, WARNING_TIMEOUT);

      // Timer de cierre de sesión (10 minutos)
      inactivityTimer = setTimeout(() => {
        console.warn('🚪 Cerrando sesión por inactividad (10 minutos sin actividad)');
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    // Eventos que indican actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimers);
    });

    // Iniciar timers
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimers);
      });
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [user, logout, INACTIVITY_TIMEOUT, WARNING_TIMEOUT]);

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const value: AuthContextType = useMemo(() => {
    console.log('🔐 AuthContext - Creando nuevo valor del contexto - TIMESTAMP:', new Date().toISOString());
    console.log('🔐 AuthContext - user:', user);
    console.log('🔐 AuthContext - activeRole:', activeRole);
    console.log('🔐 AuthContext - isLoading:', isLoading);
    
    return {
      user,
      activeRole,
      login,
      logout,
      updateProfile,
      setActiveRole,
      isLoading,
      isAuthenticated: !!user,
    };
  }, [user, activeRole, isLoading, login, logout, updateProfile, setActiveRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Advertencia de inactividad */}
      {showInactivityWarning && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">⚠️ Sesión por expirar</h3>
                <p className="text-sm text-gray-600">Por inactividad</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Tu sesión se cerrará en <strong className="text-red-600">1 minuto</strong> por inactividad.
              Mueve el mouse o presiona cualquier tecla para continuar.
            </p>
            <button
              onClick={() => setShowInactivityWarning(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continuar Sesión
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}; 