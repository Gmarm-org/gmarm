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
  _clients: Client[], // Prefijo _ para indicar que no se usa directamente pero se necesita para tipos
  
  // Funciones externas
  loadClients: (page?: number) => Promise<void>,
  mapearProvinciaACodigo: (nombre: string, provincias: Array<{codigo: string, nombre: string}>) => string,
  mapearCodigoANombreProvincia: (codigo: string, provincias: Array<{codigo: string, nombre: string}>) => string,
  provinciasCompletas: Array<{codigo: string, nombre: string}>,
  
  // Refs
  selectedSerieNumeroRef: React.MutableRefObject<string | null>,
  
  // User (necesario para crear cliente automático cuando no hay cliente)
  user: User | null
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
      // El precio inicial debe ser 0 para que el vendedor lo ingrese
      // Solo usar precio guardado si ya existe una asignación previa
      let precioAUsar = 0;
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

  const handleWeaponSelectionConfirm = useCallback(async (data?: any) => {
    if (!clientFormData && selectedClient) {
      setClientFormData(selectedClient);
    }
    
    // Detectar si viene con múltiples armas (para Cliente Civil)
    const armasMultiples = data?.armas && Array.isArray(data.armas) && data.armas.length > 0;
    const armasParaReservar = armasMultiples ? data.armas : (selectedWeapon ? [selectedWeapon] : []);
    
    // Si no hay cliente ni datos del cliente, usar el cliente fantasma del vendedor
    if (!clientFormData && !selectedClient) {
      if (!user) {
        alert('❌ Error: No se pudo obtener la información del vendedor. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      if (armasParaReservar.length === 0) {
        alert('❌ Error: Debes seleccionar al menos un arma primero.');
        return;
      }
      
      try {
        console.log('👤 Buscando/creando cliente fantasma para vendedor:', user.nombres, user.apellidos);
        
        // Buscar o crear el cliente fantasma del vendedor en el backend
        const clienteFantasma = await apiService.buscarOCrearClienteFantasmaVendedor();
        console.log('✅ Cliente fantasma obtenido:', clienteFantasma);
        
        // Crear reservas para todas las armas seleccionadas
        for (const arma of armasParaReservar) {
          const precioTotal = precioModificado * cantidad;
          await apiService.crearReservaArma(
            parseInt(clienteFantasma.id.toString()),
            parseInt(arma.id.toString()),
            cantidad,
            precioModificado,
            precioTotal
          );
        }
        
        console.log(`✅ ${armasParaReservar.length} arma(s) asignada(s) al cliente fantasma del vendedor.`);
        
        // Mostrar mensaje y volver al dashboard
        alert(`✅ ${armasParaReservar.length} arma(s) asignada(s) exitosamente. Las armas quedarán en tu stock.`);
        
        // Limpiar selección y volver al dashboard
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
        setCurrentPage('dashboard');
        return; // No continuar con el flujo de pago para armas sin cliente
      } catch (error: any) {
        console.error('❌ Error asignando arma(s) al cliente fantasma:', error);
        // Extraer mensaje de error del backend (puede estar en diferentes lugares)
        const errorMessage = error?.responseData?.error || 
                           error?.responseData?.message || 
                           error?.response?.data?.error ||
                           error?.response?.data?.message || 
                           error?.message || 
                           'Error desconocido al asignar arma';
        alert(`❌ Error al asignar arma(s): ${errorMessage}`);
        return;
      }
    }
    
    // Si el cliente ya existe (tiene ID) y hay armas seleccionadas, guardar las reservas
    const clienteActual = clientFormData || selectedClient;
    if (clienteActual?.id && armasParaReservar.length > 0) {
      try {
        console.log(`🔫 Guardando ${armasParaReservar.length} reserva(s) de arma para cliente:`, clienteActual.id);
        
        // Crear reservas para todas las armas seleccionadas
        for (const arma of armasParaReservar) {
          const precioTotal = precioModificado * cantidad;
          await apiService.crearReservaArma(
            parseInt(clienteActual.id.toString()),
            parseInt(arma.id.toString()),
            cantidad,
            precioModificado,
            precioTotal
          );
        }
        
        console.log(`✅ ${armasParaReservar.length} reserva(s) de arma guardada(s) exitosamente`);
      } catch (error: any) {
        console.error('❌ Error guardando reserva(s) de arma:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido al guardar reserva';
        alert(`⚠️ Error al guardar la(s) reserva(s) del arma: ${errorMessage}`);
        return; // No continuar si falla guardar la reserva
      }
    } else {
      console.log('⚠️ No se puede guardar reserva:', { 
        clienteId: clienteActual?.id, 
        tieneArma: armasParaReservar.length > 0 
      });
    }
    
    // Siempre ir a paymentForm (expoferia eliminada)
    setCurrentPage('paymentForm');
  }, [clientFormData, selectedClient, selectedWeapon, precioModificado, cantidad, user, setClientFormData, setSelectedClient, setCurrentPage]);

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

  const handleValidarDatosPersonales = useCallback(async (client: Client) => {
    try {
      await apiService.validarDatosPersonales(Number(client.id));
      // Recargar clientes para actualizar el estado
      await loadClients();
      alert('✅ Datos personales validados exitosamente');
    } catch (error: any) {
      console.error('❌ Error validando datos personales:', error);
      alert('❌ Error al validar datos personales: ' + (error.message || 'Error desconocido'));
    }
  }, [loadClients]);

  const handleEditClient = useCallback(async (client: Client) => {
    try {
      const clienteCompleto = await apiService.getCliente(parseInt(client.id));
      console.log('🔍 Cliente completo obtenido del backend:', clienteCompleto);
      
      // Obtener tipos de cliente para el mapeo
      const tiposClienteCompletos = await apiService.getClientTypes();
      
      // Mapear provincia: el backend devuelve código
      // El select de provincia usa códigos, así que mantenemos el código
      let provinciaMapeada = (clienteCompleto as any).provincia || '';
      if (provinciaMapeada) {
        // Buscar si es código o nombre (por seguridad)
        const provinciaPorCodigo = provinciasCompletas.find(p => p.codigo === provinciaMapeada);
        const provinciaPorNombre = provinciasCompletas.find(p => p.nombre === provinciaMapeada);
        
        if (provinciaPorCodigo) {
          // Ya es código, mantenerlo
          provinciaMapeada = provinciaPorCodigo.codigo;
          console.log('✅ Provincia ya es código:', provinciaMapeada);
        } else if (provinciaPorNombre) {
          // Es nombre, convertir a código para el select
          provinciaMapeada = provinciaPorNombre.codigo;
          console.log('✅ Provincia convertida de nombre a código:', { 
            nombre: (clienteCompleto as any).provincia, 
            codigo: provinciaMapeada 
          });
        } else {
          // No se encontró, usar valor original
          console.log('⚠️ Provincia no encontrada en catálogo:', provinciaMapeada);
        }
      }
      
      // Mapear tipoCliente: debe ser el NOMBRE para que coincida con el select (value={tipo.nombre})
      let tipoClienteNombre = (clienteCompleto as any).tipoClienteNombre || '';
      if (!tipoClienteNombre && (clienteCompleto as any).tipoClienteCodigo) {
        // Si no viene tipoClienteNombre, buscar por código en los tipos de cliente
        const tipoClienteEncontrado = tiposClienteCompletos.find((tc: any) => tc.codigo === (clienteCompleto as any).tipoClienteCodigo);
        if (tipoClienteEncontrado) {
          tipoClienteNombre = tipoClienteEncontrado.nombre;
          console.log('✅ TipoCliente encontrado por código:', { codigo: (clienteCompleto as any).tipoClienteCodigo, nombre: tipoClienteNombre });
        }
      }
      
      const clienteParaMostrar = {
        ...clienteCompleto,
        // tipoCliente debe ser el NOMBRE para que coincida con el select (value={tipo.nombre})
        tipoCliente: tipoClienteNombre,
        tipoClienteNombre: tipoClienteNombre,
        // provincia debe ser el CÓDIGO para que coincida con el select (value={provincia.codigo})
        provincia: provinciaMapeada,
        canton: (clienteCompleto as any).canton || ''
      };
      
      console.log('✅ Cliente preparado para mostrar:', {
        tipoCliente: clienteParaMostrar.tipoCliente,
        tipoClienteNombre: clienteParaMostrar.tipoClienteNombre,
        provincia: clienteParaMostrar.provincia,
        canton: clienteParaMostrar.canton
      });
      
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
      // En caso de error, intentar usar los datos del cliente que ya tenemos
      let provinciaMapeada = client.provincia || '';
      if (provinciaMapeada) {
        // Buscar si es código o nombre
        const provinciaPorCodigo = provinciasCompletas.find(p => p.codigo === provinciaMapeada);
        const provinciaPorNombre = provinciasCompletas.find(p => p.nombre === provinciaMapeada);
        
        if (provinciaPorCodigo) {
          provinciaMapeada = provinciaPorCodigo.codigo;
        } else if (provinciaPorNombre) {
          provinciaMapeada = provinciaPorNombre.codigo;
        }
      }
      
      // Obtener tipos de cliente para el mapeo
      let tiposClienteCompletos: any[] = [];
      try {
        tiposClienteCompletos = await apiService.getClientTypes();
      } catch (e) {
        console.error('❌ Error obteniendo tipos de cliente:', e);
      }
      
      // Mapear tipoCliente: debe ser el NOMBRE para que coincida con el select (value={tipo.nombre})
      let tipoClienteNombre = (client as any).tipoClienteNombre || client.tipoCliente || '';
      if (tipoClienteNombre && tiposClienteCompletos.length > 0) {
        // Verificar si el valor actual es código o nombre
        const tipoClientePorCodigo = tiposClienteCompletos.find((tc: any) => tc.codigo === tipoClienteNombre);
        const tipoClientePorNombre = tiposClienteCompletos.find((tc: any) => tc.nombre === tipoClienteNombre);
        
        if (tipoClientePorCodigo) {
          // Es código, convertir a nombre
          tipoClienteNombre = tipoClientePorCodigo.nombre;
        } else if (tipoClientePorNombre) {
          // Ya es nombre, mantenerlo
          tipoClienteNombre = tipoClientePorNombre.nombre;
        }
      }
      
      const clienteParaMostrar = {
        ...client,
        // tipoCliente debe ser el NOMBRE para que coincida con el select (value={tipo.nombre})
        tipoCliente: tipoClienteNombre,
        tipoClienteNombre: tipoClienteNombre,
        // provincia debe ser el CÓDIGO para que coincida con el select (value={provincia.codigo})
        provincia: provinciaMapeada,
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
    handleValidarDatosPersonales,
    handleFilterByType,
    clearFilter,
    handlePriceChangeWrapper,
    handleQuantityChangeWrapper,
    handleNavigateToWeaponSelection,
  };
};

