import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import ClientForm from './components/ClientForm';
import './Vendedor.css';

interface Client {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  numeroIdentificacion: string;
  tipoCliente: string;
  tipoIdentificacion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  direccion: string;
  provincia?: string;
  canton?: string;
  estado: string;
  fechaCreacion: string;
  usuarioCreador: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

interface DashboardStats {
  totalClientes: number;
  clientesActivos: number;
  clientesPendientes: number;
  clientesPorTipo: {
    [key: string]: number;
  };
}

const Vendedor: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadClients();
    loadStats();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Cargar clientes del vendedor actual
      const response = await apiService.getClientesPorVendedor(user!.id);
      setClients(response);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      setError('Error al cargar los clientes: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calcular estadísticas desde los clientes cargados
      const totalClientes = clients.length;
      const clientesActivos = clients.filter(c => c.estado === 'ACTIVO').length;
      const clientesPendientes = clients.filter(c => c.estado === 'PENDIENTE').length;
      
      const clientesPorTipo = clients.reduce((acc, client) => {
        const tipo = client.tipoCliente;
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      setStats({
        totalClientes,
        clientesActivos,
        clientesPendientes,
        clientesPorTipo
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setFormMode('create');
    setShowClientForm(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setFormMode('view');
    setShowClientForm(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormMode('edit');
    setShowClientForm(true);
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
      return;
    }

    try {
      await apiService.deleteCliente(clientId);
      await loadClients();
      await loadStats();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      setError('Error al eliminar el cliente: ' + error.message);
    }
  };

  const handleClientSaved = async () => {
    setShowClientForm(false);
    await loadClients();
    await loadStats();
  };

  const handleCloseForm = () => {
    setShowClientForm(false);
    setSelectedClient(null);
    setError('');
  };

  const getClientTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'Civil':
        return 'blue';
      case 'Militar':
        return 'green';
      case 'Empresa Seguridad':
        return 'purple';
      case 'Deportista':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'PENDIENTE':
        return 'warning';
      case 'BLOQUEADO':
        return 'danger';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="vendedor-container">
      {/* Header */}
      <div className="vendedor-header">
        <h1>Dashboard de Vendedor</h1>
        <button onClick={handleCreateClient} className="btn btn-primary">
          ➕ Crear Cliente
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-section">
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
              <div className="stat-icon">🏢</div>
              <div className="stat-content">
                <h3>{stats.clientesPorTipo['Empresa Seguridad'] || 0}</h3>
                <p>Compañías de Seguridad</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="clients-section">
        <h2>Lista de Clientes</h2>
        
        {clients.length === 0 ? (
          <div className="empty-state">
            <p>No hay clientes registrados</p>
            <button onClick={handleCreateClient} className="btn btn-primary">
              Crear Primer Cliente
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Identificación</th>
                  <th>Tipo</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="client-name">
                        <strong>{client.nombres} {client.apellidos}</strong>
                      </div>
                    </td>
                    <td>{client.numeroIdentificacion}</td>
                    <td>
                      <span className={`badge badge-${getClientTypeColor(client.tipoCliente)}`}>
                        {client.tipoCliente}
                      </span>
                    </td>
                    <td>{client.email}</td>
                    <td>{client.telefonoPrincipal}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(client.estado)}`}>
                        {client.estado}
                      </span>
                    </td>
                    <td>{new Date(client.fechaCreacion).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="btn btn-secondary"
                          title="Ver Detalle"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="btn btn-primary"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="btn btn-danger"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      {showClientForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ClientForm
              mode={formMode}
              client={selectedClient}
              onSave={handleClientSaved}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendedor; 