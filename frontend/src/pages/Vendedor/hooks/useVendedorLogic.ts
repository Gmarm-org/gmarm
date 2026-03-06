import { useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useVendedorState } from './useVendedorState';
import { useVendedorData } from './useVendedorData';
import { useVendedorUtils } from './useVendedorUtils';
import { useVendedorHandlers } from './useVendedorHandlers';
import { useVendedorPaymentHandler } from './useVendedorPaymentHandler';
import { useVendedorExport } from './useVendedorExport';

export const useVendedorLogic = () => {
  const { user } = useAuth();
  const hasInitializedRef = useRef(false);
  
  const state = useVendedorState();
  
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
  
  const utils = useVendedorUtils(
    state.clientesBloqueados,
    state.clientWeaponAssignments
  );
  
  const handlers = useVendedorHandlers(
    state.setCurrentPage,
    state.setClientFormMode,
    state.setSelectedClient,
    state.setSelectedWeapon,
    state.setSelectedWeapons,
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
    loadWeapons,
    utils.mapearProvinciaACodigo,
    utils.mapearCodigoANombreProvincia,
    state.provinciasCompletas,
    state.selectedSerieNumeroRef,
    user
  );
  
  const { handlePaymentComplete } = useVendedorPaymentHandler(
    state.clientFormData,
    state.selectedWeapon,
    state.selectedWeapons,
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
    state.setSelectedWeapons,
    state.setPrecioModificado,
    state.setCantidad,
    state.setClientFormData
  );
  
  const { exportarClientesAExcel } = useVendedorExport(user);
  
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
  
  const getFilteredClients = () => {
    return utils.getFilteredClients(state.clients, state.clientFilter);
  };
  
  const getClientCountByType = (tipo: string) => {
    return utils.getClientCountByType(state.clients, tipo);
  };
  
  const isLoading = state.clientsLoading || state.weaponsLoading || !state.isInitialized;
  
  return {
    currentPage: state.currentPage,
    selectedClient: state.selectedClient,
    clientFormMode: state.clientFormMode,
    clients: state.clients,
    availableWeapons: state.availableWeapons,
    selectedWeapon: state.selectedWeapon,
    selectedWeapons: state.selectedWeapons,
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
    
    currentPageNumber: state.currentPageNumber,
    totalPages: state.totalPages,
    totalClients: state.totalClients,
    pageSize: state.pageSize,
    
    setCurrentPage: state.setCurrentPage,
    setSelectedClient: state.setSelectedClient,
    setClientFormMode: state.setClientFormMode,
    setSelectedWeapon: state.setSelectedWeapon,
    setSelectedWeapons: state.setSelectedWeapons,
    setPrecioModificado: state.setPrecioModificado,
    setCantidad: state.setCantidad,
    setClientWeaponAssignments: state.setClientWeaponAssignments,
    setClientesBloqueados: state.setClientesBloqueados,
    
    getClientStatus: utils.getClientStatus,
    getStatusColor: utils.getStatusColor,
    getStatusText: utils.getStatusText,
    getWeaponForClient: utils.getWeaponForClient,
    
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
    
    clientFormData: state.clientFormData,
    selectedSerieId: state.selectedSerieId,
    selectedSerieNumero: state.selectedSerieNumero,
    
    getFilteredClients,
    getClientCountByType,
    
    handleNextPage,
    handlePrevPage,
    goToPage,
    loadClients,
    
    exportarClientesAExcel,
  };
};
