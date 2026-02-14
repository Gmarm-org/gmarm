import { useCallback } from 'react';
import { apiService } from '../../../services/api';
import type { Client } from '../../Vendedor/types';
import type { ClienteConVendedor } from '../types';
import type { useJefeVentasState } from './useJefeVentasState';

type State = ReturnType<typeof useJefeVentasState>;

interface DataActions {
  cargarClientes: () => Promise<void>;
  cargarClientesAsignados: () => Promise<void>;
  cargarArmasReasignadas: () => Promise<void>;
}

export function useJefeVentasHandlers(state: State, dataActions: DataActions) {
  const {
    vistaActual,
    clienteSeleccionado, setClienteSeleccionado,
    clientWeaponAssignments, setClientWeaponAssignments,
    setArmasCliente, setDocumentosCliente, setContratosCliente, setPagosCliente,
    setLoadingDetalleCliente,
    setModalGenerarContrato,
    currentPage, setCurrentPage,
    selectedClient, setSelectedClient,
    setClientFormMode,
    selectedWeapon, setSelectedWeapon,
    precioModificado, setPrecioModificado,
    cantidad, setCantidad,
    setModalReasignarArma,
    modalDesistimiento, setModalDesistimiento,
    modalEditarArma, setModalEditarArma,
    modalClienteReasignado, setModalClienteReasignado,
    setMostrarModalAutorizacion,
    clienteAutorizacion, setClienteAutorizacion,
    numeroFacturaAutorizacion, setNumeroFacturaAutorizacion,
    tramiteAutorizacion, setTramiteAutorizacion,
    setGenerandoAutorizacion,
  } = state;

  // Detalle de cliente
  const handleVerDetalleCliente = async (cliente: ClienteConVendedor) => {
    setClienteSeleccionado(cliente);
    setLoadingDetalleCliente(true);

    try {
      const armas = await apiService.getArmasCliente(Number(cliente.id));
      setArmasCliente(armas);

      const documentos = await apiService.getDocumentosCliente(Number(cliente.id));
      setDocumentosCliente(documentos);

      const contratos = await apiService.getContratosCliente(Number(cliente.id));
      setContratosCliente(contratos);

      const pagos = await apiService.getPagosCliente(Number(cliente.id));

      const cuotasTemp: any[] = [];
      for (const pago of pagos) {
        if (pago.tipoPago === 'CREDITO' || pago.tipoPago === 'CUOTAS') {
          try {
            const cuotas = await apiService.getCuotasPorPago(pago.id);
            cuotasTemp.push(...cuotas);
          } catch (error) {
            // Cuotas no disponibles para este pago
          }
        } else {
          cuotasTemp.push({
            numeroCuota: 1,
            monto: pago.montoTotal,
            estado: pago.estado,
            fechaVencimiento: null,
            fechaPago: pago.fechaCreacion
          });
        }
      }

      setPagosCliente(cuotasTemp);
    } catch (error) {
      console.error('Error cargando detalle del cliente:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoadingDetalleCliente(false);
    }
  };

  const handleCerrarDetalle = () => {
    setClienteSeleccionado(null);
    setArmasCliente([]);
    setDocumentosCliente([]);
    setContratosCliente([]);
    setPagosCliente([]);
  };

  // Autorización
  const handleGenerarAutorizacion = async (cliente: ClienteConVendedor) => {
    setClienteAutorizacion(cliente);
    setNumeroFacturaAutorizacion('');

    if (cliente.grupoImportacionId) {
      try {
        const grupo = await apiService.getGrupoImportacion(cliente.grupoImportacionId);
        if (grupo.tra) {
          setTramiteAutorizacion(grupo.tra);
        } else {
          setTramiteAutorizacion('');
        }
      } catch (error) {
        // No se pudo cargar el tramite del grupo de importacion
        setTramiteAutorizacion('');
      }
    } else {
      setTramiteAutorizacion('');
    }

    setMostrarModalAutorizacion(true);
  };

  const handleCerrarModalAutorizacion = () => {
    setMostrarModalAutorizacion(false);
    setClienteAutorizacion(null);
    setNumeroFacturaAutorizacion('');
    setTramiteAutorizacion('');
  };

  const handleConfirmarGeneracionAutorizacion = async () => {
    if (!clienteAutorizacion) return;

    if (!numeroFacturaAutorizacion.trim()) {
      alert('Por favor ingrese el número de factura');
      return;
    }

    if (!tramiteAutorizacion.trim()) {
      alert('Por favor ingrese el trámite');
      return;
    }

    setGenerandoAutorizacion(true);
    try {
      await apiService.generarAutorizacion(
        clienteAutorizacion.id,
        numeroFacturaAutorizacion,
        tramiteAutorizacion
      );

      alert('Autorización de venta generada exitosamente');
      handleCerrarModalAutorizacion();
      await dataActions.cargarClientesAsignados();
    } catch (error) {
      console.error('Error generando autorizacion:', error instanceof Error ? error.message : 'Unknown error');
      alert(`Error generando la autorización: ${error}`);
    } finally {
      setGenerandoAutorizacion(false);
    }
  };

  // Editar cliente
  const handleEditarCliente = async (cliente: ClienteConVendedor) => {
    try {
      const clienteCompleto = await apiService.getCliente(parseInt(cliente.id));
      const tiposClienteCompletos = await apiService.getClientTypes();

      let provinciaMapeada = (clienteCompleto as any).provincia || '';
      if (provinciaMapeada && !provinciaMapeada.match(/^[0-9]+$/)) {
        // Es nombre, no código numérico
      }

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

      const assignment = clientWeaponAssignments[cliente.id];
      if (assignment) {
        setSelectedWeapon(assignment.weapon);
        setPrecioModificado(assignment.precio);
        setCantidad(assignment.cantidad);
      } else {
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
      }

      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('edit');
      setCurrentPage('clientForm');
    } catch (error) {
      console.error('Error obteniendo cliente completo:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error al cargar los datos del cliente para editar');
    }
  };

  const handleClientSaved = async (_client: Client) => {
    try {
      await dataActions.cargarClientes();
      if (vistaActual === 'clientes-asignados') {
        await dataActions.cargarClientesAsignados();
      }
      setCurrentPage('clientes');
      setSelectedClient(null);
      setClientFormMode('view');
      alert('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error recargando clientes despues de editar:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleCloseForm = () => {
    setCurrentPage('clientes');
    setSelectedClient(null);
    setClientFormMode('view');
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  };

  const handlePriceChangeWrapper = useCallback((price: number) => {
    setPrecioModificado(price);
    if (selectedClient && selectedWeapon) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon,
          precio: price,
          cantidad: cantidad
        }
      }));
    }
  }, [selectedClient, selectedWeapon, cantidad]);

  const handleQuantityChangeWrapper = useCallback((quantity: number) => {
    setCantidad(quantity);
    if (selectedClient && selectedWeapon) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon,
          precio: precioModificado,
          cantidad: quantity
        }
      }));
    }
  }, [selectedClient, selectedWeapon, precioModificado]);

  const handleNavigateToWeaponSelection = useCallback(() => {
    // No aplicable en modo edición
  }, []);

  const handleClientDataConfirm = useCallback((_formData: any) => {
    // No aplicable en modo edición
  }, []);

  const handleClienteBloqueado = useCallback((_clientId: string, bloqueado: boolean, _motivo: string) => {
    if (bloqueado && currentPage === 'clientForm') {
      handleCloseForm();
    }
  }, [currentPage]);

  // Reasignar arma
  const handleAbrirModalReasignarArma = (cliente: ClienteConVendedor) => {
    setModalReasignarArma({ isOpen: true, cliente, isLoading: false });
  };

  // Desistimiento
  const handleAbrirModalDesistimiento = (cliente: ClienteConVendedor) => {
    setModalDesistimiento({ isOpen: true, cliente, observacion: '', isLoading: false });
  };

  const handleConfirmarDesistimiento = async () => {
    if (!modalDesistimiento.cliente) return;

    setModalDesistimiento(prev => ({ ...prev, isLoading: true }));

    try {
      await apiService.cambiarEstadoDesistimiento(
        Number(modalDesistimiento.cliente!.id),
        modalDesistimiento.observacion || ''
      );

      alert('Estado del cliente actualizado a DESISTIMIENTO exitosamente');
      setModalDesistimiento({ isOpen: false, cliente: null, observacion: '', isLoading: false });
      dataActions.cargarClientes();
    } catch (error: any) {
      console.error('Error cambiando estado a DESISTIMIENTO:', error instanceof Error ? error.message : 'Unknown error');

      let errorMessage = 'Error desconocido al cambiar estado';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert(`Error al cambiar estado: ${errorMessage}`);
    } finally {
      setModalDesistimiento(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Editar arma
  const handleAbrirModalEditarArma = async (clienteArma: any) => {
    if (!clienteArma) return;

    try {
      const armas = await apiService.getArmas();
      setModalEditarArma({
        isOpen: true,
        clienteArma,
        armasDisponibles: armas || [],
        armaSeleccionada: null,
        nuevoPrecio: clienteArma.precioUnitario?.toString() || '',
        isLoading: false
      });
    } catch (error) {
      console.error('Error cargando armas:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error al cargar armas disponibles');
    }
  };

  const handleConfirmarEditarArma = async () => {
    if (!modalEditarArma.clienteArma || !modalEditarArma.armaSeleccionada) {
      alert('Por favor, selecciona una nueva arma');
      return;
    }

    setModalEditarArma(prev => ({ ...prev, isLoading: true }));

    try {
      const nuevoPrecio = modalEditarArma.nuevoPrecio ? parseFloat(modalEditarArma.nuevoPrecio) : undefined;

      await apiService.actualizarArmaReserva(
        modalEditarArma.clienteArma.id,
        modalEditarArma.armaSeleccionada.id,
        nuevoPrecio
      );

      alert('Arma actualizada exitosamente. Puedes generar un nuevo contrato si lo deseas.');

      setModalEditarArma({
        isOpen: false,
        clienteArma: null,
        armasDisponibles: [],
        armaSeleccionada: null,
        nuevoPrecio: '',
        isLoading: false
      });

      if (clienteSeleccionado) {
        const armas = await apiService.getArmasCliente(Number(clienteSeleccionado.id));
        setArmasCliente(armas);
      }
    } catch (error: any) {
      console.error('Error actualizando arma:', error instanceof Error ? error.message : 'Unknown error');
      const errorMessage = error?.response?.data?.error || error?.message || 'Error desconocido';
      alert(`Error al actualizar arma: ${errorMessage}`);
    } finally {
      setModalEditarArma(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Generar contrato
  const handleAbrirModalGenerarContrato = async () => {
    if (!clienteSeleccionado) return;

    setModalGenerarContrato({ isOpen: true, datosContrato: null, isLoading: true });

    try {
      const datos = await apiService.obtenerDatosContrato(Number(clienteSeleccionado.id));
      setModalGenerarContrato({ isOpen: true, datosContrato: datos, isLoading: false });
    } catch (error) {
      console.error('Error obteniendo datos del contrato:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error al obtener datos del contrato. Por favor, intente nuevamente.');
      setModalGenerarContrato({ isOpen: false, datosContrato: null, isLoading: false });
    }
  };

  const handleGenerarContrato = async () => {
    if (!clienteSeleccionado) return;

    setModalGenerarContrato(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await apiService.generarContrato(Number(clienteSeleccionado.id));

      if (response.success) {
        alert('Documento(s) generado(s) exitosamente');
        const contratos = await apiService.getContratosCliente(Number(clienteSeleccionado.id));
        setContratosCliente(contratos);
        setModalGenerarContrato({ isOpen: false, datosContrato: null, isLoading: false });
      } else {
        alert('Error al generar documento: ' + (response.message || 'Error desconocido'));
        setModalGenerarContrato(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error: any) {
      console.error('Error generando documento:', error instanceof Error ? error.message : 'Unknown error');
      const errorMessage = error?.responseData?.error || error?.message || 'Error desconocido';
      alert('Error al generar documento: ' + errorMessage);
      setModalGenerarContrato(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Cliente reasignado
  const handleAbrirModalClienteReasignado = (arma: any) => {
    setModalClienteReasignado({
      isOpen: true,
      arma,
      nuevoClienteId: null,
      isLoading: false
    });
  };

  const handleConfirmarClienteReasignado = async () => {
    if (!modalClienteReasignado.arma || !modalClienteReasignado.nuevoClienteId) return;

    setModalClienteReasignado(prev => ({ ...prev, isLoading: true }));

    try {
      alert('Reasignación confirmada (pendiente de implementar)');
      setModalClienteReasignado({ isOpen: false, arma: null, nuevoClienteId: null, isLoading: false });
      dataActions.cargarArmasReasignadas();
    } catch (error) {
      console.error('Error confirmando reasignacion:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error al confirmar reasignación');
    } finally {
      setModalClienteReasignado(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    handleVerDetalleCliente,
    handleCerrarDetalle,
    handleGenerarAutorizacion,
    handleCerrarModalAutorizacion,
    handleConfirmarGeneracionAutorizacion,
    handleEditarCliente,
    handleClientSaved,
    handleCloseForm,
    handlePriceChangeWrapper,
    handleQuantityChangeWrapper,
    handleNavigateToWeaponSelection,
    handleClientDataConfirm,
    handleClienteBloqueado,
    handleAbrirModalReasignarArma,
    handleAbrirModalDesistimiento,
    handleConfirmarDesistimiento,
    handleAbrirModalEditarArma,
    handleConfirmarEditarArma,
    handleAbrirModalGenerarContrato,
    handleGenerarContrato,
    handleAbrirModalClienteReasignado,
    handleConfirmarClienteReasignado,
  };
}
