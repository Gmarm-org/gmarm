import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ClientForm from './components/ClientForm';
import WeaponReserve from './components/WeaponReserve';
import { useClients } from './hooks/useClients';
import { useWeapons } from './hooks/useWeapons';
import type { 
  Client, 
  Weapon, 
  ClientFormMode, 
  Page
} from './types';
import './Vendedor.css';

const Vendedor: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formMode, setFormMode] = useState<ClientFormMode>('create');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [precioModificado, setPrecioModificado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: Weapon; precio: number; cantidad: number }>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Hooks para manejar clientes y armas
  const { loading: clientsLoading, error: clientsError, loadClients, clients } = useClients();
  const { weapons: availableWeapons, loading: weaponsLoading, loadWeapons } = useWeapons();

  // Estado de loading combinado
  const isLoading = clientsLoading || weaponsLoading || !isInitialized;

  // Timeout para evitar loading infinito
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Loading timeout - forcing completion');
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    loadClients();
    loadWeapons();
  }, []);

  // Efecto separado para crear asignaciones de prueba cuando los datos estén disponibles
  useEffect(() => {
    if (availableWeapons.length > 0 && clients.length > 0) {
      // Solo crear asignaciones si no existen
      const hasAssignments = Object.keys(clientWeaponAssignments).length > 0;
      if (!hasAssignments) {
        const testAssignments: Record<string, { weapon: Weapon; precio: number; cantidad: number }> = {};
        
        // Asignar armas a los primeros clientes como prueba
        clients.slice(0, 3).forEach((client, index) => {
          if (availableWeapons[index]) {
            testAssignments[client.id] = {
              weapon: availableWeapons[index],
              precio: availableWeapons[index].precio + (index * 100), // Precio diferente por cliente
              cantidad: index + 1
            };
          }
        });
        
        setClientWeaponAssignments(testAssignments);
      }
      setIsInitialized(true);
    }
  }, [availableWeapons.length, clients.length]);

  // Cerrar menú de usuario cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Navegación entre páginas
  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  // Gestión de clientes
  const handleCreateClient = () => {
    setSelectedClient(null);
    setFormMode('create');
    setCurrentPage('clientForm');
  };

  const handleAssignWeaponWithoutClient = () => {
    setSelectedClient(null);
    setSelectedWeapon(null);
    setCurrentPage('weaponSelection');
  };

  const handleClientSaved = async (client: Client) => {
    setSelectedClient(client);
    setCurrentPage('weaponSelection');
  };

  const handleCloseForm = () => {
    setCurrentPage('dashboard');
    setSelectedClient(null);
  };

  // Funciones para manejar clientes
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setFormMode('view');
    
    // Cargar la información de la arma asignada si existe
    const assignment = clientWeaponAssignments[client.id];
    if (assignment) {
      setSelectedWeapon(assignment.weapon);
      setPrecioModificado(assignment.precio);
      setCantidad(assignment.cantidad);
    } else {
      setSelectedWeapon(null);
      setPrecioModificado(0);
      setCantidad(1);
    }
    
    setCurrentPage('clientForm');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormMode('edit');
    
    // Cargar la información de la arma asignada si existe
    const assignment = clientWeaponAssignments[client.id];
    if (assignment) {
      setSelectedWeapon(assignment.weapon);
      setPrecioModificado(assignment.precio);
      setCantidad(assignment.cantidad);
    } else {
      setSelectedWeapon(null);
      setPrecioModificado(0);
      setCantidad(1);
    }
    
    setCurrentPage('clientForm');
  };

  const handleDisableClient = (clientId: string) => {
    if (window.confirm('¿Está seguro de que desea inhabilitar este cliente?')) {
      console.log('Inhabilitar cliente:', clientId);
      // Aquí implementarías la lógica de inhabilitación
    }
  };

  // Funciones para el menú de usuario
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    // Aquí implementarías la lógica de logout
    console.log('Cerrar sesión');
  };

  const handleUpdateProfile = () => {
    // Aquí implementarías la lógica para actualizar perfil
    console.log('Actualizar perfil');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const names = user.nombres?.split(' ') || [];
    const surnames = user.apellidos?.split(' ') || [];
    const first = names[0]?.charAt(0) || '';
    const last = surnames[0]?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  // Gestión de armas
  const handleWeaponSelected = (weapon: Weapon | null) => {
    if (weapon) {
      setSelectedWeapon(weapon);
      setPrecioModificado(weapon.precio);
      setCantidad(1);
    }
  };

  const handlePriceChange = (_weaponId: string, newPrice: number) => {
    setPrecioModificado(newPrice);
    
    // Si hay un cliente seleccionado, actualizar la asignación
    if (selectedClient) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          ...prev[selectedClient.id],
          weapon: selectedWeapon!,
          precio: newPrice,
          cantidad: cantidad
        }
      }));
    }
  };

  const handleQuantityChange = (_weaponId: string, newQuantity: number) => {
    setCantidad(newQuantity);
    
    // Si hay un cliente seleccionado, actualizar la asignación
    if (selectedClient) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          ...prev[selectedClient.id],
          weapon: selectedWeapon!,
          precio: precioModificado,
          cantidad: newQuantity
        }
      }));
    }
  };

  // Funciones wrapper para el ClientForm
  const handlePriceChangeWrapper = (newPrice: number) => {
    handlePriceChange('', newPrice);
  };

  const handleQuantityChangeWrapper = (newQuantity: number) => {
    handleQuantityChange('', newQuantity);
  };

  const handleNavigateToWeaponSelection = () => {
    navigateTo('weaponSelection');
  };

  const handleAssignWeaponToClient = (client: Client, weapon: Weapon) => {
    setSelectedClient(client);
    setSelectedWeapon(weapon);
    setPrecioModificado(weapon.precio);
    setCantidad(1);
    
    // Guardar la asignación
    setClientWeaponAssignments(prev => ({
      ...prev,
      [client.id]: {
        weapon,
        precio: weapon.precio,
        cantidad: 1
      }
    }));
    
    // Navegar a la página de reserva
    navigateTo('reserve');
  };

  const getWeaponPriceForClient = (weaponId: string, clientId?: string) => {
    if (clientId && clientWeaponAssignments[clientId]) {
      return clientWeaponAssignments[clientId].precio;
    }
    const weapon = availableWeapons.find(w => w.id === weaponId);
    return weapon ? weapon.precio : 0;
  };

  const handleFinishProcess = () => {
    // Aquí se guardaría la reserva
    console.log('Proceso terminado:', {
      client: selectedClient,
      weapon: selectedWeapon,
      precioUnitario: precioModificado,
      cantidad,
      iva: precioModificado * cantidad * 0.15,
      total: precioModificado * cantidad * 1.15
    });
    
    // Volver al dashboard
    setCurrentPage('dashboard');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  };

  // Renderizado condicional basado en la página actual
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="vendedor-dashboard">
            <div className="dashboard-header">
              <h1>Panel de Vendedor</h1>
              <p>Bienvenido, {user?.nombres}</p>
              
              {/* User Menu */}
              <div className="user-menu">
                <div className="user-avatar" onClick={toggleUserMenu}>
                  {getUserInitials()}
                </div>
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-item" onClick={handleUpdateProfile}>
                      👤 Actualizar Datos
                    </div>
                    <div className="user-dropdown-item logout" onClick={handleLogout}>
                      🚪 Cerrar Sesión
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card civil">
                <div className="stat-header">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>{clients.filter(c => c.tipoCliente === 'Civil').length}</h3>
                    <p>Clientes Civiles</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card uniformado">
                <div className="stat-header">
                  <div className="stat-icon">🎖️</div>
                  <div className="stat-content">
                    <h3>{clients.filter(c => c.tipoCliente === 'Uniformado').length}</h3>
                    <p>Clientes Uniformados</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card empresa">
                <div className="stat-header">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-content">
                    <h3>{clients.filter(c => c.tipoCliente === 'Compañía de Seguridad').length}</h3>
                    <p>Compañías de Seguridad</p>
                  </div>
                </div>
              </div>
              
              <div className="stat-card deportista">
                <div className="stat-header">
                  <div className="stat-icon">🏃</div>
                  <div className="stat-content">
                    <h3>{clients.filter(c => c.tipoCliente === 'Deportista').length}</h3>
                    <p>Deportistas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-actions">
              <button 
                className="btn-primary"
                onClick={handleCreateClient}
              >
                ➕ Crear Cliente
              </button>
              <button 
                className="btn-secondary"
                onClick={handleAssignWeaponWithoutClient}
              >
                🔫 Asignar Arma Sin Cliente
              </button>
            </div>

            <div className="clientes-section">
              <h2>Lista de Clientes</h2>
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Cargando clientes...</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="empty-state">
                  <p>No hay clientes registrados</p>
                  <button className="btn-primary" onClick={handleCreateClient}>
                    Crear Primer Cliente
                  </button>
                </div>
              ) : (
                <div className="clientes-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Identificación</th>
                        <th>Tipo</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id}>
                          <td>
                            <div className="client-name">
                              {client.nombres} {client.apellidos}
                            </div>
                          </td>
                          <td>{client.numeroIdentificacion}</td>
                          <td>
                            <span className={`client-type ${client.tipoCliente.toLowerCase().replace(/\s+/g, '-')}`}>
                              {client.tipoCliente}
                            </span>
                          </td>
                          <td>{client.email}</td>
                          <td>{client.telefonoPrincipal}</td>
                          <td>
                            <div className="client-actions">
                              <button 
                                className="action-btn view"
                                onClick={() => handleViewClient(client)}
                                title="Ver Cliente"
                              >
                                👁️ Ver
                              </button>
                              <button 
                                className="action-btn edit"
                                onClick={() => handleEditClient(client)}
                                title="Editar Cliente"
                              >
                                ✏️ Editar
                              </button>
                              <button 
                                className="action-btn disable"
                                onClick={() => handleDisableClient(client.id)}
                                title="Inhabilitar Cliente"
                              >
                                🚫 Inhabilitar
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
          </div>
        );

      case 'clientForm':
        return (
          <div className="client-form-container">
            <ClientForm
              mode={formMode}
              client={selectedClient}
              onSave={handleClientSaved}
              onCancel={handleCloseForm}
              selectedWeapon={selectedWeapon}
              precioModificado={precioModificado}
              cantidad={cantidad}
              onPriceChange={handlePriceChangeWrapper}
              onQuantityChange={handleQuantityChangeWrapper}
              onNavigateToWeaponSelection={handleNavigateToWeaponSelection}
            />
          </div>
        );

      case 'weaponSelection':
        return (
          <div className="weapon-selection-page">
            <div className="page-header">
              <button className="btn-back" onClick={() => navigateTo('dashboard')}>
                ← Volver al Dashboard
              </button>
              <h1>Selección de Arma</h1>
              {selectedClient && (
                <p>Cliente: {selectedClient.nombres} {selectedClient.apellidos}</p>
              )}
            </div>
            
            <WeaponReserve
              weapons={availableWeapons}
              currentClient={selectedClient}
              reservaParaCliente={selectedClient}
              clienteParaResumen={selectedClient}
              armaSeleccionadaEnReserva={selectedWeapon}
              onBack={() => navigateTo('dashboard')}
              onWeaponSelection={handleWeaponSelected}
              onWeaponSelectionInReserve={handleWeaponSelected}
              onAssignWeaponToClient={handleAssignWeaponToClient}
              onAssignWeaponToCupoCivil={(weapon) => {
                handleWeaponSelected(weapon);
                setCurrentPage('reserve');
              }}
              onConfirmData={() => setCurrentPage('reserve')}
              onUpdateWeaponPrice={handlePriceChange}
              onUpdateWeaponQuantity={handleQuantityChange}
              getWeaponPriceForClient={getWeaponPriceForClient}
              currentClientId={selectedClient?.id}
            />
          </div>
        );

      case 'reserve':
        return (
          <div className="reserve-page">
            <div className="page-header">
              <button className="btn-back" onClick={() => navigateTo('weaponSelection')}>
                ← Volver a Selección
              </button>
              <h1>Reserva de Arma</h1>
            </div>
            
            {selectedClient && (
              <div className="client-info">
                <h3>Cliente Seleccionado</h3>
                <p><strong>Nombre:</strong> {selectedClient.nombres} {selectedClient.apellidos}</p>
                <p><strong>Identificación:</strong> {selectedClient.numeroIdentificacion}</p>
                <p><strong>Tipo:</strong> {selectedClient.tipoCliente}</p>
                <p><strong>Email:</strong> {selectedClient.email}</p>
              </div>
            )}
            
            {selectedWeapon && (
              <div className="reserve-details">
                <div className="weapon-info">
                  <h3>Arma Seleccionada</h3>
                  <p><strong>Modelo:</strong> {selectedWeapon.modelo}</p>
                  <p><strong>Calibre:</strong> {selectedWeapon.calibre}</p>
                  <p><strong>Capacidad:</strong> {selectedWeapon.capacidad}</p>
                </div>

                <div className="pricing-section">
                  <h3>Precios</h3>
                  <div className="price-input">
                    <label>Precio Unitario:</label>
                    <input
                      type="number"
                      value={precioModificado}
                      onChange={(e) => handlePriceChange(selectedWeapon?.id || '', parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>
                  <div className="quantity-input">
                    <label>Cantidad:</label>
                    <input
                      type="number"
                      value={cantidad}
                      onChange={(e) => handleQuantityChange(selectedWeapon?.id || '', parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                  
                  <div className="price-breakdown">
                    <p><strong>Subtotal:</strong> ${(precioModificado * cantidad).toFixed(2)}</p>
                    <p><strong>IVA (15%):</strong> <span className="iva-green">${(precioModificado * cantidad * 0.15).toFixed(2)}</span></p>
                    <p><strong>Total:</strong> <span className="total-green">${(precioModificado * cantidad * 1.15).toFixed(2)}</span></p>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="btn-primary"
                    onClick={handleFinishProcess}
                  >
                    ✅ Terminar Proceso
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Página no encontrada</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="vendedor-container">
      {/* Contenido principal */}
      <main className="vendedor-main">
        {clientsError && (
          <div className="error-message">
            {clientsError}
          </div>
        )}

        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Vendedor; 