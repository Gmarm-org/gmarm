import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { Client } from '../Vendedor/types';
import Header from '../../components/Header';
import AsignacionSeries from '../AsignacionSeries';
import { useAuth } from '../../contexts/AuthContext';
import { useJefeVentasExport } from './hooks/useJefeVentasExport';
import { useTableFilters } from '../../hooks/useTableFilters';
import ImportGroupManagement from './components/ImportGroupManagement';
import GestionImportaciones from '../../components/shared/GestionImportaciones';
import ClientForm from '../Vendedor/components/ClientForm';
import WeaponListContent from '../Admin/WeaponManagement/WeaponListContent';
import WeaponCategoryList from '../Admin/WeaponManagement/WeaponCategoryList';
import ModalGenerarContrato from './components/ModalGenerarContrato';
import ModalReasignarArma from './components/ModalReasignarArma';
import ModalEditarArma from './components/ModalEditarArma';
import ModalDesistimiento from './components/ModalDesistimiento';
import ModalClienteReasignado from './components/ModalClienteReasignado';
import ModalAutorizacion from './components/ModalAutorizacion';
import type { StockArma, ClienteConVendedor } from './types';
import StockView from './views/StockView';
import ClientesListView from './views/ClientesListView';
import ClientesAsignadosView from './views/ClientesAsignadosView';
import ReasignarArmasView from './views/ReasignarArmasView';
import ClientDetailModal from './views/ClientDetailModal';

const JefeVentas: React.FC = () => {
  const { user } = useAuth();
  const [vistaActual, setVistaActual] = useState<'clientes' | 'clientes-asignados' | 'stock' | 'importaciones' | 'gestion-importaciones' | 'series' | 'reasignar-armas' | 'armas' | 'categorias'>('clientes');

  // Hook para exportación a Excel
  const { exportarClientesAExcel } = useJefeVentasExport();

  // Verificar si el usuario tiene permisos para ver Asignación de Series
  const puedeVerAsignacionSeries = user?.roles?.some(
    role => {
      const codigo = role.rol?.codigo || (role as any).codigo;
      return codigo === 'SALES_CHIEF' || codigo === 'FINANCE';
    }
  ) || false;

  // Estados para Stock de Armas
  const [stockArmas, setStockArmas] = useState<StockArma[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Estados para Clientes
  const [clientes, setClientes] = useState<ClienteConVendedor[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConVendedor | null>(null);
  const [clientesAsignados, setClientesAsignados] = useState<ClienteConVendedor[]>([]);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>>({});

  // Estados para autorizaciones (integrado desde ClientesAsignados)
  const [autorizaciones, setAutorizaciones] = useState<Record<string, any[]>>({});

  // Estados para detalle completo del cliente
  const [armasCliente, setArmasCliente] = useState<any[]>([]);
  const [documentosCliente, setDocumentosCliente] = useState<any[]>([]);
  const [contratosCliente, setContratosCliente] = useState<any[]>([]);
  const [pagosCliente, setPagosCliente] = useState<any[]>([]);
  const [loadingDetalleCliente, setLoadingDetalleCliente] = useState(false);

  // Estados para modal de generar contrato
  const [modalGenerarContrato, setModalGenerarContrato] = useState<{ isOpen: boolean; datosContrato: any | null; isLoading: boolean }>({
    isOpen: false,
    datosContrato: null,
    isLoading: false
  });

  // Estados para editar cliente (replicados del módulo Vendedor)
  const [currentPage, setCurrentPage] = useState<string>('clientes');
  const [selectedClient, setSelectedClient] = useState<ClienteConVendedor | null>(null);
  const [clientFormMode, setClientFormMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedWeapon, setSelectedWeapon] = useState<any | null>(null);
  const [precioModificado, setPrecioModificado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);

  // Estados para reasignar arma
  const [modalReasignarArma, setModalReasignarArma] = useState<{ isOpen: boolean; cliente: ClienteConVendedor | null; isLoading: boolean }>({
    isOpen: false,
    cliente: null,
    isLoading: false
  });

  // Estados para desistimiento
  const [modalDesistimiento, setModalDesistimiento] = useState<{ isOpen: boolean; cliente: ClienteConVendedor | null; observacion: string; isLoading: boolean }>({
    isOpen: false,
    cliente: null,
    observacion: '',
    isLoading: false
  });

  // Estados para editar arma
  const [modalEditarArma, setModalEditarArma] = useState<{ isOpen: boolean; clienteArma: any | null; armasDisponibles: any[]; armaSeleccionada: any | null; nuevoPrecio: string; isLoading: boolean }>({
    isOpen: false,
    clienteArma: null,
    armasDisponibles: [],
    armaSeleccionada: null,
    nuevoPrecio: '',
    isLoading: false
  });

  // Estados para armas reasignadas
  const [armasReasignadas, setArmasReasignadas] = useState<any[]>([]);
  const [loadingArmasReasignadas, setLoadingArmasReasignadas] = useState(false);

  // Estados para modal de generar autorización (integrado desde ClientesAsignados)
  const [mostrarModalAutorizacion, setMostrarModalAutorizacion] = useState(false);
  const [clienteAutorizacion, setClienteAutorizacion] = useState<ClienteConVendedor | null>(null);
  const [numeroFacturaAutorizacion, setNumeroFacturaAutorizacion] = useState('');
  const [tramiteAutorizacion, setTramiteAutorizacion] = useState('');
  const [generandoAutorizacion, setGenerandoAutorizacion] = useState(false);

  // Función para cargar armas reasignadas
  const cargarArmasReasignadas = async () => {
    setLoadingArmasReasignadas(true);
    try {
      setArmasReasignadas([]);
    } catch (error) {
      console.error('Error cargando armas reasignadas:', error);
    } finally {
      setLoadingArmasReasignadas(false);
    }
  };

  // Handler para abrir modal de cliente reasignado
  const handleAbrirModalClienteReasignado = (arma: any) => {
    setModalClienteReasignado({
      isOpen: true,
      arma,
      nuevoClienteId: null,
      isLoading: false
    });
  };

  // Handler para confirmar reasignación de cliente
  const handleConfirmarClienteReasignado = async () => {
    if (!modalClienteReasignado.arma || !modalClienteReasignado.nuevoClienteId) return;

    setModalClienteReasignado(prev => ({ ...prev, isLoading: true }));

    try {
      alert('Reasignación confirmada (pendiente de implementar)');
      setModalClienteReasignado({ isOpen: false, arma: null, nuevoClienteId: null, isLoading: false });
      cargarArmasReasignadas();
    } catch (error) {
      console.error('Error confirmando reasignación:', error);
      alert('Error al confirmar reasignación');
    } finally {
      setModalClienteReasignado(prev => ({ ...prev, isLoading: false }));
    }
  };
  const [modalClienteReasignado, setModalClienteReasignado] = useState<{ isOpen: boolean; arma: any | null; nuevoClienteId: number | null; isLoading: boolean }>({
    isOpen: false,
    arma: null,
    nuevoClienteId: null,
    isLoading: false
  });

  // Hooks para filtros y ordenamiento
  const {
    filteredAndSortedData: clientesFiltrados,
    sortConfig: sortConfigClientes,
    handleSort: handleSortClientes,
    filters: filtersClientes,
    setFilter: setFilterClientes,
    clearFilters: clearFiltersClientes,
  } = useTableFilters<ClienteConVendedor>(clientes);

  const {
    filteredAndSortedData: clientesAsignadosFiltrados,
    sortConfig: sortConfigAsignados,
    handleSort: handleSortAsignados,
    filters: filtersAsignados,
    setFilter: setFilterAsignados,
    clearFilters: clearFiltersAsignados,
  } = useTableFilters<ClienteConVendedor>(clientesAsignados);

  // Cargar datos según la vista actual
  useEffect(() => {
    if (vistaActual === 'stock') {
      cargarStockArmas();
    } else if (vistaActual === 'clientes') {
      cargarClientes();
    } else if (vistaActual === 'clientes-asignados') {
      cargarClientesAsignados();
    } else if (vistaActual === 'reasignar-armas') {
      cargarArmasReasignadas();
    }
  }, [vistaActual]);

  const cargarStockArmas = async () => {
    setLoadingStock(true);
    try {
      const response = await apiService.getStockTodasArmas();
      setStockArmas(response);
    } catch (error) {
      console.error('Error cargando stock:', error);
      alert(`Error cargando el inventario de armas: ${error}`);
    } finally {
      setLoadingStock(false);
    }
  };

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      const response = await apiService.getTodosClientes();

      const clientesSinArmaAsignada: ClienteConVendedor[] = [];

      for (const cliente of response) {
        try {
          const armasResponse = await apiService.getArmasCliente(cliente.id);
          const tieneArmaAsignada = armasResponse && armasResponse.length > 0 &&
                                     armasResponse.some((arma: any) => arma.estado === 'ASIGNADA');

          if (!tieneArmaAsignada) {
            clientesSinArmaAsignada.push(cliente);
          }
        } catch (error) {
          clientesSinArmaAsignada.push(cliente);
        }
      }

      setClientes(clientesSinArmaAsignada);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      alert(`Error cargando la lista de clientes: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

  const cargarClientesAsignados = async () => {
    setLoadingClientes(true);
    try {
      const response = await apiService.getTodosClientes();

      const weaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }> = {};
      const clientesConArmaAsignada: ClienteConVendedor[] = [];
      const autorizacionesTemp: Record<string, any[]> = {};

      for (const client of response) {
        try {
          const armasResponse = await apiService.getArmasCliente(client.id);
          if (armasResponse && armasResponse.length > 0) {
            const arma = armasResponse[0];
            const armaModelo = arma.armaModelo || arma.armaNombre || 'N/A';
            weaponAssignments[client.id] = {
              weapon: {
                id: arma.armaId,
                nombre: armaModelo,
                modelo: armaModelo,
                marca: arma.armaMarca,
                alimentadora: arma.armaAlimentadora,
                calibre: arma.armaCalibre || 'N/A',
                codigo: arma.armaCodigo,
                urlImagen: arma.armaImagen,
                precioReferencia: parseFloat(arma.precioUnitario) || 0
              },
              precio: parseFloat(arma.precioUnitario) || 0,
              cantidad: parseInt(arma.cantidad) || 1,
              numeroSerie: arma.numeroSerie,
              estado: arma.estado
            };

            if (arma.estado === 'ASIGNADA') {
              clientesConArmaAsignada.push(client);

              try {
                const autorizacionesResponse = await apiService.getAutorizacionesPorCliente(parseInt(client.id));
                autorizacionesTemp[client.id] = autorizacionesResponse || [];
              } catch {
                autorizacionesTemp[client.id] = [];
              }
            }
          }
        } catch {
          // Si falla cargar armas de un cliente, continuar con el siguiente
        }
      }

      setClientesAsignados(clientesConArmaAsignada);
      setClientWeaponAssignments(weaponAssignments);
      setAutorizaciones(autorizacionesTemp);
    } catch (error) {
      console.error('Error cargando clientes asignados:', error);
      alert(`Error cargando la lista de clientes asignados: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

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
            console.warn(`No se pudieron cargar cuotas para pago ${pago.id}`);
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
      console.error('Error cargando detalle del cliente:', error);
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

  // Handlers para autorización (integrado desde ClientesAsignados)
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
        console.warn('No se pudo cargar el trámite del grupo de importación:', error);
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
      await cargarClientesAsignados();
    } catch (error) {
      console.error('Error generando autorización:', error);
      alert(`Error generando la autorización: ${error}`);
    } finally {
      setGenerandoAutorizacion(false);
    }
  };

  // Handler para editar cliente (similar al de Vendedor)
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
      console.error('Error obteniendo cliente completo:', error);
      alert('Error al cargar los datos del cliente para editar');
    }
  };

  const handleClientSaved = async (_client: Client) => {
    try {
      await cargarClientes();
      if (vistaActual === 'clientes-asignados') {
        await cargarClientesAsignados();
      }
      setCurrentPage('clientes');
      setSelectedClient(null);
      setClientFormMode('view');
      alert('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error recargando clientes después de editar:', error);
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

  const handleAbrirModalReasignarArma = (cliente: ClienteConVendedor) => {
    setModalReasignarArma({ isOpen: true, cliente, isLoading: false });
  };

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
      cargarClientes();
    } catch (error: any) {
      console.error('Error cambiando estado a DESISTIMIENTO:', error);

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
      console.error('Error cargando armas:', error);
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
      console.error('Error actualizando arma:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error desconocido';
      alert(`Error al actualizar arma: ${errorMessage}`);
    } finally {
      setModalEditarArma(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleAbrirModalGenerarContrato = async () => {
    if (!clienteSeleccionado) return;

    setModalGenerarContrato({ isOpen: true, datosContrato: null, isLoading: true });

    try {
      const datos = await apiService.obtenerDatosContrato(Number(clienteSeleccionado.id));
      setModalGenerarContrato({ isOpen: true, datosContrato: datos, isLoading: false });
    } catch (error) {
      console.error('Error obteniendo datos del contrato:', error);
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
      console.error('Error generando documento:', error);
      const errorMessage = error?.responseData?.error || error?.message || 'Error desconocido';
      alert('Error al generar documento: ' + errorMessage);
      setModalGenerarContrato(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Panel de Jefe de Ventas"
        subtitle="Gestión de inventario, clientes e importaciones"
      />

      <div className="w-full px-2 py-4">

        {/* Si estamos en modo edición de cliente, mostrar solo el formulario */}
        {currentPage === 'clientForm' && selectedClient ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Editar Cliente</h2>
              <button
                onClick={handleCloseForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Volver a la lista
              </button>
            </div>
            <ClientForm
              mode={clientFormMode}
              client={selectedClient as any}
              onSave={handleClientSaved as any}
              onCancel={handleCloseForm}
              onEdit={() => selectedClient && handleEditarCliente(selectedClient as ClienteConVendedor)}
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
        ) : (
          <>
        {/* Navegación de pestañas */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setVistaActual('clientes')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'clientes'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            👥 Todos los Clientes
          </button>

          <button
            onClick={() => setVistaActual('clientes-asignados')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'clientes-asignados'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✅ Clientes con Serie Asignada
          </button>

          <button
            onClick={() => setVistaActual('importaciones')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'importaciones'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📦 Importaciones
          </button>

          <button
            onClick={() => setVistaActual('gestion-importaciones')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'gestion-importaciones'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✅ Gestión Importaciones
          </button>

          <button
            onClick={() => setVistaActual('reasignar-armas')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'reasignar-armas'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔄 Reasignar Armas
          </button>

          {puedeVerAsignacionSeries && (
            <button
              onClick={() => setVistaActual('series')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                vistaActual === 'series'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔢 Asignación de Series
            </button>
          )}

          <button
            onClick={() => setVistaActual('armas')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'armas'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔫 Armas
          </button>

          <button
            onClick={() => setVistaActual('categorias')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'categorias'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏷️ Categorías
          </button>
        </div>

        {/* Contenido: Stock de Armas */}
        {vistaActual === 'stock' && (
          <StockView
            stockArmas={stockArmas}
            loadingStock={loadingStock}
            onRefresh={cargarStockArmas}
          />
        )}

        {/* Contenido: Todos los Clientes */}
        {vistaActual === 'clientes' && (
          <ClientesListView
            clientesFiltrados={clientesFiltrados}
            loadingClientes={loadingClientes}
            sortConfig={sortConfigClientes}
            onSort={handleSortClientes}
            filters={filtersClientes}
            setFilter={setFilterClientes}
            clearFilters={clearFiltersClientes}
            onRefresh={cargarClientes}
            onExport={exportarClientesAExcel}
            onVerDetalle={handleVerDetalleCliente}
            onEditar={handleEditarCliente}
            onReasignarArma={handleAbrirModalReasignarArma}
            onDesistimiento={handleAbrirModalDesistimiento}
          />
        )}

        {/* Contenido: Clientes con Serie Asignada */}
        {vistaActual === 'clientes-asignados' && (
          <ClientesAsignadosView
            clientesAsignadosFiltrados={clientesAsignadosFiltrados}
            loadingClientes={loadingClientes}
            sortConfig={sortConfigAsignados}
            onSort={handleSortAsignados}
            filters={filtersAsignados}
            setFilter={setFilterAsignados}
            clearFilters={clearFiltersAsignados}
            clientWeaponAssignments={clientWeaponAssignments}
            autorizaciones={autorizaciones}
            onRefresh={cargarClientesAsignados}
            onVerDetalle={handleVerDetalleCliente}
            onGenerarAutorizacion={handleGenerarAutorizacion}
          />
        )}

        {/* Modal de Detalle de Cliente */}
        {clienteSeleccionado && (
          <ClientDetailModal
            cliente={clienteSeleccionado}
            onClose={handleCerrarDetalle}
            loadingDetalleCliente={loadingDetalleCliente}
            armasCliente={armasCliente}
            documentosCliente={documentosCliente}
            contratosCliente={contratosCliente}
            setContratosCliente={setContratosCliente}
            pagosCliente={pagosCliente}
            vistaActual={vistaActual}
            user={user}
            onAbrirModalGenerarContrato={handleAbrirModalGenerarContrato}
            onAbrirModalEditarArma={handleAbrirModalEditarArma}
          />
        )}

        {/* Modal de Generar Contrato */}
        <ModalGenerarContrato
          state={modalGenerarContrato}
          onGenerar={handleGenerarContrato}
          onClose={() => setModalGenerarContrato({ isOpen: false, datosContrato: null, isLoading: false })}
        />

        {/* Contenido: Importaciones */}
        {vistaActual === 'importaciones' && (
          <ImportGroupManagement />
        )}

        {/* Contenido: Gestión de Importaciones */}
        {vistaActual === 'gestion-importaciones' && (
          <GestionImportaciones />
        )}

        {/* Contenido: Reasignar Armas */}
        {vistaActual === 'reasignar-armas' && (
          <ReasignarArmasView
            armasReasignadas={armasReasignadas}
            loadingArmasReasignadas={loadingArmasReasignadas}
            onRefresh={cargarArmasReasignadas}
            onClienteReasignado={handleAbrirModalClienteReasignado}
          />
        )}

        {/* Contenido: Asignación de Series */}
        {vistaActual === 'series' && (
          <AsignacionSeries />
        )}

        {/* Contenido: Gestión de Armas - Para Jefe de Ventas */}
        {vistaActual === 'armas' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <WeaponListContent />
          </div>
        )}

        {/* Contenido: Gestión de Categorías - Para Jefe de Ventas */}
        {vistaActual === 'categorias' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <WeaponCategoryList />
          </div>
        )}
          </>
        )}

        {/* Modal de Reasignar Arma */}
        <ModalReasignarArma
          isOpen={modalReasignarArma.isOpen}
          cliente={modalReasignarArma.cliente}
          onClose={() => setModalReasignarArma({ isOpen: false, cliente: null, isLoading: false })}
        />

        {/* Modal de Editar Arma */}
        <ModalEditarArma
          state={modalEditarArma}
          onArmaChange={(arma, nuevoPrecio) => setModalEditarArma(prev => ({ ...prev, armaSeleccionada: arma, nuevoPrecio }))}
          onPrecioChange={(precio) => setModalEditarArma(prev => ({ ...prev, nuevoPrecio: precio }))}
          onConfirm={handleConfirmarEditarArma}
          onClose={() => setModalEditarArma({ isOpen: false, clienteArma: null, armasDisponibles: [], armaSeleccionada: null, nuevoPrecio: '', isLoading: false })}
        />

        {/* Modal de Desistimiento */}
        <ModalDesistimiento
          state={modalDesistimiento}
          onObservacionChange={(obs) => setModalDesistimiento(prev => ({ ...prev, observacion: obs }))}
          onConfirm={handleConfirmarDesistimiento}
          onClose={() => setModalDesistimiento({ isOpen: false, cliente: null, observacion: '', isLoading: false })}
        />

        {/* Modal de Cliente Reasignado */}
        <ModalClienteReasignado
          state={modalClienteReasignado}
          clientes={clientes}
          onClienteChange={(clienteId) => setModalClienteReasignado(prev => ({ ...prev, nuevoClienteId: clienteId }))}
          onConfirm={handleConfirmarClienteReasignado}
          onClose={() => setModalClienteReasignado({ isOpen: false, arma: null, nuevoClienteId: null, isLoading: false })}
        />

        {/* Modal de Generar Autorización de Venta */}
        <ModalAutorizacion
          isOpen={mostrarModalAutorizacion}
          cliente={clienteAutorizacion}
          autorizaciones={autorizaciones}
          weaponAssignment={clienteAutorizacion ? clientWeaponAssignments[clienteAutorizacion.id] : undefined}
          numeroFactura={numeroFacturaAutorizacion}
          onNumeroFacturaChange={setNumeroFacturaAutorizacion}
          tramite={tramiteAutorizacion}
          onTramiteChange={setTramiteAutorizacion}
          generando={generandoAutorizacion}
          onConfirm={handleConfirmarGeneracionAutorizacion}
          onClose={handleCerrarModalAutorizacion}
        />
      </div>
    </div>
  );
};

export default JefeVentas;
