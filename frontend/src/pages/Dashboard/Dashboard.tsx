import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user, logout, hasRole, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      // Aquí cargarías las estadísticas reales del backend
      // Por ahora usamos datos mock
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
      console.error('Error loading dashboard stats:', error);
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

    if (hasAnyRole(['VENDEDOR', 'ADMIN'])) {
      items.push({
        title: 'Gestión de Clientes',
        description: 'Registrar y gestionar clientes',
        icon: '👥',
        path: '/vendedor',
        color: 'blue'
      });
    }

    if (hasAnyRole(['JEFE_VENTAS', 'ADMIN'])) {
      items.push({
        title: 'Licencias',
        description: 'Gestionar licencias de importación',
        icon: '📋',
        path: '/licencias',
        color: 'green'
      });
    }

    if (hasAnyRole(['FINANZAS', 'ADMIN'])) {
      items.push({
        title: 'Pagos',
        description: 'Gestionar pagos y facturación',
        icon: '💳',
        path: '/pagos',
        color: 'purple'
      });
    }

    if (hasAnyRole(['OPERACIONES', 'ADMIN'])) {
      items.push({
        title: 'Importaciones',
        description: 'Gestionar grupos de importación',
        icon: '📦',
        path: '/importaciones',
        color: 'orange'
      });
    }

    if (hasRole('ADMIN')) {
      items.push({
        title: 'Usuarios',
        description: 'Gestionar usuarios del sistema',
        icon: '👤',
        path: '/usuario',
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
          {hasAnyRole(['VENDEDOR', 'ADMIN']) && (
            <button 
              className="action-button"
              onClick={() => navigate('/vendedor')}
            >
              ➕ Crear Nuevo Cliente
            </button>
          )}
          {hasAnyRole(['JEFE_VENTAS', 'ADMIN']) && (
            <button 
              className="action-button"
              onClick={() => navigate('/licencias')}
            >
              📋 Ver Licencias
            </button>
          )}
          {hasAnyRole(['FINANZAS', 'ADMIN']) && (
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