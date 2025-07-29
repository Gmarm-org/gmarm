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
  const { user, logout, updateProfile } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formMode, setFormMode] = useState<ClientFormMode>('create');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [precioModificado, setPrecioModificado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: Weapon; precio: number; cantidad: number }>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    email: user?.email || '',
    telefonoPrincipal: user?.telefonoPrincipal || '',
    telefonoSecundario: user?.telefonoSecundario || '',
    direccion: user?.direccion || ''
  });

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

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
    setShowUserMenu(false);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      // La redirección se manejará automáticamente en el AuthContext
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleFilterByType = (tipoCliente: string) => {
    if (clientFilter === tipoCliente) {
      // Si ya está filtrado por ese tipo, quitar el filtro
      setClientFilter(null);
    } else {
      // Aplicar el filtro
      setClientFilter(tipoCliente);
    }
  };

  const clearFilter = () => {
    setClientFilter(null);
  };

  const getFilteredClients = () => {
    if (!clientFilter) {
      return clients;
    }
    return clients.filter(client => client.tipoCliente === clientFilter);
  };

  const getWeaponForClient = (clientId: string) => {
    const assignment = clientWeaponAssignments[clientId];
    return assignment ? assignment.weapon : null;
  };

  const handleUpdateProfile = () => {
    // Inicializar el formulario con los datos actuales del usuario
    setProfileForm({
      nombres: user?.nombres || '',
      apellidos: user?.apellidos || '',
      email: user?.email || '',
      telefonoPrincipal: user?.telefonoPrincipal || '',
      telefonoSecundario: user?.telefonoSecundario || '',
      direccion: user?.direccion || ''
    });
    setCurrentPage('profile');
    setShowUserMenu(false);
  };

  const handleProfileFormChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setCurrentPage('dashboard');
      // Mostrar mensaje de éxito
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar perfil');
    }
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
              <div 
                className={`stat-card civil ${clientFilter === 'Civil' ? 'active' : ''}`}
                onClick={() => handleFilterByType('Civil')}
              >
                <div className="stat-header">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>{clients.filter(c => c.tipoCliente === 'Civil').length}</h3>
                    <p>Clientes Civiles</p>
                  </div>
                </div>
                {clientFilter === 'Civil' && (
                  <div className="filter-indicator">
                    <span>✓ Filtro activo</span>
                  </div>
                )}
              </div>
              
              <div 
                className={`stat-card uniformado ${clientFilter === 'Uniformado' ? 'active' : ''}`}
                onClick={() => handleFilterByType('Uniformado')}
              >
                <div className="stat-header">
                  <div className="stat-icon">🎖️</div>
                  <div className="stat-content">
                    <h3>{clients.filter(c => c.tipoCliente === 'Uniformado').length}</h3>
                    <p>Clientes Uniformados</p>
                  </div>
                </div>
                {clientFilter === 'Uniformado' && (
                  <div className="filter-indicator">
                    <span>✓ Filtro activo</span>
                  </div>
                )}
              </div>
              
              <div 
                className={`stat-card empresa ${clientFilter === 'Compañía de Seguridad' ? 'active' : ''}`}
                onClick={() => handleFilterByType('Compañía de Seguridad')}
              >
                <div className="stat-header">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-content">
                    <h3>{clients.filter(c => c.tipoCliente === 'Compañía de Seguridad').length}</h3>
                    <p>Compañías de Seguridad</p>
                  </div>
                </div>
                {clientFilter === 'Compañía de Seguridad' && (
                  <div className="filter-indicator">
                    <span>✓ Filtro activo</span>
                  </div>
                )}
              </div>
              
              <div 
                className={`stat-card deportista ${clientFilter === 'Deportista' ? 'active' : ''}`}
                onClick={() => handleFilterByType('Deportista')}
              >
                <div className="stat-header">
                  <div className="stat-icon">🏃</div>
                  <div className="stat-content">
                    <h3>{clients.filter(c => c.tipoCliente === 'Deportista').length}</h3>
                    <p>Deportistas</p>
                  </div>
                </div>
                {clientFilter === 'Deportista' && (
                  <div className="filter-indicator">
                    <span>✓ Filtro activo</span>
                  </div>
                )}
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
              <div className="section-header">
                <h2>Lista de Clientes</h2>
                {clientFilter && (
                  <div className="filter-controls">
                    <span className="filter-info">
                      Filtrado por: <strong>{clientFilter}</strong>
                    </span>
                    <button 
                      className="btn-clear-filter"
                      onClick={clearFilter}
                    >
                      ✕ Limpiar Filtro
                    </button>
                  </div>
                )}
              </div>
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Cargando clientes...</p>
                </div>
              ) : getFilteredClients().length === 0 ? (
                <div className="empty-state">
                  <p>
                    {clientFilter 
                      ? `No hay clientes de tipo "${clientFilter}"` 
                      : 'No hay clientes registrados'
                    }
                  </p>
                  {clientFilter ? (
                    <button className="btn-primary" onClick={clearFilter}>
                      Ver Todos los Clientes
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={handleCreateClient}>
                      Crear Primer Cliente
                    </button>
                  )}
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
                        <th>Modelo de Arma</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredClients().map((client) => {
                        const assignedWeapon = getWeaponForClient(client.id);
                        return (
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
                              {assignedWeapon ? (
                                <div className="weapon-info">
                                  <span className="weapon-model">{assignedWeapon.modelo}</span>
                                  <span className="weapon-caliber">{assignedWeapon.calibre}</span>
                                </div>
                              ) : (
                                <span className="no-weapon">Sin arma asignada</span>
                              )}
                            </td>
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
                        );
                      })}
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

      case 'profile':
        return (
          <div className="profile-page">
            <div className="page-header">
              <button className="btn-back" onClick={() => navigateTo('dashboard')}>
                ← Volver al Dashboard
              </button>
              <h1>Actualizar Perfil</h1>
            </div>
            
            <div className="profile-form-container">
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-section">
                  <h3>Información Personal</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nombres *</label>
                      <input
                        type="text"
                        value={profileForm.nombres}
                        onChange={(e) => handleProfileFormChange('nombres', e.target.value)}
                        required
                        className="form-input"
                        placeholder="Ingrese los nombres"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Apellidos *</label>
                      <input
                        type="text"
                        value={profileForm.apellidos}
                        onChange={(e) => handleProfileFormChange('apellidos', e.target.value)}
                        required
                        className="form-input"
                        placeholder="Ingrese los apellidos"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => handleProfileFormChange('email', e.target.value)}
                      required
                      className="form-input"
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Información de Contacto</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Teléfono Principal *</label>
                      <input
                        type="tel"
                        value={profileForm.telefonoPrincipal}
                        onChange={(e) => handleProfileFormChange('telefonoPrincipal', e.target.value)}
                        required
                        className="form-input"
                        placeholder="Ingrese el teléfono"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Teléfono Secundario</label>
                      <input
                        type="tel"
                        value={profileForm.telefonoSecundario}
                        onChange={(e) => handleProfileFormChange('telefonoSecundario', e.target.value)}
                        className="form-input"
                        placeholder="Teléfono secundario (opcional)"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dirección *</label>
                    <input
                      type="text"
                      value={profileForm.direccion}
                      onChange={(e) => handleProfileFormChange('direccion', e.target.value)}
                      required
                      className="form-input"
                      placeholder="Ingrese la dirección"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => navigateTo('dashboard')}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Actualizar Perfil
                  </button>
                </div>
              </form>
            </div>
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

      {/* Modal de Confirmación de Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Desea cerrar sesión?
                </h3>
                <p className="text-sm text-gray-600">
                  Se cerrará su sesión actual y será redirigido al login.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelLogout}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold"
                >
                  Sí, Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendedor; 