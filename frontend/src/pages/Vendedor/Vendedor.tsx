import React from 'react';
import WeaponReserve from './components/WeaponReserve';
import Header from '../../components/Header';
import ClientForm from './components/ClientForm';
import PaymentForm from './components/PaymentForm';
import SeriesAssignment from './components/SeriesAssignment';

import { useVendedorLogic } from './hooks/useVendedorLogic';

const Vendedor: React.FC = React.memo(() => {
  // Componente Vendedor inicializado
  
  // Estado para pestaña activa
  const [activeTab, setActiveTab] = React.useState<'en-proceso' | 'asignados'>('en-proceso');
  
  // Usar el hook personalizado para toda la lógica
  const {
    currentPage,
    selectedClient,
    clientFormMode,
    availableWeapons,
    selectedWeapon,
    precioModificado,
    cantidad,
    clientFormData,
    clientWeaponAssignments,
    weaponPrices,
    clientFilter,
    clientesBloqueados,
    isLoading,
    currentPageNumber,
    totalPages,
    totalClients,
    pageSize,
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
    handleNextPage,
    handlePrevPage,
    goToPage,
    handleClientSaved,
    handleClienteBloqueado,
    handleCloseForm,
    handleWeaponSelected,
    handlePriceChange,
    handleQuantityChange,
    // handleFinishProcess,
    handleViewClient,
    handleEditClient,
    handleFilterByType,
    clearFilter,
    getFilteredClients,
    getWeaponForClient,
    handlePriceChangeWrapper,
    handleQuantityChangeWrapper,
    handleNavigateToWeaponSelection,
    handlePaymentComplete,
    handleClientDataConfirm,
    handleWeaponSelectionConfirm,
    handleBackToClientForm,
    handleSerieSelected,
    handleBackToWeaponSelection,
    selectedSerieNumero,
    expoferiaActiva,

    getClientCountByType,
  } = useVendedorLogic();
  
  // Filtrar clientes según el tab activo
  const getClientsByTab = () => {
    const allClients = getFilteredClients();
    if (activeTab === 'en-proceso') {
      // Clientes sin arma o con arma RESERVADA
      return allClients.filter(client => {
        const weaponAssignment = getWeaponForClient(client.id);
        return !weaponAssignment || weaponAssignment.estado !== 'ASIGNADA';
      });
    } else {
      // Clientes con arma ASIGNADA
      return allClients.filter(client => {
        const weaponAssignment = getWeaponForClient(client.id);
        return weaponAssignment && weaponAssignment.estado === 'ASIGNADA';
      });
    }
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


            {/* Estadísticas de clientes por tipo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div 
                className={`rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  clientFilter === 'Cupo Civil' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100'
                }`}
                onClick={() => handleFilterByType('Cupo Civil')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cupo Civil</p>
                      <p className="text-2xl font-bold text-gray-900">{getClientCountByType('Cupo Civil')}</p>
                    </div>
                  </div>
                  {clientFilter === 'Cupo Civil' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div 
                className={`rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  clientFilter === 'Extracupo Uniformado' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100'
                }`}
                onClick={() => handleFilterByType('Extracupo Uniformado')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Extracupo Uniformado</p>
                      <p className="text-2xl font-bold text-gray-900">{getClientCountByType('Extracupo Uniformado')}</p>
                    </div>
                  </div>
                  {clientFilter === 'Extracupo Uniformado' && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div 
                className={`rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  clientFilter === 'Extracupo Empresa' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-green-50 hover:border-green-300 hover:bg-green-100'
                }`}
                onClick={() => handleFilterByType('Extracupo Empresa')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Extracupo Empresa</p>
                      <p className="text-2xl font-bold text-gray-900">{getClientCountByType('Extracupo Empresa')}</p>
                    </div>
                  </div>
                  {clientFilter === 'Extracupo Empresa' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div 
                className={`rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  clientFilter === 'Cupo Deportista' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                }`}
                onClick={() => handleFilterByType('Cupo Deportista')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cupo Deportista</p>
                      <p className="text-2xl font-bold text-gray-900">{getClientCountByType('Cupo Deportista')}</p>
                    </div>
                  </div>
                  {clientFilter === 'Cupo Deportista' && (
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

            {/* Pestañas de clientes */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('en-proceso')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                  activeTab === 'en-proceso'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 Clientes en Proceso
              </button>
              <button
                onClick={() => setActiveTab('asignados')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                  activeTab === 'asignados'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✅ Clientes Asignados
              </button>
            </div>

            {/* Botones de acción (solo en "En Proceso") */}
            {activeTab === 'en-proceso' && (
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
            )}

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
                    {getClientsByTab().length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">
                              {activeTab === 'en-proceso' 
                                ? 'No hay clientes en proceso' 
                                : 'No hay clientes con armas asignadas'}
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                              {activeTab === 'en-proceso' 
                                ? 'Crea un nuevo cliente para comenzar' 
                                : 'Los clientes aparecerán aquí cuando se les asigne una serie'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      getClientsByTab().map((client, index) => {
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
                              client.tipoProcesoNombre === 'Cupo Civil' ? 'bg-blue-100 text-blue-800' :
                              client.tipoProcesoNombre === 'Extracupo Uniformado' ? 'bg-orange-100 text-orange-800' :
                              client.tipoProcesoNombre === 'Extracupo Empresa' ? 'bg-green-100 text-green-800' :
                              client.tipoProcesoNombre === 'Cupo Deportista' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {client.tipoProcesoNombre || client.tipoCliente}
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
                              <div>
                                <div>{weaponAssignment.weapon.nombre} ({weaponAssignment.weapon.calibre})</div>
                                {weaponAssignment.numeroSerie && (
                                  <div className="text-xs text-blue-600 font-mono font-semibold mt-1">
                                    Serie: {weaponAssignment.numeroSerie}
                                  </div>
                                )}
                                {weaponAssignment.estado && (
                                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                    weaponAssignment.estado === 'ASIGNADA' ? 'bg-green-100 text-green-800' :
                                    weaponAssignment.estado === 'RESERVADA' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {weaponAssignment.estado}
                                  </span>
                                )}
                              </div>
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
                    }))}
                  </tbody>
                </table>
              </div>
              
              {/* Controles de paginación */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{currentPageNumber * pageSize + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min((currentPageNumber + 1) * pageSize, totalClients)}
                      </span>{' '}
                      de <span className="font-medium">{totalClients}</span> clientes
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPageNumber === 0}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ‹ Anterior
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i;
                          } else if (currentPageNumber < 3) {
                            pageNum = i;
                          } else if (currentPageNumber > totalPages - 3) {
                            pageNum = totalPages - 5 + i;
                          } else {
                            pageNum = currentPageNumber - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPageNumber === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPageNumber === totalPages - 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente ›
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'clientForm':
        return (
          <div className="p-6">
            <ClientForm
              mode={clientFormMode}
              client={(selectedClient || clientFormData) as any}
              onSave={handleClientSaved as any}
              onCancel={handleCloseForm}
              onEdit={() => selectedClient && handleEditClient(selectedClient)}
              selectedWeapon={selectedWeapon}
              precioModificado={precioModificado}
              cantidad={cantidad}
              onPriceChange={handlePriceChangeWrapper}
              onQuantityChange={handleQuantityChangeWrapper}
              onNavigateToWeaponSelection={handleNavigateToWeaponSelection}
              onConfirmData={handleClientDataConfirm}
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
              isCreatingClient={!!clientFormData}
              onBack={() => {
                // Si hay datos del cliente guardados (flujo de creación), volver al formulario
                if (clientFormData) {
                  handleBackToClientForm();
                } else {
                  // Si no hay datos, volver al dashboard
                  setCurrentPage('dashboard');
                }
              }}
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
                setSelectedClient(null);
                setSelectedWeapon(weapon);
                setPrecioModificado(weapon.precioReferencia || 0);
                setCantidad(1);
              }}
              onConfirmData={handleWeaponSelectionConfirm}
              onUpdateWeaponPrice={handlePriceChange}
              onUpdateWeaponQuantity={handleQuantityChange}
              getWeaponPriceForClient={(weaponId, clientId) => {
                // Primero verificar si hay un precio específico para esta arma
                if (weaponPrices[weaponId]) {
                  return weaponPrices[weaponId];
                }
                // Luego verificar si hay una asignación para este cliente Y esta arma específica
                if (clientId && clientWeaponAssignments[clientId] && clientWeaponAssignments[clientId].weapon.id === weaponId) {
                  return clientWeaponAssignments[clientId].precio;
                }
                // Finalmente usar el precio de referencia
                const weapon = availableWeapons.find(w => w.id === weaponId);
                return weapon ? weapon.precioReferencia : 0;
              }}
              currentClientId={selectedClient?.id}
            />
          </div>
        );

      case 'seriesAssignment':
        // Solo mostrar si expoferia está activa y hay un arma seleccionada
        if (!expoferiaActiva || !selectedWeapon) {
          console.error('❌ No se puede mostrar asignación de series sin expoferia activa o arma seleccionada');
          setCurrentPage('dashboard');
          return null;
        }
        
        const clienteData = clientFormData || selectedClient;
        
        return (
          <div className="p-6">
            <SeriesAssignment
              armaId={selectedWeapon.id}
              armaNombre={selectedWeapon.nombre}
              clienteNombres={clienteData?.nombres || ''}
              clienteApellidos={clienteData?.apellidos || ''}
              onSerieSelected={handleSerieSelected}
              onBack={handleBackToWeaponSelection}
            />
          </div>
        );

      case 'paymentForm':
        // Asegurar que siempre haya datos del cliente
        const clientData = selectedClient || clientFormData;
        
        if (!clientData) {
          return (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h2 className="text-xl font-bold text-red-800 mb-2">Error de Datos</h2>
                <p className="text-red-600 mb-4">No hay datos del cliente disponibles para continuar con el pago.</p>
                <button 
                  onClick={() => setCurrentPage('dashboard')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          );
        }
        
        return (
          <div className="p-6">
            <PaymentForm
              client={clientData}
              selectedWeapon={selectedWeapon as any}
              precioModificado={precioModificado}
              cantidad={cantidad}
              selectedSerieNumero={selectedSerieNumero}
              onBack={() => {
                // Si hay una serie seleccionada y expoferia activa, volver a seriesAssignment
                if (selectedSerieNumero && expoferiaActiva) {
                  setCurrentPage('seriesAssignment');
                } else {
                  // Si no, volver a weaponSelection
                  setCurrentPage('weaponSelection');
                }
              }}
              onComplete={handlePaymentComplete}
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