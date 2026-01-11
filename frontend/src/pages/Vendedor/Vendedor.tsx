import React from 'react';
import WeaponReserve from './components/WeaponReserve';
import Header from '../../components/Header';
import ClientForm from './components/ClientForm';
import PaymentForm from './components/PaymentForm';
import SeriesAssignment from './components/SeriesAssignment';

import { useVendedorLogic } from './hooks/useVendedorLogic';
import { useTableFilters } from '../../hooks/useTableFilters';
import { TableHeaderWithFilters } from '../../components/TableHeaderWithFilters';
import { ModalValidarDatos } from './components/ModalValidarDatos';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Vendedor: React.FC = React.memo(() => {
  // Componente Vendedor inicializado
  const { user } = useAuth();
  
  // Verificar si el usuario es vendedor (no jefe de ventas)
  const esVendedor = React.useMemo(() => {
    if (!user?.roles) return true; // Por defecto asumir que es vendedor
    return user.roles.some((role: any) => {
      const codigo = role.rol?.codigo || (role as any).codigo || role;
      return codigo === 'VENDOR' || codigo === 'VENDEDOR';
    }) && !user.roles.some((role: any) => {
      const codigo = role.rol?.codigo || (role as any).codigo || role;
      return codigo === 'SALES_CHIEF' || codigo === 'JEFE_VENTAS' || codigo === 'ADMIN';
    });
  }, [user]);
  
  // Estado para pestaña activa
  const [activeTab, setActiveTab] = React.useState<'en-proceso' | 'asignados'>('en-proceso');
  
  // Estado para modal de validación de datos
  const [modalValidarDatos, setModalValidarDatos] = React.useState<{
    isOpen: boolean;
    client: any | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    client: null,
    isLoading: false
  });
  
  // Estado para verificar si hay grupos de importación disponibles
  const [hayGruposDisponibles, setHayGruposDisponibles] = React.useState<boolean | null>(null);
  const [cargandoGrupos, setCargandoGrupos] = React.useState(true);
  
  // Verificar grupos disponibles al cargar el componente
  React.useEffect(() => {
    const verificarGrupos = async () => {
      try {
        setCargandoGrupos(true);
        console.log('🔍 Vendedor - Verificando grupos activos...');
        const grupos = await apiService.getGruposActivos();
        console.log('📋 Vendedor - Grupos recibidos:', grupos);
        console.log('📊 Vendedor - Cantidad de grupos:', grupos?.length || 0);
        console.log('📊 Vendedor - hayGruposDisponibles será:', grupos && grupos.length > 0);
        setHayGruposDisponibles(grupos && grupos.length > 0);
      } catch (error) {
        console.error('❌ Error verificando grupos de importación:', error);
        setHayGruposDisponibles(false);
      } finally {
        setCargandoGrupos(false);
      }
    };
    
    verificarGrupos();
  }, []);
  
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
    handleValidarDatosPersonales,
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
    getClientCountByType,
    exportarClientesAExcel,
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

  // Hook para filtros y ordenamiento
  const clientsByTab = getClientsByTab();
  const {
    filteredAndSortedData: clientsFiltrados,
    sortConfig,
    handleSort,
    filters,
    setFilter,
    clearFilters,
  } = useTableFilters(clientsByTab);

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
              <div className="space-y-4 mb-6">
                {/* Mensaje de advertencia si no hay grupos disponibles */}
                {cargandoGrupos && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                      <p className="text-sm text-blue-800">
                        ⏳ Verificando grupos de importación disponibles...
                      </p>
                    </div>
                  </div>
                )}
                {!cargandoGrupos && hayGruposDisponibles === false && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-lg font-bold text-yellow-800">
                          ⚠️ Grupos de Importación No Disponibles
                        </h3>
                        <p className="mt-2 text-sm text-yellow-700">
                          Para crear clientes o asignar armas deben estar cargados grupos de importación activos.
                        </p>
                        <p className="mt-1 text-xs text-yellow-600">
                          📞 Comuníquese con su Jefe de Ventas para crear los grupos necesarios.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <button
                    onClick={handleCreateClient}
                    disabled={!cargandoGrupos && hayGruposDisponibles === false}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                      !cargandoGrupos && hayGruposDisponibles === false
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    Crear Cliente
                  </button>
                  <button
                    onClick={handleAssignWeaponWithoutClient}
                    disabled={!cargandoGrupos && hayGruposDisponibles === false}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                      !cargandoGrupos && hayGruposDisponibles === false
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                    }`}
                  >
                    Asignar Arma Sin Cliente
                  </button>
                </div>
              </div>
            )}

            {/* Tabla de clientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
                <div className="flex items-center space-x-2">
                  {Object.keys(filters).length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
                      title="Limpiar filtros"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs">Limpiar filtros</span>
                    </button>
                  )}
                  <button
                    onClick={exportarClientesAExcel}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md flex items-center space-x-2 text-sm font-semibold"
                    title="Exportar todos los clientes a Excel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Exportar a Excel</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <TableHeaderWithFilters
                        column="nombres"
                        label="CLIENTE"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        filterValue={filters.nombres || ''}
                        onFilterChange={setFilter}
                      />
                      <TableHeaderWithFilters
                        column="tipoClienteNombre"
                        label="TIPO"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        filterValue={filters.tipoClienteNombre || ''}
                        onFilterChange={setFilter}
                      />
                      <TableHeaderWithFilters
                        column="numeroIdentificacion"
                        label="IDENTIFICACIÓN"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        filterValue={filters.numeroIdentificacion || ''}
                        onFilterChange={setFilter}
                      />
                      <TableHeaderWithFilters
                        column="telefonoPrincipal"
                        label="TELÉFONO"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        filterValue={filters.telefonoPrincipal || ''}
                        onFilterChange={setFilter}
                      />
                      <TableHeaderWithFilters
                        column="estadoPago"
                        label="ESTADO DE PAGO"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        align="center"
                        filterValue={filters.estadoPago || ''}
                        onFilterChange={setFilter}
                      />
                      <TableHeaderWithFilters
                        column="grupoImportacionNombre"
                        label="GRUPO DE IMPORTACIÓN"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        filterValue={filters.grupoImportacionNombre || ''}
                        onFilterChange={setFilter}
                      />
                      <TableHeaderWithFilters
                        column="licenciaNombre"
                        label="LICENCIA"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        filterValue={filters.licenciaNombre || ''}
                        onFilterChange={setFilter}
                      />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50">
                        MODELO DE ARMA
                      </th>
                      <TableHeaderWithFilters
                        column="emailVerificado"
                        label="VALIDADO POR CLIENTE"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        align="center"
                        filterValue={filters.emailVerificado || ''}
                        onFilterChange={setFilter}
                      />
                      <TableHeaderWithFilters
                        column="estado"
                        label="ESTADO"
                        sortKey={sortConfig.key}
                        sortDirection={sortConfig.direction}
                        onSort={handleSort}
                        align="center"
                        filterValue={filters.estado || ''}
                        onFilterChange={setFilter}
                      />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50">
                        ACCIONES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {clientsFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center">
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
                      clientsFiltrados.map((client, index) => {
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
                              (client.tipoClienteNombre || client.tipoProcesoNombre) === 'Cupo Civil' ? 'bg-blue-100 text-blue-800' :
                              (client.tipoClienteNombre || client.tipoProcesoNombre) === 'Extracupo Uniformado' ? 'bg-orange-100 text-orange-800' :
                              (client.tipoClienteNombre || client.tipoProcesoNombre) === 'Extracupo Empresa' ? 'bg-green-100 text-green-800' :
                              (client.tipoClienteNombre || client.tipoProcesoNombre) === 'Cupo Deportista' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {client.tipoClienteNombre || client.tipoProcesoNombre || client.tipoCliente}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.numeroIdentificacion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.telefonoPrincipal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.estadoPago === 'PAGO_COMPLETO' ? 'bg-green-100 text-green-800' :
                              client.estadoPago === 'ABONADO' ? 'bg-yellow-100 text-yellow-800' :
                              client.estadoPago === 'IMPAGO' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {client.estadoPago || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.grupoImportacionNombre || (
                              <span className="text-gray-400">Sin grupo asignado</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.licenciaNombre ? (
                              <div className="flex flex-col">
                                <span className="text-purple-600 font-medium">{client.licenciaNombre}</span>
                                {client.licenciaNumero && (
                                  <span className="text-xs text-gray-500">({client.licenciaNumero})</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin licencia</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {weaponAssignment ? (
                              <div>
                                <div className="font-medium">{weaponAssignment.weapon.nombre}</div>
                                {weaponAssignment.weapon.calibre && (
                                  <div className="text-xs text-gray-500">Calibre: {weaponAssignment.weapon.calibre}</div>
                                )}
                                {weaponAssignment.numeroSerie && (
                                  <div className="text-xs text-blue-600 font-mono font-semibold mt-1">
                                    Serie: {weaponAssignment.numeroSerie}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin arma asignada</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {client.emailVerificado === true ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Validado
                              </span>
                            ) : client.emailVerificado === false ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Datos incorrectos
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              // Usar el estado calculado del backend directamente
                              const status = client.estado || getClientStatus(client);
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
                              {/* Botón Editar: NO se muestra si es vendedor y el cliente ya confirmó sus datos */}
                              {/* Solo el Jefe de Ventas puede editar clientes confirmados */}
                              {!(esVendedor && client.emailVerificado === true) && (
                                <button
                                  onClick={() => handleEditClient(client)}
                                  className="text-green-600 hover:text-green-900 font-medium"
                                  title="Editar cliente"
                                >
                                  Editar
                                </button>
                              )}
                              {(client.emailVerificado === null || client.emailVerificado === undefined) && (
                                <button
                                  onClick={() => setModalValidarDatos({ isOpen: true, client, isLoading: false })}
                                  className="text-purple-600 hover:text-purple-900 font-medium"
                                  title="Validar datos personales"
                                >
                                  Validar
                                </button>
                              )}
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
        // Si no hay cliente seleccionado (Asignar arma sin cliente), el cliente fantasma es tipo CIVIL por defecto
        // IMPORTANTE: Los clientes fantasma creados en el backend siempre son de tipo CIVIL
        let tipoClienteParaReserva: string | undefined;
        if (clientFormData?.tipoCliente) {
          tipoClienteParaReserva = clientFormData.tipoCliente;
        } else if (selectedClient?.tipoCliente) {
          tipoClienteParaReserva = selectedClient.tipoCliente;
        } else if (!selectedClient && !clientFormData) {
          // Asignar arma sin cliente: el cliente fantasma es siempre CIVIL
          tipoClienteParaReserva = 'Civil';
        }
        return (
          <div className="p-6">
            <WeaponReserve
              weapons={availableWeapons}
              currentClient={selectedClient as any}
              reservaParaCliente={selectedClient as any}
              clienteParaResumen={selectedClient as any}
              armaSeleccionadaEnReserva={selectedWeapon}
              isCreatingClient={!!clientFormData}
              tipoCliente={tipoClienteParaReserva}
              respuestas={clientFormData?.respuestas || []}
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
                setPrecioModificado(0); // Precio inicial en 0 para que el vendedor lo ingrese
                setCantidad(1);
                
                setClientWeaponAssignments(prev => ({
                  ...prev,
                  [client.id]: {
                    weapon: weapon,
                    precio: 0, // Precio inicial en 0
                    cantidad: 1
                  }
                }));
              }}
              onAssignWeaponToCupoCivil={(weapon) => {
                setSelectedClient(null);
                setSelectedWeapon(weapon);
                setPrecioModificado(0); // Precio inicial en 0 para que el vendedor lo ingrese
                setCantidad(1);
              }}
              onConfirmData={handleWeaponSelectionConfirm}
              onUpdateWeaponPrice={handlePriceChange}
              onUpdateWeaponQuantity={handleQuantityChange}
              getWeaponPriceForClient={(weaponId, clientId) => {
                // Primero verificar si hay un precio específico para esta arma (ya ingresado por el vendedor)
                if (weaponPrices[weaponId] !== undefined) {
                  return weaponPrices[weaponId];
                }
                // Luego verificar si hay una asignación para este cliente Y esta arma específica
                if (clientId && clientWeaponAssignments[clientId] && clientWeaponAssignments[clientId].weapon.id === weaponId) {
                  return clientWeaponAssignments[clientId].precio;
                }
                // Por defecto, el precio inicial debe ser 0 para que el vendedor lo ingrese
                return 0;
              }}
              currentClientId={selectedClient?.id}
            />
          </div>
        );

      case 'seriesAssignment':
        // Solo mostrar si hay un arma seleccionada
        if (!selectedWeapon) {
          console.error('❌ No se puede mostrar asignación de series sin arma seleccionada');
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
                // Si hay una serie seleccionada, volver a seriesAssignment, sino a weaponSelection
                if (selectedSerieNumero) {
                  setCurrentPage('seriesAssignment');
                } else {
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

  const handleConfirmarValidacion = async () => {
    if (!modalValidarDatos.client) return;
    
    setModalValidarDatos(prev => ({ ...prev, isLoading: true }));
    
    try {
      await handleValidarDatosPersonales(modalValidarDatos.client);
      setModalValidarDatos({ isOpen: false, client: null, isLoading: false });
    } catch (error) {
      console.error('Error validando datos:', error);
      setModalValidarDatos(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Vendedor" subtitle="Gestión de clientes y ventas" />
      <div className="p-6">
        {renderCurrentPage()}
      </div>
      
      {/* Modal de validación de datos */}
      <ModalValidarDatos
        client={modalValidarDatos.client}
        isOpen={modalValidarDatos.isOpen}
        onClose={() => setModalValidarDatos({ isOpen: false, client: null, isLoading: false })}
        onConfirm={handleConfirmarValidacion}
        isLoading={modalValidarDatos.isLoading}
      />
    </div>
  );
});

export default Vendedor; 