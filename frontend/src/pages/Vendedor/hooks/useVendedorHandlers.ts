import { useCallback } from 'react';
import type { Client } from '../types';
import { apiService } from '../../../services/api';
import type { User } from '../../../types';
import { useTiposClienteConfig } from '../../../contexts/TiposClienteContext';
import { mapTipoIdentificacionToCode } from '../../../utils/typeMappers';

export const useVendedorHandlers = (
  setCurrentPage: (page: string) => void,
  setClientFormMode: (mode: 'create' | 'edit' | 'view') => void,
  setSelectedClient: (client: Client | null) => void,
  setSelectedWeapon: (weapon: any | null) => void,
  setSelectedWeapons: (weapons: any[]) => void,
  setPrecioModificado: (precio: number) => void,
  setCantidad: (cantidad: number) => void,
  setClientFilter: (filter: string | null) => void,
  setClientFormData: (data: any) => void,
  setClientesBloqueados: React.Dispatch<React.SetStateAction<Record<string, { bloqueado: boolean; motivo: string }>>>,
  setClientWeaponAssignments: React.Dispatch<React.SetStateAction<Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>>>,
  setWeaponPrices: React.Dispatch<React.SetStateAction<Record<number, number>>>,
  setSelectedSerieId: (id: number | null) => void,
  setSelectedSerieNumero: (numero: string | null) => void,
  
  currentPage: string,
  selectedClient: Client | null,
  selectedWeapon: any | null,
  precioModificado: number,
  cantidad: number,
  clientFilter: string | null,
  clientFormData: any,
  _clientesBloqueados: Record<string, { bloqueado: boolean; motivo: string }>,
  clientWeaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>,
  weaponPrices: Record<number, number>,
  _clients: Client[],

  loadClients: (page?: number) => Promise<void>,
  loadWeapons: () => Promise<void>,
  mapearProvinciaACodigo: (nombre: string, provincias: Array<{codigo: string, nombre: string}>) => string,
  mapearCodigoANombreProvincia: (codigo: string, provincias: Array<{codigo: string, nombre: string}>) => string,
  provinciasCompletas: Array<{codigo: string, nombre: string}>,

  selectedSerieNumeroRef: React.MutableRefObject<string | null>,

  user: User | null
) => {
  const { getCodigoTipoCliente } = useTiposClienteConfig();

  const handleCreateClient = useCallback(() => {
    setCurrentPage('clientForm');
    setClientFormMode('create');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setSelectedWeapons([]);
    setPrecioModificado(0);
    setCantidad(1);
  }, [setCurrentPage, setClientFormMode, setSelectedClient, setSelectedWeapon, setSelectedWeapons, setPrecioModificado, setCantidad]);

  const handleAssignWeaponWithoutClient = useCallback(() => {
    setCurrentPage('weaponSelection');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setSelectedWeapons([]);
    setPrecioModificado(0);
    setCantidad(1);
  }, [setCurrentPage, setSelectedClient, setSelectedWeapon, setSelectedWeapons, setPrecioModificado, setCantidad]);

  const handleClientSaved = useCallback(async (_client: Client) => {
    setClientFilter(null);
    setSelectedClient(null);
    setSelectedWeapon(null);
    setSelectedWeapons([]);
    setPrecioModificado(0);
    setCantidad(1);
    setCurrentPage('dashboard');
    setClientFormMode('create');
    await loadClients();
  }, [setClientFilter, setSelectedClient, setSelectedWeapon, setSelectedWeapons, setPrecioModificado, setCantidad, setCurrentPage, setClientFormMode, loadClients]);

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
    setSelectedWeapons([]);
    setPrecioModificado(0);
    setCantidad(1);
  }, [setCurrentPage, setClientFormMode, setSelectedClient, setSelectedWeapon, setSelectedWeapons, setPrecioModificado, setCantidad]);

  const handleWeaponSelected = useCallback((weapon: any | null) => {
    if (weapon) {
      if (selectedWeapon && selectedWeapon.id === weapon.id) {
        return;
      }
      // Precio inicial 0 salvo que ya exista una asignación previa
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
      setSelectedWeapons([{ ...weapon, cantidad: 1, precioUnitario: precioAUsar }]);
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
      setSelectedWeapons([]);
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
  }, [selectedClient, clientWeaponAssignments, selectedWeapon, weaponPrices, setSelectedWeapon, setSelectedWeapons, setPrecioModificado, setCantidad, setClientWeaponAssignments]);

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
    setSelectedWeapons([]);
    setPrecioModificado(0);
    setCantidad(1);
  }, [selectedClient, selectedWeapon, precioModificado, cantidad, setClientWeaponAssignments, setCurrentPage, setSelectedClient, setSelectedWeapon, setSelectedWeapons, setPrecioModificado, setCantidad]);

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
    
    const armasMultiples = data?.armas && Array.isArray(data.armas) && data.armas.length > 0;
    const armasParaReservar = armasMultiples ? data.armas : (selectedWeapon ? [{ ...selectedWeapon, cantidad }] : []);
    setSelectedWeapons(armasParaReservar);
    
    // Sin cliente: asignar armas al cliente fantasma del vendedor (stock del vendedor)
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
        const clienteFantasma = await apiService.buscarOCrearClienteFantasmaVendedor();

        const todasAdvertencias: string[] = [];
        for (const arma of armasParaReservar) {
          const precioUnitario = arma.precioUnitario !== undefined
            ? arma.precioUnitario
            : (weaponPrices[arma.id] !== undefined ? weaponPrices[arma.id] : precioModificado);
          const cantidadArma = arma.cantidad !== undefined ? arma.cantidad : cantidad;
          const precioTotal = precioUnitario * cantidadArma;
          const resultado = await apiService.crearReservaArma(
            parseInt(clienteFantasma.id.toString()),
            parseInt(arma.id.toString()),
            cantidadArma,
            precioUnitario,
            precioTotal
          );
          if (resultado?.advertencias?.length) {
            todasAdvertencias.push(...resultado.advertencias);
          }
        }

        await loadWeapons();
        await loadClients();

        let mensaje = `✅ ${armasParaReservar.length} arma(s) asignada(s) exitosamente. Las armas quedaran en tu stock.`;
        if (todasAdvertencias.length > 0) {
          mensaje += '\n\n⚠️ Advertencias:\n' + todasAdvertencias.map(a => '- ' + a).join('\n');
        }
        alert(mensaje);
        
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
        setCurrentPage('dashboard');
        return;
      } catch (error: any) {
        console.error('Error asignando arma(s) al cliente fantasma:', error instanceof Error ? error.message : 'Unknown error');
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
    
    const clienteActual = clientFormData || selectedClient;
    if (clienteActual?.id && armasParaReservar.length > 0) {
      try {
        const todasAdvertenciasCliente: string[] = [];
        for (const arma of armasParaReservar) {
          const precioUnitario = arma.precioUnitario !== undefined
            ? arma.precioUnitario
            : (weaponPrices[arma.id] !== undefined ? weaponPrices[arma.id] : precioModificado);
          const cantidadArma = arma.cantidad !== undefined ? arma.cantidad : cantidad;
          const precioTotal = precioUnitario * cantidadArma;
          const resultado = await apiService.crearReservaArma(
            parseInt(clienteActual.id.toString()),
            parseInt(arma.id.toString()),
            cantidadArma,
            precioUnitario,
            precioTotal
          );
          if (resultado?.advertencias?.length) {
            todasAdvertenciasCliente.push(...resultado.advertencias);
          }
        }

        if (todasAdvertenciasCliente.length > 0) {
          alert('⚠️ Advertencias de asignacion:\n' + todasAdvertenciasCliente.map(a => '- ' + a).join('\n'));
        }

      } catch (error: any) {
        console.error('Error guardando reserva(s) de arma:', error instanceof Error ? error.message : 'Unknown error');
        const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido al guardar reserva';
        alert(`⚠️ Error al guardar la(s) reserva(s) del arma: ${errorMessage}`);
        return;
      }
    } else {
    }
    
    setCurrentPage('paymentForm');
  }, [clientFormData, selectedClient, selectedWeapon, precioModificado, cantidad, user, loadClients, loadWeapons, weaponPrices, setClientFormData, setSelectedClient, setSelectedWeapons, setCurrentPage]);

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
      console.error('Error obteniendo cliente completo:', error instanceof Error ? error.message : 'Unknown error');
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
      await loadClients();
      alert('✅ Datos personales validados exitosamente');
    } catch (error: any) {
      console.error('Error validando datos personales:', error instanceof Error ? error.message : 'Unknown error');
      alert('❌ Error al validar datos personales: ' + (error.message || 'Error desconocido'));
    }
  }, [loadClients]);

  const handleEditClient = useCallback(async (client: Client) => {
    try {
      const clienteCompleto = await apiService.getCliente(parseInt(client.id));
      
      const tiposClienteCompletos = await apiService.getClientTypes();

      let provinciaMapeada = (clienteCompleto as any).provincia || '';
      if (provinciaMapeada) {
        const provinciaPorCodigo = provinciasCompletas.find(p => p.codigo === provinciaMapeada);
        const provinciaPorNombre = provinciasCompletas.find(p => p.nombre === provinciaMapeada);

        if (provinciaPorCodigo) {
          provinciaMapeada = provinciaPorCodigo.codigo;
        } else if (provinciaPorNombre) {
          provinciaMapeada = provinciaPorNombre.codigo;
        }
      }
      
      // tipoCliente debe ser NOMBRE para coincidir con el select (value={tipo.nombre})
      let tipoClienteNombre = (clienteCompleto as any).tipoClienteNombre || '';
      if (!tipoClienteNombre && (clienteCompleto as any).tipoClienteCodigo) {
        const tipoClienteEncontrado = tiposClienteCompletos.find((tc: any) => tc.codigo === (clienteCompleto as any).tipoClienteCodigo);
        if (tipoClienteEncontrado) {
          tipoClienteNombre = tipoClienteEncontrado.nombre;
        }
      }
      
      const clienteParaMostrar = {
        ...clienteCompleto,
        tipoCliente: tipoClienteNombre,
        tipoClienteNombre: tipoClienteNombre,
        provincia: provinciaMapeada,
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
      console.error('Error obteniendo cliente completo:', error instanceof Error ? error.message : 'Unknown error');
      let provinciaMapeada = client.provincia || '';
      if (provinciaMapeada) {
        const provinciaPorCodigo = provinciasCompletas.find(p => p.codigo === provinciaMapeada);
        const provinciaPorNombre = provinciasCompletas.find(p => p.nombre === provinciaMapeada);
        
        if (provinciaPorCodigo) {
          provinciaMapeada = provinciaPorCodigo.codigo;
        } else if (provinciaPorNombre) {
          provinciaMapeada = provinciaPorNombre.codigo;
        }
      }
      
      let tiposClienteCompletos: any[] = [];
      try {
        tiposClienteCompletos = await apiService.getClientTypes();
      } catch (e) {
        console.error('Error obteniendo tipos de cliente:', e instanceof Error ? e.message : 'Unknown error');
      }
      
      // tipoCliente debe ser NOMBRE para coincidir con el select (value={tipo.nombre})
      let tipoClienteNombre = (client as any).tipoClienteNombre || client.tipoCliente || '';
      if (tipoClienteNombre && tiposClienteCompletos.length > 0) {
        const tipoClientePorCodigo = tiposClienteCompletos.find((tc: any) => tc.codigo === tipoClienteNombre);
        const tipoClientePorNombre = tiposClienteCompletos.find((tc: any) => tc.nombre === tipoClienteNombre);
        
        if (tipoClientePorCodigo) {
          tipoClienteNombre = tipoClientePorCodigo.nombre;
        } else if (tipoClientePorNombre) {
          tipoClienteNombre = tipoClientePorNombre.nombre;
        }
      }
      
      const clienteParaMostrar = {
        ...client,
        tipoCliente: tipoClienteNombre,
        tipoClienteNombre: tipoClienteNombre,
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

