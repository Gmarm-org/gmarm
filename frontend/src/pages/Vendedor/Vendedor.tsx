import React, { useState, useEffect } from 'react';
import { mockApiService } from '../../services/mockApiService';
import type { Client } from '../../types';
import Header from '../../components/Header';
import ClientForm from './components/ClientForm';
import WeaponReserve from './components/WeaponReserve';

const Vendedor: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableWeapons, setAvailableWeapons] = useState<any[]>([]); // Changed type to any[] as Weapon type was removed
  const [selectedWeapon, setSelectedWeapon] = useState<any | null>(null); // Changed type to any
  const [precioModificado, setPrecioModificado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: any; precio: number; cantidad: number }>>({}); // Changed type to any
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [weaponsLoading, setWeaponsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadClients();
    loadWeapons();
  }, []);

  useEffect(() => {
    if (availableWeapons.length > 0 && clients.length > 0 && Object.keys(clientWeaponAssignments).length === 0) {
      // Crear asignaciones de prueba para los primeros 3 clientes
      const testAssignments: Record<string, { weapon: any; precio: number; cantidad: number }> = {};
      const firstWeapon = availableWeapons[0];
      
      clients.slice(0, 3).forEach(client => {
        testAssignments[client.id] = {
          weapon: firstWeapon,
          precio: firstWeapon.precio,
          cantidad: 1
        };
      });
      
      setClientWeaponAssignments(testAssignments);
      setIsInitialized(true);
    }
  }, [availableWeapons, clients, clientWeaponAssignments]);

  const loadClients = async () => {
    try {
      setClientsLoading(true);
      const response = await mockApiService.getClientes();
      setClients(response.data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setClientsLoading(false);
    }
  };

  const loadWeapons = async () => {
    try {
      setWeaponsLoading(true);
      const weaponsData = await mockApiService.getWeapons();
      setAvailableWeapons(weaponsData);
    } catch (error) {
      console.error('Error al cargar armas:', error);
    } finally {
      setWeaponsLoading(false);
    }
  };

  const handleCreateClient = () => {
    setCurrentPage('clientForm');
    setSelectedClient(null);
  };

  const handleAssignWeaponWithoutClient = () => {
    setCurrentPage('weaponSelection');
    setSelectedClient(null);
  };

  const handleClientSaved = (client: Client) => {
    setClients(prev => [client, ...prev]);
    setCurrentPage('weaponSelection');
    setSelectedClient(client);
  };

  const handleCloseForm = () => {
    setCurrentPage('dashboard');
    setSelectedClient(null);
  };

  const handleWeaponSelected = (weapon: any | null) => {
    if (weapon) {
      setSelectedWeapon(weapon);
      setPrecioModificado(weapon.precio);
      setCantidad(1);
    }
  };

  const handlePriceChange = (_weaponId: string, newPrice: number) => {
    setPrecioModificado(newPrice);
    if (selectedClient) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          ...prev[selectedClient.id],
          precio: newPrice
        }
      }));
    }
  };

  const handleQuantityChange = (_weaponId: string, newQuantity: number) => {
    setCantidad(newQuantity);
    if (selectedClient) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          ...prev[selectedClient.id],
          cantidad: newQuantity
        }
      }));
    }
  };

  const handleFinishProcess = () => {
    console.log('Reserva completada:', {
      client: selectedClient,
      weapon: selectedWeapon,
      precio: precioModificado,
      cantidad,
      iva: precioModificado * 0.15,
      total: precioModificado * 1.15
    });
    setCurrentPage('dashboard');
    setSelectedClient(null);
    setSelectedWeapon(null);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setCurrentPage('clientForm');
    
    // Cargar datos de arma asignada si existe
    const assignment = clientWeaponAssignments[client.id];
    if (assignment) {
      setSelectedWeapon(assignment.weapon);
      setPrecioModificado(assignment.precio);
      setCantidad(assignment.cantidad);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setCurrentPage('clientForm');
    
    // Cargar datos de arma asignada si existe
    const assignment = clientWeaponAssignments[client.id];
    if (assignment) {
      setSelectedWeapon(assignment.weapon);
      setPrecioModificado(assignment.precio);
      setCantidad(assignment.cantidad);
    }
  };

  const handleDisableClient = (clientId: string) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, estado: 'INACTIVO' } : c
    ));
  };

  const handleFilterByType = (tipoCliente: string) => {
    if (clientFilter === tipoCliente) {
      setClientFilter(null);
    } else {
      setClientFilter(tipoCliente);
    }
  };

  const clearFilter = () => {
    setClientFilter(null);
  };

  const getFilteredClients = () => {
    if (!clientFilter) return clients;
    return clients.filter(client => client.tipoCliente === clientFilter);
  };

  const getWeaponForClient = (clientId: string) => {
    return clientWeaponAssignments[clientId];
  };

  const handlePriceChangeWrapper = (price: number) => {
    if (selectedWeapon) {
      handlePriceChange(selectedWeapon.id, price);
    }
  };

  const handleQuantityChangeWrapper = (quantity: number) => {
    if (selectedWeapon) {
      handleQuantityChange(selectedWeapon.id, quantity);
    }
  };

  const handleNavigateToWeaponSelection = () => {
    setCurrentPage('weaponSelection');
  };

  const isLoading = clientsLoading || weaponsLoading || !isInitialized;

  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('Vendedor screen still loading after 10 seconds');
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  const getClientCountByType = (tipo: string) => {
    return clients.filter(client => client.tipoCliente === tipo).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando módulo vendedor...</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="p-6">
            {/* Estadísticas de clientes por tipo - CON COLORES como tenías originalmente */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div 
                className={`rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  clientFilter === 'Civil' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100'
                }`}
                onClick={() => handleFilterByType('Civil')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Civiles</p>
                      <p className="text-2xl font-bold text-gray-900">{getClientCountByType('Civil')}</p>
                    </div>
                  </div>
                  {clientFilter === 'Civil' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div 
                className={`rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  clientFilter === 'Uniformado' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100'
                }`}
                onClick={() => handleFilterByType('Uniformado')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Uniformados</p>
                      <p className="text-2xl font-bold text-gray-900">{getClientCountByType('Uniformado')}</p>
                    </div>
                  </div>
                  {clientFilter === 'Uniformado' && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div 
                className={`rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  clientFilter === 'Compañía de Seguridad' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-green-50 hover:border-green-300 hover:bg-green-100'
                }`}
                onClick={() => handleFilterByType('Compañía de Seguridad')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Compañías</p>
                      <p className="text-2xl font-bold text-gray-900">{getClientCountByType('Compañía de Seguridad')}</p>
                    </div>
                  </div>
                  {clientFilter === 'Compañía de Seguridad' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div 
                className={`rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  clientFilter === 'Deportista' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                }`}
                onClick={() => handleFilterByType('Deportista')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Deportistas</p>
                      <p className="text-2xl font-bold text-gray-900">{getClientCountByType('Deportista')}</p>
                    </div>
                  </div>
                  {clientFilter === 'Deportista' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón para limpiar filtro - MÁS VISUAL */}
            {clientFilter && (
              <div className="mb-6">
                <button
                  onClick={clearFilter}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Limpiar Filtro: {clientFilter}</span>
                </button>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={handleCreateClient}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
              >
                Crear Cliente
              </button>
              <button
                onClick={handleAssignWeaponWithoutClient}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
              >
                Asignar Arma Sin Cliente
              </button>
            </div>

            {/* Tabla de clientes - MENOS PLANA con separación sutil */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        CLIENTE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        TIPO
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        IDENTIFICACIÓN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        TELÉFONO
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        MODELO DE ARMA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        ACCIONES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {getFilteredClients().map((client, index) => {
                      const weaponAssignment = getWeaponForClient(client.id);
                      return (
                        <tr key={client.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {client.nombres} {client.apellidos}
                              </div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.tipoCliente === 'Civil' ? 'bg-blue-100 text-blue-800' :
                              client.tipoCliente === 'Uniformado' ? 'bg-orange-100 text-orange-800' :
                              client.tipoCliente === 'Compañía de Seguridad' ? 'bg-green-100 text-green-800' :
                              client.tipoCliente === 'Deportista' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {client.tipoCliente}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.numeroIdentificacion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.telefonoPrincipal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {weaponAssignment ? (
                              `${weaponAssignment.weapon.modelo} (${weaponAssignment.weapon.calibre})`
                            ) : (
                              <span className="text-gray-400">Sin arma asignada</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewClient(client)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => handleEditClient(client)}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDisableClient(client.id)}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Desactivar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'clientForm':
        return (
          <div className="p-6">
            <ClientForm
              mode={selectedClient ? 'edit' : 'create'}
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
          <div className="p-6">
            <WeaponReserve
              weapons={availableWeapons}
              currentClient={selectedClient}
              reservaParaCliente={selectedClient}
              clienteParaResumen={selectedClient}
              armaSeleccionadaEnReserva={selectedWeapon}
              onBack={() => setCurrentPage('dashboard')}
              onWeaponSelection={handleWeaponSelected}
              onWeaponSelectionInReserve={handleWeaponSelected}
              onAssignWeaponToClient={(client, weapon) => {
                setSelectedClient(client);
                setSelectedWeapon(weapon);
                setPrecioModificado(weapon.precio);
                setCantidad(1);
              }}
              onAssignWeaponToCupoCivil={(weapon) => {
                setSelectedWeapon(weapon);
                setPrecioModificado(weapon.precio);
                setCantidad(1);
              }}
              onConfirmData={handleFinishProcess}
              onUpdateWeaponPrice={handlePriceChange}
              onUpdateWeaponQuantity={handleQuantityChange}
              getWeaponPriceForClient={(weaponId, clientId) => {
                if (clientId && clientWeaponAssignments[clientId]) {
                  return clientWeaponAssignments[clientId].precio;
                }
                const weapon = availableWeapons.find(w => w.id === weaponId);
                return weapon ? weapon.precio : 0;
              }}
              currentClientId={selectedClient?.id}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header como en la imagen - CON MÁS COLOR */}
      <Header title="Vendedor" subtitle="Gestión de clientes y ventas" />

      <div className="p-6">
        {renderCurrentPage()}
      </div>
    </div>
  );
};

export default Vendedor; 