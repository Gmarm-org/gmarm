import React from 'react';
import WeaponReserve from './components/WeaponReserve';
import Header from '../../components/Header';
import ClientForm from './components/ClientForm';
import { useVendedorLogic } from './hooks/useVendedorLogic';

const Vendedor: React.FC = React.memo(() => {
  console.log('🔫 Vendedor - COMPONENTE INICIADO - TIMESTAMP:', new Date().toISOString());
  
  // Usar el hook personalizado para toda la lógica
  const {
    currentPage,
    selectedClient,
    clientFormMode,
    availableWeapons,
    selectedWeapon,
    precioModificado,
    cantidad,
    clientWeaponAssignments,
    clientFilter,
    clientesBloqueados,
    isLoading,
    setCurrentPage,
    setSelectedClient,
    setSelectedWeapon,
    setPrecioModificado,
    setCantidad,
    setClientWeaponAssignments,
    getClientStatus,
    getStatusColor,
    getStatusText,
    handleCreateClient,
    handleAssignWeaponWithoutClient,
    handleClientSaved,
    handleClienteBloqueado,
    handleCloseForm,
    handleWeaponSelected,
    handlePriceChange,
    handleQuantityChange,
    handleFinishProcess,
    handleViewClient,
    handleEditClient,
    handleFilterByType,
    clearFilter,
    getFilteredClients,
    getWeaponForClient,
    handlePriceChangeWrapper,
    handleQuantityChangeWrapper,
    handleNavigateToWeaponSelection,
    getClientCountByType,
  } = useVendedorLogic();

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
            {/* Estadísticas de clientes por tipo */}
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

            {/* Botón para limpiar filtro */}
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

            {/* Tabla de clientes */}
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
                        ESTADO
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
                              `${weaponAssignment.weapon.nombre} (${weaponAssignment.weapon.calibre})`
                            ) : (
                              <span className="text-gray-400">Sin arma asignada</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              const status = getClientStatus(client);
                              return (
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                    {getStatusText(status)}
                                  </span>
                                  {status === 'BLOQUEADO' && clientesBloqueados[client.id]?.motivo && (
                                    <div className="relative group">
                                      <svg className="w-4 h-4 text-red-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                        {clientesBloqueados[client.id]?.motivo}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-red-900"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
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
              mode={clientFormMode}
              client={selectedClient as any}
              onSave={handleClientSaved as any}
              onCancel={handleCloseForm}
              selectedWeapon={selectedWeapon}
              precioModificado={precioModificado}
              cantidad={cantidad}
              onPriceChange={handlePriceChangeWrapper}
              onQuantityChange={handleQuantityChangeWrapper}
              onNavigateToWeaponSelection={handleNavigateToWeaponSelection}
              onClienteBloqueado={handleClienteBloqueado}
            />
          </div>
        );

      case 'weaponSelection':
        return (
          <div className="p-6">
            <WeaponReserve
              weapons={availableWeapons}
              currentClient={selectedClient as any}
              reservaParaCliente={selectedClient as any}
              clienteParaResumen={selectedClient as any}
              armaSeleccionadaEnReserva={selectedWeapon}
              onBack={() => setCurrentPage('dashboard')}
              onWeaponSelection={handleWeaponSelected}
              onWeaponSelectionInReserve={handleWeaponSelected}
              onAssignWeaponToClient={(client, weapon) => {
                setSelectedClient(client as any);
                setSelectedWeapon(weapon);
                setPrecioModificado(weapon.precioReferencia || 0);
                setCantidad(1);
                
                setClientWeaponAssignments(prev => ({
                  ...prev,
                  [client.id]: {
                    weapon: weapon,
                    precio: weapon.precioReferencia || 0,
                    cantidad: 1
                  }
                }));
              }}
              onAssignWeaponToCupoCivil={(weapon) => {
                setSelectedWeapon(weapon);
                setPrecioModificado(weapon.precioReferencia || 0);
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
                return weapon ? weapon.precioReferencia : 0;
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
      <Header title="Vendedor" subtitle="Gestión de clientes y ventas" />
      <div className="p-6">
        {renderCurrentPage()}
      </div>
    </div>
  );
});

export default Vendedor; 