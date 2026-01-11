import { useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useVendedorState } from './useVendedorState';
import { useVendedorData } from './useVendedorData';
import { useVendedorUtils } from './useVendedorUtils';
import { useVendedorHandlers } from './useVendedorHandlers';
import { useVendedorPaymentHandler } from './useVendedorPaymentHandler';
import { useVendedorExport } from './useVendedorExport';

/**
 * Hook principal del módulo vendedor
 * Refactorizado para cumplir con límite de 500 líneas por archivo
 * 
 * Este hook combina todos los hooks especializados:
 * - useVendedorState: Estados y refs
 * - useVendedorData: Carga de datos (clientes y armas)
 * - useVendedorUtils: Funciones utilitarias
 * - useVendedorHandlers: Handlers de eventos
 * - useVendedorExport: Exportación a Excel
 */
export const useVendedorLogic = () => {
  const { user } = useAuth();
  const hasInitializedRef = useRef(false);
  
  // Estados
  const state = useVendedorState();
  
  // Carga de datos
  const { loadClients, loadWeapons } = useVendedorData(
    user,
    state.currentPageNumber,
    state.pageSize,
    state.setClients,
    state.setAvailableWeapons,
    state.setClientWeaponAssignments,
    state.setClientsLoading,
    state.setWeaponsLoading,
    state.setTotalPages,
    state.setTotalClients,
    state.setCurrentPageNumber,
    state.setProvinciasCompletas
  );
  
  // Utilidades
  const utils = useVendedorUtils(
    state.clientesBloqueados,
    state.clientWeaponAssignments
  );
  
  // Handlers
  const handlers = useVendedorHandlers(
    state.setCurrentPage,
    state.setClientFormMode,
    state.setSelectedClient,
    state.setSelectedWeapon,
    state.setPrecioModificado,
    state.setCantidad,
    state.setClientFilter,
    state.setClientFormData,
    state.setClientesBloqueados,
    state.setClientWeaponAssignments,
    state.setWeaponPrices,
    state.setSelectedSerieId,
    state.setSelectedSerieNumero,
    state.currentPage,
    state.selectedClient,
    state.selectedWeapon,
    state.precioModificado,
    state.cantidad,
    state.clientFilter,
    state.clientFormData,
    state.clientesBloqueados,
    state.clientWeaponAssignments,
    state.weaponPrices,
    state.clients,
    loadClients,
    utils.mapearProvinciaACodigo,
    utils.mapearCodigoANombreProvincia,
    state.provinciasCompletas,
    state.selectedSerieNumeroRef,
    user
  );
  
  // Handler de pago (separado por tamaño)
  const { handlePaymentComplete } = useVendedorPaymentHandler(
    state.clientFormData,
    state.selectedWeapon,
    state.precioModificado,
    state.cantidad,
    user,
    state.selectedSerieNumeroRef,
    utils.mapearProvinciaACodigo,
    state.provinciasCompletas,
    loadClients,
    state.setCurrentPage,
    state.setSelectedClient,
    state.setSelectedWeapon,
    state.setPrecioModificado,
    state.setCantidad,
    state.setClientFormData
  );
  
  // Exportación
  const { exportarClientesAExcel } = useVendedorExport(user);
  
  // Inicialización
  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;
    loadClients();
    loadWeapons();
  }, [loadClients, loadWeapons]);
  
  useEffect(() => {
    if (state.availableWeapons.length > 0 && !state.isInitialized) {
      state.setIsInitialized(true);
    }
  }, [state.availableWeapons, state.isInitialized, state.setIsInitialized]);
  
  // Funciones de paginación
  const handleNextPage = () => {
    if (state.currentPageNumber < state.totalPages - 1) {
      loadClients(state.currentPageNumber + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (state.currentPageNumber > 0) {
      loadClients(state.currentPageNumber - 1);
    }
  };
  
  const goToPage = (page: number) => {
    if (page >= 0 && page < state.totalPages) {
      loadClients(page);
    }
  };
  
  // Función para filtrar clientes (usando utils)
  const getFilteredClients = () => {
    return utils.getFilteredClients(state.clients, state.clientFilter);
  };
  
  // Función para contar clientes por tipo (usando utils)
  const getClientCountByType = (tipo: string) => {
    return utils.getClientCountByType(state.clients, tipo);
  };
  
  const isLoading = state.clientsLoading || state.weaponsLoading || !state.isInitialized;
  
  return {
    // Estados
    currentPage: state.currentPage,
    selectedClient: state.selectedClient,
    clientFormMode: state.clientFormMode,
    clients: state.clients,
    availableWeapons: state.availableWeapons,
    selectedWeapon: state.selectedWeapon,
    precioModificado: state.precioModificado,
    cantidad: state.cantidad,
    clientWeaponAssignments: state.clientWeaponAssignments,
    weaponPrices: state.weaponPrices,
    clientFilter: state.clientFilter,
    clientsLoading: state.clientsLoading,
    weaponsLoading: state.weaponsLoading,
    isInitialized: state.isInitialized,
    clientesBloqueados: state.clientesBloqueados,
    isLoading,
    
    // Paginación
    currentPageNumber: state.currentPageNumber,
    totalPages: state.totalPages,
    totalClients: state.totalClients,
    pageSize: state.pageSize,
    
    // Setters
    setCurrentPage: state.setCurrentPage,
    setSelectedClient: state.setSelectedClient,
    setClientFormMode: state.setClientFormMode,
    setSelectedWeapon: state.setSelectedWeapon,
    setPrecioModificado: state.setPrecioModificado,
    setCantidad: state.setCantidad,
    setClientWeaponAssignments: state.setClientWeaponAssignments,
    setClientesBloqueados: state.setClientesBloqueados,
    
    // Utilidades
    getClientStatus: utils.getClientStatus,
    getStatusColor: utils.getStatusColor,
    getStatusText: utils.getStatusText,
    getWeaponForClient: utils.getWeaponForClient,
    
    // Handlers
    handleCreateClient: handlers.handleCreateClient,
    handleAssignWeaponWithoutClient: handlers.handleAssignWeaponWithoutClient,
    handleClientSaved: handlers.handleClientSaved,
    handleClienteBloqueado: handlers.handleClienteBloqueado,
    handleCloseForm: handlers.handleCloseForm,
    handleWeaponSelected: handlers.handleWeaponSelected,
    handlePriceChange: handlers.handlePriceChange,
    handleQuantityChange: handlers.handleQuantityChange,
    handleFinishProcess: handlers.handleFinishProcess,
    handlePaymentComplete,
    handleClientDataConfirm: handlers.handleClientDataConfirm,
    handleWeaponSelectionConfirm: handlers.handleWeaponSelectionConfirm,
    handleBackToClientForm: handlers.handleBackToClientForm,
    handleSerieSelected: handlers.handleSerieSelected,
    handleBackToWeaponSelection: handlers.handleBackToWeaponSelection,
    handleViewClient: handlers.handleViewClient,
    handleEditClient: handlers.handleEditClient,
    handleValidarDatosPersonales: handlers.handleValidarDatosPersonales,
    handleFilterByType: handlers.handleFilterByType,
    clearFilter: handlers.clearFilter,
    handlePriceChangeWrapper: handlers.handlePriceChangeWrapper,
    handleQuantityChangeWrapper: handlers.handleQuantityChangeWrapper,
    handleNavigateToWeaponSelection: handlers.handleNavigateToWeaponSelection,
    
    // Datos del formulario
    clientFormData: state.clientFormData,
    selectedSerieId: state.selectedSerieId,
    selectedSerieNumero: state.selectedSerieNumero,
    
    // Funciones de filtrado y conteo
    getFilteredClients,
    getClientCountByType,
    
    // Funciones de paginación
    handleNextPage,
    handlePrevPage,
    goToPage,
    loadClients,
    
    // Función de exportación
    exportarClientesAExcel,
  };
};
