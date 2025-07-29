import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockApiService } from '../../services/mockApiService';

interface DashboardStats {
  totalClientes: number;
  clientesActivos: number;
  clientesPendientes: number;
  totalLicencias: number;
  licenciasActivas: number;
  totalGrupos: number;
  gruposActivos: number;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRole, setHasRole] = useState<Record<string, boolean>>({});
  const [hasAnyRole, setHasAnyRole] = useState<Record<string, boolean>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar roles del usuario
      await mockApiService.getUserRoles();
      
      // Verificar roles específicos
      const roleChecks: Record<string, boolean> = {};
      const anyRoleChecks: Record<string, boolean> = {};
      
      roleChecks['ADMIN'] = await mockApiService.hasRole('ADMIN');
      roleChecks['VENDEDOR'] = await mockApiService.hasRole('VENDEDOR');
      roleChecks['FINANZAS'] = await mockApiService.hasRole('FINANZAS');
      roleChecks['JEFE_VENTAS'] = await mockApiService.hasRole('JEFE_VENTAS');
      
      anyRoleChecks['FINANZAS_ADMIN'] = await mockApiService.hasAnyRole(['FINANZAS', 'ADMIN']);
      anyRoleChecks['VENDEDOR_ADMIN'] = await mockApiService.hasAnyRole(['VENDEDOR', 'ADMIN']);
      anyRoleChecks['JEFE_ADMIN'] = await mockApiService.hasAnyRole(['JEFE_VENTAS', 'ADMIN']);
      
      setHasRole(roleChecks);
      setHasAnyRole(anyRoleChecks);

      // Cargar estadísticas mock
      setStats({
        totalClientes: 150,
        clientesActivos: 120,
        clientesPendientes: 30,
        totalLicencias: 25,
        licenciasActivas: 20,
        totalGrupos: 15,
        gruposActivos: 8
      });
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [];

    if (hasAnyRole['VENDEDOR_ADMIN']) {
      items.push({
        title: 'Gestión de Clientes',
        description: 'Registrar y gestionar clientes',
        icon: '👥',
        path: '/vendedor',
        color: 'blue'
      });
    }

    if (hasAnyRole['JEFE_ADMIN']) {
      items.push({
        title: 'Licencias',
        description: 'Gestionar licencias de importación',
        icon: '📋',
        path: '/licencias',
        color: 'green'
      });
    }

    if (hasAnyRole['FINANZAS_ADMIN']) {
      items.push({
        title: 'Pagos',
        description: 'Gestionar pagos y facturación',
        icon: '💰',
        path: '/pagos',
        color: 'yellow'
      });
    }

    if (hasRole['ADMIN']) {
      items.push({
        title: 'Gestión de Usuarios',
        description: 'Administrar usuarios del sistema',
        icon: '👤',
        path: '/usuarios',
        color: 'purple'
      });
    }

    return items;
  };

  const getQuickActions = () => {
    const actions = [];

    if (hasAnyRole['VENDEDOR_ADMIN']) {
      actions.push({
        title: 'Crear Cliente',
        description: 'Registrar nuevo cliente',
        icon: '➕',
        path: '/vendedor',
        color: 'blue'
      });
    }

    if (hasAnyRole['FINANZAS_ADMIN']) {
      actions.push({
        title: 'Nuevo Pago',
        description: 'Registrar pago',
        icon: '💳',
        path: '/pagos',
        color: 'green'
      });
    }

    return actions;
  };

  const getUserInitials = () => {
    if (!user?.nombres || !user?.apellidos) return 'U';
    return `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center space-x-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg font-semibold text-gray-700">Cargando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Sistema de Importación de Armas</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getUserInitials()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.nombres} {user?.apellidos}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {/* Implementar actualizar datos */}}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Actualizar Datos
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClientes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.clientesActivos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.clientesPendientes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Licencias</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLicencias}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {getMenuItems().map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <div className={`bg-${item.color}-100 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform duration-200`}>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center text-blue-600 font-medium">
                <span>Acceder</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getQuickActions().map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
              >
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 