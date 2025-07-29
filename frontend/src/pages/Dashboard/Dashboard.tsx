import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockApiService } from '../../services/mockApiService';
import './Dashboard.css';

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
        icon: '💳',
        path: '/pagos',
        color: 'purple'
      });
    }

    if (hasRole['ADMIN']) {
      items.push({
        title: 'Importaciones',
        description: 'Gestionar grupos de importación',
        icon: '📦',
        path: '/importaciones',
        color: 'orange'
      });
    }

    if (hasRole['ADMIN']) {
      items.push({
        title: 'Usuarios',
        description: 'Gestionar usuarios del sistema',
        icon: '👤',
        path: '/usuarios',
        color: 'red'
      });
    }

    return items;
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard - Sistema de Importación de Armas</h1>
          <div className="user-info">
            <span>Bienvenido, {user?.nombres} {user?.apellidos}</span>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <section className="stats-section">
          <h2>Estadísticas Generales</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.totalClientes}</h3>
                <p>Total Clientes</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.clientesActivos}</h3>
                <p>Clientes Activos</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{stats.clientesPendientes}</h3>
                <p>Clientes Pendientes</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>{stats.licenciasActivas}</h3>
                <p>Licencias Activas</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <h3>{stats.gruposActivos}</h3>
                <p>Grupos Activos</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Menu Items */}
      <section className="menu-section">
        <h2>Módulos del Sistema</h2>
        <div className="menu-grid">
          {getMenuItems().map((item, index) => (
            <div 
              key={index} 
              className={`menu-card menu-card-${item.color}`}
              onClick={() => navigate(item.path)}
            >
              <div className="menu-icon">{item.icon}</div>
              <div className="menu-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          {hasAnyRole['VENDEDOR_ADMIN'] && (
            <button 
              className="action-button"
              onClick={() => navigate('/vendedor')}
            >
              ➕ Crear Nuevo Cliente
            </button>
          )}
          {hasAnyRole['JEFE_ADMIN'] && (
            <button 
              className="action-button"
              onClick={() => navigate('/licencias')}
            >
              📋 Ver Licencias
            </button>
          )}
          {hasAnyRole['FINANZAS_ADMIN'] && (
            <button 
              className="action-button"
              onClick={() => navigate('/pagos')}
            >
              💳 Registrar Pago
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard; 