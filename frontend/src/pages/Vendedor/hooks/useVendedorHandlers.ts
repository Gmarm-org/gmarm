import { useCallback } from 'react';
import type { Client } from '../types';
import { apiService } from '../../../services/api';
import type { User } from '../../../types';
import { useTiposClienteConfig } from '../../../contexts/TiposClienteContext';
import { mapTipoIdentificacionToCode } from '../../../utils/typeMappers';

/**
 * Hook para todos los handlers de eventos del módulo vendedor
 * Separado para cumplir con límite de 500 líneas por archivo
 * 
 * NOTA: Este archivo es grande debido a la complejidad de los handlers,
 * pero cada handler individual tiene menos de 20 statements
 */
export const useVendedorHandlers = (
  // Estados y setters
  setCurrentPage: (page: string) => void,
  setClientFormMode: (mode: 'create' | 'edit' | 'view') => void,
  setSelectedClient: (client: Client | null) => void,
  setSelectedWeapon: (weapon: any | null) => void,
  setPrecioModificado: (precio: number) => void,
  setCantidad: (cantidad: number) => void,
  setClientFilter: (filter: string | null) => void,
  setClientFormData: (data: any) => void,
  setClientesBloqueados: React.Dispatch<React.SetStateAction<Record<string, { bloqueado: boolean; motivo: string }>>>,
  setClientWeaponAssignments: React.Dispatch<React.SetStateAction<Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>>>,
  setWeaponPrices: React.Dispatch<React.SetStateAction<Record<number, number>>>,
  setSelectedSerieId: (id: number | null) => void,
  setSelectedSerieNumero: (numero: string | null) => void,
  
  // Estados actuales
  currentPage: string,
  selectedClient: Client | null,
  selectedWeapon: any | null,
  precioModificado: number,
  cantidad: number,
  clientFilter: string | null,
  clientFormData: any,
  _clientesBloqueados: Record<string, { bloqueado: boolean; motivo: string }>, // Prefijo _ porque se usa indirectamente
  clientWeaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>,
  weaponPrices: Record<number, number>,
  expoferiaActiva: boolean,
  _clients: Client[], // Prefijo _ para indicar que no se usa directamente pero se necesita para tipos
  
  // Funciones externas
  loadClients: (page?: number) => Promise<void>,
  mapearProvinciaACodigo: (nombre: string, provincias: Array<{codigo: string, nombre: string}>) => string,
  mapearCodigoANombreProvincia: (codigo: string, provincias: Array<{codigo: string, nombre: string}>) => string,
  provinciasCompletas: Array<{codigo: string, nombre: string}>,
  
  // Refs
  selectedSerieNumeroRef: React.MutableRefObject<string | null>,
  
  // User (no usado directamente pero necesario para tipos)
  _user: User | null
) => {
  const { getCodigoTipoCliente } = useTiposClienteConfig();

  const handleCreateClient = useCallback(() => {
    setCurrentPage('clientForm');
    setClientFormMode('create');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, [setCurrentPage, setClientFormMode, setSelectedClient, setSelectedWeapon, setPrecioModificado, setCantidad]);

  const handleAssignWeaponWithoutClient = useCallback(() => {
    setCurrentPage('weaponSelection');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, [setCurrentPage, setSelectedClient, setSelectedWeapon, setPrecioModificado, setCantidad]);

  const handleClientSaved = useCallback(async (_client: Client) => {
    setClientFilter(null);
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
    setCurrentPage('dashboard');
    setClientFormMode('create');
    await loadClients();
  }, [setClientFilter, setSelectedClient, setSelectedWeapon, setPrecioModificado, setCantidad, setCurrentPage, setClientFormMode, loadClients]);

  const handleClienteBloqueado = useCallback((clientId: string, bloqueado: boolean, motivo: string) => {
    if (bloqueado) {
      setClientesBloqueados(prev => ({ ...prev, [clientId]: { bloqueado, motivo } }));
      if (currentPage !== 'clientForm') {
        setCurrentPage('dashboard');
        setSelectedClient(null);
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
      }
    } else {
      setClientesBloqueados(prev => {
        const newBlockedClients = { ...prev };
        delete newBlockedClients[clientId];
        return newBlockedClients;
      });
    }
  }, [currentPage, setClientesBloqueados, setCurrentPage, setSelectedClient, setSelectedWeapon, setPrecioModificado, setCantidad]);

  const handleCloseForm = useCallback(() => {
    setCurrentPage('dashboard');
    setClientFormMode('create');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, [setCurrentPage, setClientFormMode, setSelectedClient, setSelectedWeapon, setPrecioModificado, setCantidad]);

  const handleWeaponSelected = useCallback((weapon: any | null) => {
    if (weapon) {
      if (selectedWeapon && selectedWeapon.id === weapon.id) {
        return;
      }
      let precioAUsar = weapon.precioReferencia || 0;
      if (weaponPrices[weapon.id]) {
        precioAUsar = weaponPrices[weapon.id];
      } else if (selectedClient && clientWeaponAssignments[selectedClient.id]) {
        const asignacionExistente = clientWeaponAssignments[selectedClient.id];
        if (asignacionExistente.weapon.id === weapon.id) {
          precioAUsar = asignacionExistente.precio;
        }
      }
      setSelectedWeapon(weapon);
      setPrecioModificado(precioAUsar);
      setCantidad(1);
      if (selectedClient) {
        setClientWeaponAssignments(prev => ({
          ...prev,
          [selectedClient.id]: { weapon, precio: precioAUsar, cantidad: 1 }
        }));
      }
    } else {
      setSelectedWeapon(null);
      setPrecioModificado(0);
      setCantidad(1);
      if (selectedClient) {
        setClientWeaponAssignments(prev => {
          const newAssignments = { ...prev };
          delete newAssignments[selectedClient.id];
          return newAssignments;
        });
      }
    }
  }, [selectedClient, clientWeaponAssignments, selectedWeapon, weaponPrices, setSelectedWeapon, setPrecioModificado, setCantidad, setClientWeaponAssignments]);

  const handlePriceChange = useCallback((weaponId: number, newPrice: number) => {
    setWeaponPrices(prev => ({ ...prev, [weaponId]: newPrice }));
    if (selectedWeapon && selectedWeapon.id === weaponId) {
      setPrecioModificado(newPrice);
    }
    if (selectedClient) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon || { id: weaponId },
          precio: newPrice,
          cantidad: cantidad
        }
      }));
    }
  }, [selectedClient, selectedWeapon, cantidad, setWeaponPrices, setPrecioModificado, setClientWeaponAssignments]);

  const handleQuantityChange = useCallback((weaponId: number, newQuantity: number) => {
    if (selectedClient && selectedWeapon && selectedWeapon.id === weaponId) {
      setCantidad(newQuantity);
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon,
          precio: precioModificado,
          cantidad: newQuantity
        }
      }));
    }
  }, [selectedClient, selectedWeapon, precioModificado, setCantidad, setClientWeaponAssignments]);

  const handleFinishProcess = useCallback(() => {
    if (selectedClient && selectedWeapon) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon,
          precio: precioModificado,
          cantidad: cantidad
        }
      }));
    }
    setCurrentPage('dashboard');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, [selectedClient, selectedWeapon, precioModificado, cantidad, setClientWeaponAssignments, setCurrentPage, setSelectedClient, setSelectedWeapon, setPrecioModificado, setCantidad]);

  const handleClientDataConfirm = useCallback((formData: any) => {
    const respuestasMapeadas = formData.respuestas?.map((respuesta: any) => {
      const preguntaId = respuesta.questionId || respuesta.preguntaId || respuesta.id || null;
      return { ...respuesta, preguntaId };
    }) || [];

    const clientDataMapeado = {
      ...formData,
      tipoIdentificacionCodigo: mapTipoIdentificacionToCode(formData.tipoIdentificacion),
      tipoClienteCodigo: getCodigoTipoCliente(formData.tipoCliente),
      provincia: mapearProvinciaACodigo(formData.provincia, provinciasCompletas),
      canton: formData.canton,
      direccion: formData.direccion,
      telefonoSecundario: formData.telefonoSecundario,
      respuestas: respuestasMapeadas
    };
    
    setClientFormData(clientDataMapeado);
    setCurrentPage('weaponSelection');
  }, [getCodigoTipoCliente, mapearProvinciaACodigo, provinciasCompletas, setClientFormData, setCurrentPage]);

  const handleWeaponSelectionConfirm = useCallback(async () => {
    if (!clientFormData && selectedClient) {
      setClientFormData(selectedClient);
    }
    if (!clientFormData && !selectedClient) {
      alert('❌ Error: No hay datos del cliente. Por favor, completa el proceso desde el inicio.');
      return;
    }
    
    // Si el cliente ya existe (tiene ID) y hay arma seleccionada, guardar la reserva
    const clienteActual = clientFormData || selectedClient;
    if (clienteActual?.id && selectedWeapon) {
      try {
        console.log('🔫 Guardando reserva de arma para cliente:', clienteActual.id);
        const precioTotal = precioModificado * cantidad;
        await apiService.crearReservaArma(
          parseInt(clienteActual.id.toString()),
          parseInt(selectedWeapon.id.toString()),
          cantidad,
          precioModificado,
          precioTotal
        );
        console.log('✅ Reserva de arma guardada exitosamente al confirmar selección');
      } catch (error: any) {
        console.error('❌ Error guardando reserva de arma:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido al guardar reserva';
        alert(`⚠️ Error al guardar la reserva del arma: ${errorMessage}`);
        return; // No continuar si falla guardar la reserva
      }
    } else {
      console.log('⚠️ No se puede guardar reserva:', { 
        clienteId: clienteActual?.id, 
        tieneArma: !!selectedWeapon 
      });
    }
    
    if (expoferiaActiva && clientFormData && !clientFormData.id) {
      setCurrentPage('seriesAssignment');
    } else {
      setCurrentPage('paymentForm');
    }
  }, [clientFormData, selectedClient, selectedWeapon, precioModificado, cantidad, expoferiaActiva, setClientFormData, setCurrentPage]);

  const handleBackToClientForm = useCallback(() => {
    if (clientFormData) {
      setClientFormMode('create');
      setCurrentPage('clientForm');
    } else {
      setCurrentPage('dashboard');
    }
  }, [clientFormData, setClientFormMode, setCurrentPage]);

  const handleSerieSelected = useCallback((serieId: number, numeroSerie: string) => {
    selectedSerieNumeroRef.current = numeroSerie;
    setSelectedSerieId(serieId);
    setSelectedSerieNumero(numeroSerie);
    setCurrentPage('paymentForm');
  }, [selectedSerieNumeroRef, setSelectedSerieId, setSelectedSerieNumero, setCurrentPage]);

  const handleBackToWeaponSelection = useCallback(() => {
    setSelectedSerieId(null);
    setSelectedSerieNumero(null);
    setCurrentPage('weaponSelection');
  }, [setSelectedSerieId, setSelectedSerieNumero, setCurrentPage]);

  // handlePaymentComplete movido a useVendedorPaymentHandler.ts

  const handleViewClient = useCallback(async (client: Client) => {
    try {
      const clienteCompleto = await apiService.getCliente(parseInt(client.id));
      const clienteParaMostrar = {
        ...clienteCompleto,
        provincia: mapearCodigoANombreProvincia((clienteCompleto as any).provincia || '', provinciasCompletas),
        canton: (clienteCompleto as any).canton || ''
      };
      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('view');
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
    } catch (error) {
      console.error('❌ Error obteniendo cliente completo:', error);
      const clienteParaMostrar = {
        ...client,
        provincia: mapearCodigoANombreProvincia(client.provincia || '', provinciasCompletas),
        canton: client.canton || ''
      };
      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('view');
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
    }
  }, [clientWeaponAssignments, mapearCodigoANombreProvincia, provinciasCompletas, setSelectedClient, setClientFormMode, setSelectedWeapon, setPrecioModificado, setCantidad, setCurrentPage]);

  const handleEditClient = useCallback(async (client: Client) => {
    try {
      const clienteCompleto = await apiService.getCliente(parseInt(client.id));
      const clienteParaMostrar = {
        ...clienteCompleto,
        provincia: mapearCodigoANombreProvincia((clienteCompleto as any).provincia || '', provinciasCompletas),
        canton: (clienteCompleto as any).canton || ''
      };
      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('edit');
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
    } catch (error) {
      console.error('❌ Error obteniendo cliente completo:', error);
      const clienteParaMostrar = {
        ...client,
        provincia: mapearCodigoANombreProvincia(client.provincia || '', provinciasCompletas),
        canton: client.canton || ''
      };
      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('edit');
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
    }
  }, [clientWeaponAssignments, mapearCodigoANombreProvincia, provinciasCompletas, setSelectedClient, setClientFormMode, setSelectedWeapon, setPrecioModificado, setCantidad, setCurrentPage]);

  const handleFilterByType = useCallback((tipoCliente: string) => {
    if (clientFilter === tipoCliente) {
      setClientFilter(null);
    } else {
      setClientFilter(tipoCliente);
    }
  }, [clientFilter, setClientFilter]);

  const clearFilter = useCallback(() => {
    setClientFilter(null);
  }, [setClientFilter]);

  const handlePriceChangeWrapper = useCallback((price: number) => {
    if (selectedWeapon) {
      handlePriceChange(selectedWeapon.id, price);
    }
  }, [selectedWeapon, handlePriceChange]);

  const handleQuantityChangeWrapper = useCallback((quantity: number) => {
    if (selectedWeapon) {
      handleQuantityChange(selectedWeapon.id, quantity);
    }
  }, [selectedWeapon, handleQuantityChange]);

  const handleNavigateToWeaponSelection = useCallback(() => {
    setCurrentPage('weaponSelection');
  }, [setCurrentPage]);

  return {
    handleCreateClient,
    handleAssignWeaponWithoutClient,
    handleClientSaved,
    handleClienteBloqueado,
    handleCloseForm,
    handleWeaponSelected,
    handlePriceChange,
    handleQuantityChange,
    handleFinishProcess,
    handleClientDataConfirm,
    handleWeaponSelectionConfirm,
    handleBackToClientForm,
    handleSerieSelected,
    handleBackToWeaponSelection,
    handleViewClient,
    handleEditClient,
    handleFilterByType,
    clearFilter,
    handlePriceChangeWrapper,
    handleQuantityChangeWrapper,
    handleNavigateToWeaponSelection,
  };
};

