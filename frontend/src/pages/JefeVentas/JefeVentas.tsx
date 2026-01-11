import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { Client } from '../Vendedor/types';
import Header from '../../components/Header';
import AsignacionSeries from '../AsignacionSeries';
import { useAuth } from '../../contexts/AuthContext';
import { useJefeVentasExport } from './hooks/useJefeVentasExport';
import { useTableFilters } from '../../hooks/useTableFilters';
import { TableHeaderWithFilters } from '../../components/TableHeaderWithFilters';
import ImportGroupManagement from './components/ImportGroupManagement';
import ClientForm from '../Vendedor/components/ClientForm';
import WeaponListContent from '../Admin/WeaponManagement/WeaponListContent';
import WeaponCategoryList from '../Admin/WeaponManagement/WeaponCategoryList';

interface StockArma {
  armaId: number;
  armaNombre?: string; // Deprecated - usar armaModelo
  armaModelo?: string; // Nuevo campo (cambiado de nombre a modelo)
  armaMarca?: string; // Nuevo campo
  armaAlimentadora?: string; // Nuevo campo
  armaCodigo: string;
  armaCalibre: string;
  cantidadTotal: number;
  cantidadDisponible: number;
  cantidadAsignada?: number; // Armas con pago completado
  precioVenta: number;
}

interface ClienteConVendedor extends Client {
  vendedorNombre?: string;
  vendedorApellidos?: string;
  fechaCreacion?: string;
  estadoPago?: string;
  grupoImportacionNombre?: string;
  licenciaNombre?: string; // Nombre de la licencia del grupo de importación
  licenciaNumero?: string; // Número de la licencia del grupo de importación
  emailVerificado?: boolean | null; // true = Validado, false = Datos incorrectos, null/undefined = Pendiente
}

const JefeVentas: React.FC = () => {
  const { user } = useAuth();
  const [vistaActual, setVistaActual] = useState<'clientes' | 'clientes-asignados' | 'stock' | 'importaciones' | 'series' | 'reasignar-armas' | 'armas' | 'categorias'>('clientes');
  
  // Hook para exportación a Excel
  const { exportarClientesAExcel } = useJefeVentasExport();
  
  // Verificar si el usuario tiene permisos para ver Asignación de Series
  const puedeVerAsignacionSeries = user?.roles?.some(
    role => {
      const codigo = role.rol?.codigo || (role as any).codigo;
      console.log('🔍 JefeVentas - Verificando rol para asignación de series:', codigo);
      return codigo === 'SALES_CHIEF' || codigo === 'FINANCE';
    }
  ) || false;
  
  console.log('🔍 JefeVentas - puedeVerAsignacionSeries:', puedeVerAsignacionSeries);
  
  // Estados para Stock de Armas
  const [stockArmas, setStockArmas] = useState<StockArma[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  
  // Estados para Clientes
  const [clientes, setClientes] = useState<ClienteConVendedor[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConVendedor | null>(null);
  const [clientesAsignados, setClientesAsignados] = useState<ClienteConVendedor[]>([]);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>>({});
  
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
  
  // Estados para cargar contrato firmado
  const [mostrarCargarFirmado, setMostrarCargarFirmado] = useState<number | null>(null);
  const [archivoFirmado, setArchivoFirmado] = useState<File | null>(null);
  const [cargandoFirmado, setCargandoFirmado] = useState(false);

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
  
  // Función para cargar armas reasignadas
  const cargarArmasReasignadas = async () => {
    setLoadingArmasReasignadas(true);
    try {
      // TODO: Implementar endpoint para obtener armas reasignadas
      // const armas = await apiService.getArmasReasignadas();
      // setArmasReasignadas(armas);
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
      // TODO: Implementar endpoint para confirmar reasignación
      // await apiService.confirmarReasignacionCliente(modalClienteReasignado.arma.id, modalClienteReasignado.nuevoClienteId);
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
    console.log('🔄 JefeVentas - useEffect ejecutándose, vistaActual:', vistaActual);
    if (vistaActual === 'stock') {
      console.log('🔄 JefeVentas - Cargando stock de armas...');
      cargarStockArmas();
    } else if (vistaActual === 'clientes') {
      console.log('🔄 JefeVentas - Cargando clientes...');
      cargarClientes();
    } else if (vistaActual === 'clientes-asignados') {
      console.log('🔄 JefeVentas - Cargando clientes asignados...');
      cargarClientesAsignados();
    } else if (vistaActual === 'reasignar-armas') {
      console.log('🔄 JefeVentas - Cargando armas reasignadas...');
      cargarArmasReasignadas();
    }
  }, [vistaActual]);

  const cargarStockArmas = async () => {
    setLoadingStock(true);
    try {
      console.log('🔄 Cargando stock de armas...');
      const response = await apiService.getStockTodasArmas();
      console.log('✅ Stock cargado:', response);
      setStockArmas(response);
    } catch (error) {
      console.error('❌ Error cargando stock:', error);
      alert(`Error cargando el inventario de armas: ${error}`);
    } finally {
      setLoadingStock(false);
    }
  };

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      console.log('🔄 JefeVentas - Cargando TODOS los clientes del sistema...');
      console.log('🔄 JefeVentas - Llamando a apiService.getTodosClientes()');
      const response = await apiService.getTodosClientes();
      console.log('✅ JefeVentas - Clientes cargados:', response);
      console.log('✅ JefeVentas - Tipo de respuesta:', typeof response);
      console.log('✅ JefeVentas - Es array?', Array.isArray(response));
      if (Array.isArray(response) && response.length > 0) {
        console.log('✅ JefeVentas - Primer cliente:', response[0]);
        console.log('✅ JefeVentas - Vendedor del primer cliente:', response[0].vendedorNombre, response[0].vendedorApellidos);
      }
      setClientes(response);
    } catch (error) {
      console.error('❌ JefeVentas - Error cargando clientes:', error);
      alert(`Error cargando la lista de clientes: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

  const cargarClientesAsignados = async () => {
    setLoadingClientes(true);
    try {
      console.log('🔄 JefeVentas - Cargando clientes con armas asignadas...');
      const response = await apiService.getTodosClientes();
      console.log('✅ JefeVentas - Total clientes cargados:', response.length);
      
      // Cargar armas para cada cliente y filtrar solo los que tienen armas ASIGNADAS
      const weaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }> = {};
      const clientesConArmaAsignada: ClienteConVendedor[] = [];
      
      for (const client of response) {
        try {
          const armasResponse = await apiService.getArmasCliente(client.id);
          if (armasResponse && armasResponse.length > 0) {
            const arma = armasResponse[0]; // Tomar la primera arma
            weaponAssignments[client.id] = {
              weapon: {
                id: arma.armaId,
                nombre: arma.armaModelo || arma.armaNombre, // Usar modelo si está disponible
                modelo: arma.armaModelo || arma.armaNombre, // Nuevo campo
                marca: arma.armaMarca, // Nuevo campo
                alimentadora: arma.armaAlimentadora, // Nuevo campo
                calibre: arma.armaCalibre || 'N/A', // Corregido: usar armaCalibre, no armaModelo
                codigo: arma.armaCodigo,
                urlImagen: arma.armaImagen,
                precioReferencia: parseFloat(arma.precioUnitario) || 0
              },
              precio: parseFloat(arma.precioUnitario) || 0,
              cantidad: parseInt(arma.cantidad) || 1,
              numeroSerie: arma.numeroSerie,
              estado: arma.estado
            };
            
            // Solo agregar clientes con arma ASIGNADA
            if (arma.estado === 'ASIGNADA') {
              clientesConArmaAsignada.push(client);
            }
          }
        } catch (error) {
          console.warn(`No se pudieron cargar armas para cliente ${client.id}:`, error);
        }
      }
      
      console.log('✅ JefeVentas - Clientes con armas asignadas:', clientesConArmaAsignada.length);
      setClientesAsignados(clientesConArmaAsignada);
      setClientWeaponAssignments(weaponAssignments);
    } catch (error) {
      console.error('❌ JefeVentas - Error cargando clientes asignados:', error);
      alert(`Error cargando la lista de clientes asignados: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleVerDetalleCliente = async (cliente: ClienteConVendedor) => {
    setClienteSeleccionado(cliente);
    setLoadingDetalleCliente(true);
    
    try {
      // Cargar armas asignadas
      const armas = await apiService.getArmasCliente(Number(cliente.id));
      setArmasCliente(armas);
      console.log('🔫 Armas del cliente:', armas);
      
      // Cargar documentos
      const documentos = await apiService.getDocumentosCliente(Number(cliente.id));
      setDocumentosCliente(documentos);
      console.log('📄 Documentos del cliente:', documentos);
      
      // Cargar contratos
      const contratos = await apiService.getContratosCliente(Number(cliente.id));
      setContratosCliente(contratos);
      console.log('📋 Contratos del cliente:', contratos);
      
      // Cargar pagos y sus cuotas
      const pagos = await apiService.getPagosCliente(Number(cliente.id));
      
      // Para cada pago, cargar sus cuotas
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
          // Si es contado, crear una "cuota" única
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
      console.log('💰 Cuotas del cliente:', cuotasTemp);
      
    } catch (error) {
      console.error('Error cargando detalle del cliente:', error);
    } finally {
      setLoadingDetalleCliente(false);
    }
  };

  const handleCerrarDetalle = () => {
    setClienteSeleccionado(null);
    // Limpiar datos del detalle
    setArmasCliente([]);
    setDocumentosCliente([]);
    setContratosCliente([]);
    setPagosCliente([]);
  };

  // Handler para editar cliente (similar al de Vendedor)
  const handleEditarCliente = async (cliente: ClienteConVendedor) => {
    try {
      const clienteCompleto = await apiService.getCliente(parseInt(cliente.id));
      console.log('🔍 Cliente completo obtenido del backend:', clienteCompleto);
      
      // Obtener tipos de cliente para el mapeo
      const tiposClienteCompletos = await apiService.getClientTypes();
      
      // Mapear provincia: el backend devuelve código
      let provinciaMapeada = (clienteCompleto as any).provincia || '';
      // Si no es código, buscar en catálogo (lógica simplificada)
      if (provinciaMapeada && !provinciaMapeada.match(/^[0-9]+$/)) {
        // Es nombre, buscar código (en producción debería usar el catálogo completo)
        console.log('⚠️ Provincia recibida como nombre:', provinciaMapeada);
      }
      
      // Mapear tipoCliente: debe ser el NOMBRE para que coincida con el select
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
      
      // Cargar arma asignada si existe
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
      console.error('❌ Error obteniendo cliente completo:', error);
      alert('Error al cargar los datos del cliente para editar');
    }
  };

  // Handler para guardar cliente editado
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

  // Handler para cerrar formulario de edición
  const handleCloseForm = () => {
    setCurrentPage('clientes');
    setSelectedClient(null);
    setClientFormMode('view');
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  };

  // Handler para cambio de precio (wrapper para ClientForm)
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

  // Handler para cambio de cantidad (wrapper para ClientForm)
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

  // Handler para navegar a selección de armas (no se usa en edición, pero necesario para ClientForm)
  const handleNavigateToWeaponSelection = useCallback(() => {
    // En modo edición, no navegamos a selección de armas
    console.log('Navegación a selección de armas (no implementado en modo edición)');
  }, []);

  // Handler para confirmar datos del cliente (no se usa en edición, pero necesario para ClientForm)
  const handleClientDataConfirm = useCallback((_formData: any) => {
    // En modo edición, no se usa este handler
    console.log('Confirmación de datos (no implementado en modo edición)');
  }, []);

  // Handler para cliente bloqueado (no se usa en edición, pero necesario para ClientForm)
  const handleClienteBloqueado = useCallback((clientId: string, bloqueado: boolean, motivo: string) => {
    console.log('Cliente bloqueado:', { clientId, bloqueado, motivo });
    if (bloqueado && currentPage === 'clientForm') {
      handleCloseForm();
    }
  }, [currentPage]);

  // Handler para abrir modal de reasignar arma
  const handleAbrirModalReasignarArma = (cliente: ClienteConVendedor) => {
    setModalReasignarArma({ isOpen: true, cliente, isLoading: false });
  };

  // Handler para reasignar arma (usado en modal de reasignación)
  // @ts-ignore - Función usada en modal pero TypeScript no la detecta
  const handleReasignarArma = async (nuevoClienteId: number) => {
    if (!modalReasignarArma.cliente) return;
    
    setModalReasignarArma(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Obtener el clienteArmaId del cliente actual
      const armas = await apiService.getArmasCliente(Number(modalReasignarArma.cliente!.id));
      if (armas.length === 0) {
        alert('El cliente no tiene armas asignadas');
        return;
      }
      
      const clienteArmaId = armas[0].id;
      await apiService.reasignarArmaACliente(clienteArmaId, nuevoClienteId);
      
      alert('Arma reasignada exitosamente');
      setModalReasignarArma({ isOpen: false, cliente: null, isLoading: false });
      cargarClientes();
    } catch (error: any) {
      console.error('Error reasignando arma:', error);
      alert(`Error al reasignar arma: ${error.message || error}`);
    } finally {
      setModalReasignarArma(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handler para abrir modal de desistimiento
  const handleAbrirModalDesistimiento = (cliente: ClienteConVendedor) => {
    setModalDesistimiento({ isOpen: true, cliente, observacion: '', isLoading: false });
  };

  // Handler para confirmar desistimiento
  const handleConfirmarDesistimiento = async () => {
    if (!modalDesistimiento.cliente) {
      alert('❌ Error: No hay cliente seleccionado');
      return;
    }
    
    setModalDesistimiento(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('🔄 Cambiando estado a DESISTIMIENTO para cliente:', modalDesistimiento.cliente.id);
      console.log('📝 Observación:', modalDesistimiento.observacion);
      
      const response = await apiService.cambiarEstadoDesistimiento(
        Number(modalDesistimiento.cliente!.id),
        modalDesistimiento.observacion || '' // Asegurar que siempre se envíe un string
      );
      
      console.log('✅ Respuesta del servidor:', response);
      
      alert('✅ Estado del cliente actualizado a DESISTIMIENTO exitosamente');
      setModalDesistimiento({ isOpen: false, cliente: null, observacion: '', isLoading: false });
      
      // Recargar clientes para reflejar el cambio
      cargarClientes();
    } catch (error: any) {
      console.error('❌ Error cambiando estado a DESISTIMIENTO:', error);
      
      // Extraer mensaje de error más específico
      let errorMessage = 'Error desconocido al cambiar estado';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ Error al cambiar estado: ${errorMessage}`);
    } finally {
      setModalDesistimiento(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handler para abrir modal de editar arma
  const handleAbrirModalEditarArma = async (clienteArma: any) => {
    if (!clienteArma) return;
    
    try {
      // Cargar armas disponibles
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

  // Handler para confirmar edición de arma
  const handleConfirmarEditarArma = async () => {
    if (!modalEditarArma.clienteArma || !modalEditarArma.armaSeleccionada) {
      alert('❌ Por favor, selecciona una nueva arma');
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

      alert('✅ Arma actualizada exitosamente. Puedes generar un nuevo contrato si lo deseas.');
      
      // Cerrar modal
      setModalEditarArma({
        isOpen: false,
        clienteArma: null,
        armasDisponibles: [],
        armaSeleccionada: null,
        nuevoPrecio: '',
        isLoading: false
      });

      // Recargar armas del cliente
      if (clienteSeleccionado) {
        const armas = await apiService.getArmasCliente(Number(clienteSeleccionado.id));
        setArmasCliente(armas);
      }
    } catch (error: any) {
      console.error('Error actualizando arma:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error desconocido';
      alert(`❌ Error al actualizar arma: ${errorMessage}`);
    } finally {
      setModalEditarArma(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handler para abrir modal de generar contrato
  const handleAbrirModalGenerarContrato = async () => {
    console.log('🚀 handleAbrirModalGenerarContrato - INICIANDO');
    if (!clienteSeleccionado) {
      console.warn('⚠️ handleAbrirModalGenerarContrato - No hay cliente seleccionado');
      return;
    }
    
    console.log('🚀 handleAbrirModalGenerarContrato - Cliente ID:', clienteSeleccionado.id);
    setModalGenerarContrato({ isOpen: true, datosContrato: null, isLoading: true });
    
    try {
      console.log('🚀 handleAbrirModalGenerarContrato - Llamando a obtenerDatosContrato...');
      const datos = await apiService.obtenerDatosContrato(Number(clienteSeleccionado.id));
      console.log('📋 Datos del contrato recibidos:', datos);
      console.log('📋 documentosCompletos:', datos?.documentosCompletos);
      console.log('📋 emailVerificado:', datos?.cliente?.emailVerificado);
      console.log('📋 Tipo de documentosCompletos:', typeof datos?.documentosCompletos);
      console.log('📋 Tipo de emailVerificado:', typeof datos?.cliente?.emailVerificado);
      setModalGenerarContrato({ isOpen: true, datosContrato: datos, isLoading: false });
    } catch (error) {
      console.error('❌ Error obteniendo datos del contrato:', error);
      alert('Error al obtener datos del contrato. Por favor, intente nuevamente.');
      setModalGenerarContrato({ isOpen: false, datosContrato: null, isLoading: false });
    }
  };

  // useEffect para loguear cuando cambien los datos del contrato
  useEffect(() => {
    if (modalGenerarContrato.datosContrato) {
      const emailVerificado = modalGenerarContrato.datosContrato?.cliente?.emailVerificado === true;
      const documentosCompletos = modalGenerarContrato.datosContrato?.documentosCompletos === true;
      const isDisabled = modalGenerarContrato.isLoading || !emailVerificado || !documentosCompletos;
      
      console.log('🔍 useEffect - Estado del botón generar contrato:', {
        isLoading: modalGenerarContrato.isLoading,
        emailVerificado,
        documentosCompletos,
        isDisabled,
        datosCompletosRaw: modalGenerarContrato.datosContrato?.documentosCompletos,
        emailVerificadoRaw: modalGenerarContrato.datosContrato?.cliente?.emailVerificado,
        tipoDocumentosCompletos: typeof modalGenerarContrato.datosContrato?.documentosCompletos,
        tipoEmailVerificado: typeof modalGenerarContrato.datosContrato?.cliente?.emailVerificado
      });
    }
  }, [modalGenerarContrato.datosContrato, modalGenerarContrato.isLoading]);

  // Handler para generar contrato
  const handleGenerarContrato = async () => {
    if (!clienteSeleccionado) return;
    
    setModalGenerarContrato(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await apiService.generarContrato(Number(clienteSeleccionado.id));
      
      if (response.success) {
        alert('✅ Contrato generado exitosamente');
        // Recargar contratos del cliente
        const contratos = await apiService.getContratosCliente(Number(clienteSeleccionado.id));
        setContratosCliente(contratos);
        // Cerrar modal
        setModalGenerarContrato({ isOpen: false, datosContrato: null, isLoading: false });
      } else {
        alert('Error al generar contrato: ' + (response.message || 'Error desconocido'));
        setModalGenerarContrato(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error: any) {
      console.error('Error generando contrato:', error);
      alert('Error al generar contrato: ' + (error.message || 'Error desconocido'));
      setModalGenerarContrato(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Panel de Jefe de Ventas"
        subtitle="Gestión de inventario, clientes e importaciones"
      />
      
      <div className="max-w-7xl mx-auto p-6">

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
          
          {/* Pestaña de Reasignar Armas */}
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
          
          {/* Pestaña de Asignación de Series - Solo para SALES_CHIEF y FINANCE */}
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
          
          {/* Pestaña de Armas - Para Jefe de Ventas */}
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
          
          {/* Pestaña de Categorías - Para Jefe de Ventas */}
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
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Inventario de Armas en Stock</h2>
              <button
                onClick={cargarStockArmas}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Actualizar
              </button>
            </div>

            {loadingStock ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Cargando inventario...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Arma</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Calibre</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Disponible</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Reservadas</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Asignadas</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Precio Venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockArmas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                          No hay armas en stock
                        </td>
                      </tr>
                    ) : (
                      stockArmas.map((stock) => {
                        const reservadas = stock.cantidadTotal - stock.cantidadDisponible;
                        const porcentajeDisponible = (stock.cantidadDisponible / stock.cantidadTotal) * 100;
                        
                        return (
                          <tr key={stock.armaId} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{stock.armaModelo || stock.armaNombre || 'Sin modelo'}</td>
                            <td className="px-4 py-3 text-sm">{stock.armaCalibre}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-bold rounded-full">
                                {stock.cantidadTotal}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                                porcentajeDisponible > 50 ? 'bg-green-100 text-green-800' :
                                porcentajeDisponible > 20 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {stock.cantidadDisponible}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                                {reservadas}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-full">
                                {stock.cantidadAsignada || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold">
                              ${stock.precioVenta.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {stockArmas.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={2} className="px-4 py-3 text-sm">TOTALES</td>
                        <td className="px-4 py-3 text-center text-sm">
                          {stockArmas.reduce((sum, s) => sum + s.cantidadTotal, 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {stockArmas.reduce((sum, s) => sum + s.cantidadDisponible, 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {stockArmas.reduce((sum, s) => sum + (s.cantidadTotal - s.cantidadDisponible), 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {stockArmas.reduce((sum, s) => sum + (s.cantidadAsignada || 0), 0)}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contenido: Todos los Clientes */}
        {vistaActual === 'clientes' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Todos los Clientes del Sistema</h2>
                <p className="text-sm text-gray-600 mt-1">Todos los clientes creados por los vendedores</p>
              </div>
              <div className="flex space-x-2">
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
                <button
                  onClick={cargarClientes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔄 Actualizar
                </button>
                {Object.keys(filtersClientes).length > 0 && (
                  <button
                    onClick={clearFiltersClientes}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
                    title="Limpiar filtros"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-xs">Limpiar filtros</span>
                  </button>
                )}
              </div>
            </div>

            {loadingClientes ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Cargando clientes...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <TableHeaderWithFilters
                        column="numeroIdentificacion"
                        label="CI/RUC"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        filterValue={filtersClientes.numeroIdentificacion || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="nombres"
                        label="Cliente"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        filterValue={filtersClientes.nombres || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="tipoClienteNombre"
                        label="Tipo"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        filterValue={filtersClientes.tipoClienteNombre || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="vendedorNombre"
                        label="Vendedor"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        filterValue={filtersClientes.vendedorNombre || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="email"
                        label="Email"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        filterValue={filtersClientes.email || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="estado"
                        label="Estado"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        align="center"
                        filterValue={filtersClientes.estado || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="estadoPago"
                        label="Estado de Pago"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        align="center"
                        filterValue={filtersClientes.estadoPago || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="emailVerificado"
                        label="Validado por Cliente"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        align="center"
                        filterValue={filtersClientes.emailVerificado !== undefined ? String(filtersClientes.emailVerificado) : ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="grupoImportacionNombre"
                        label="Grupo de Importación"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        align="center"
                        filterValue={filtersClientes.grupoImportacionNombre || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="licenciaNombre"
                        label="Licencia"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        align="center"
                        filterValue={filtersClientes.licenciaNombre || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <TableHeaderWithFilters
                        column="fechaCreacion"
                        label="Fecha"
                        sortKey={sortConfigClientes.key}
                        sortDirection={sortConfigClientes.direction}
                        onSort={handleSortClientes}
                        align="center"
                        filterValue={filtersClientes.fechaCreacion || ''}
                        onFilterChange={setFilterClientes}
                      />
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                          No hay clientes registrados
                        </td>
                      </tr>
                    ) : (
                      clientesFiltrados.map((cliente) => (
                        <tr key={cliente.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono">{cliente.numeroIdentificacion}</td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {cliente.nombres} {cliente.apellidos}
                          </td>
                          <td className="px-4 py-3 text-sm">{cliente.tipoClienteNombre}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-blue-600 font-bold text-xs">
                                  {cliente.vendedorNombre?.charAt(0)}{cliente.vendedorApellidos?.charAt(0)}
                                </span>
                              </div>
                              <span>{cliente.vendedorNombre} {cliente.vendedorApellidos}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{cliente.email}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              cliente.estado === 'LISTO_IMPORTACION' ? 'bg-green-100 text-green-800' :
                              cliente.estado === 'BLOQUEADO' ? 'bg-red-100 text-red-800' :
                              cliente.estado === 'PENDIENTE_DOCUMENTOS' ? 'bg-yellow-100 text-yellow-800' :
                              cliente.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                              cliente.estado?.includes('INHABILITADO') ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {cliente.estado === 'PENDIENTE_DOCUMENTOS' ? 'Faltan documentos' :
                               cliente.estado === 'LISTO_IMPORTACION' ? 'Listo para importación' :
                               cliente.estado === 'EN_PROCESO' ? 'En proceso' :
                               cliente.estado === 'BLOQUEADO' ? 'Bloqueado' :
                               cliente.estado || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              cliente.estadoPago === 'PAGO_COMPLETO' ? 'bg-green-100 text-green-800' :
                              cliente.estadoPago === 'ABONADO' ? 'bg-yellow-100 text-yellow-800' :
                              cliente.estadoPago === 'IMPAGO' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {cliente.estadoPago || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              cliente.emailVerificado === true ? 'bg-green-100 text-green-800' :
                              cliente.emailVerificado === false ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {cliente.emailVerificado === true ? 'Validado' :
                               cliente.emailVerificado === false ? 'Datos incorrectos' :
                               'Pendiente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {cliente.grupoImportacionNombre ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {cliente.grupoImportacionNombre}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Sin asignar</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {cliente.licenciaNombre ? (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                {cliente.licenciaNombre}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Sin licencia</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {cliente.fechaCreacion ? new Date(cliente.fechaCreacion).toLocaleDateString('es-ES') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleVerDetalleCliente(cliente)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Ver Detalle
                              </button>
                              <button
                                onClick={() => handleEditarCliente(cliente)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleAbrirModalReasignarArma(cliente)}
                                className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                Reasignar Arma
                              </button>
                              <button
                                onClick={() => handleAbrirModalDesistimiento(cliente)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Desistimiento
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contenido: Clientes con Serie Asignada */}
        {vistaActual === 'clientes-asignados' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">✅ Clientes con Armas Asignadas</h2>
                <p className="text-sm text-gray-600 mt-1">Supervisión de clientes con número de serie asignado</p>
              </div>
              <div className="flex items-center space-x-3">
                {Object.keys(filtersAsignados).length > 0 && (
                  <button
                    onClick={clearFiltersAsignados}
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
                  onClick={cargarClientesAsignados}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  🔄 Actualizar
                </button>
              </div>
            </div>

            {loadingClientes ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600">Cargando clientes asignados...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <TableHeaderWithFilters
                        column="numeroIdentificacion"
                        label="CI/RUC"
                        sortKey={sortConfigAsignados.key}
                        sortDirection={sortConfigAsignados.direction}
                        onSort={handleSortAsignados}
                        filterValue={filtersAsignados.numeroIdentificacion || ''}
                        onFilterChange={setFilterAsignados}
                      />
                      <TableHeaderWithFilters
                        column="nombres"
                        label="Cliente"
                        sortKey={sortConfigAsignados.key}
                        sortDirection={sortConfigAsignados.direction}
                        onSort={handleSortAsignados}
                        filterValue={filtersAsignados.nombres || ''}
                        onFilterChange={setFilterAsignados}
                      />
                      <TableHeaderWithFilters
                        column="tipoClienteNombre"
                        label="Tipo"
                        sortKey={sortConfigAsignados.key}
                        sortDirection={sortConfigAsignados.direction}
                        onSort={handleSortAsignados}
                        filterValue={filtersAsignados.tipoClienteNombre || ''}
                        onFilterChange={setFilterAsignados}
                      />
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Arma Asignada</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Serie</th>
                      <TableHeaderWithFilters
                        column="vendedorNombre"
                        label="Vendedor"
                        sortKey={sortConfigAsignados.key}
                        sortDirection={sortConfigAsignados.direction}
                        onSort={handleSortAsignados}
                        filterValue={filtersAsignados.vendedorNombre || ''}
                        onFilterChange={setFilterAsignados}
                      />
                      <TableHeaderWithFilters
                        column="fechaCreacion"
                        label="Fecha"
                        sortKey={sortConfigAsignados.key}
                        sortDirection={sortConfigAsignados.direction}
                        onSort={handleSortAsignados}
                        align="center"
                        filterValue={filtersAsignados.fechaCreacion || ''}
                        onFilterChange={setFilterAsignados}
                      />
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesAsignadosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">
                              No hay clientes con armas asignadas
                            </p>
                            <p className="text-gray-400 text-sm mt-2">Los clientes aparecerán aquí cuando se les asigne un número de serie</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      clientesAsignadosFiltrados.map((cliente) => {
                        const weaponAssignment = clientWeaponAssignments[cliente.id];
                        return (
                          <tr key={cliente.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono">{cliente.numeroIdentificacion}</td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {cliente.nombres} {cliente.apellidos}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (cliente.tipoClienteNombre || cliente.tipoProcesoNombre) === 'Cupo Civil' ? 'bg-blue-100 text-blue-800' :
                                (cliente.tipoClienteNombre || cliente.tipoProcesoNombre) === 'Extracupo Uniformado' ? 'bg-orange-100 text-orange-800' :
                                (cliente.tipoClienteNombre || cliente.tipoProcesoNombre) === 'Extracupo Empresa' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {cliente.tipoClienteNombre || cliente.tipoProcesoNombre}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {weaponAssignment ? (
                                <div>
                                  <div className="font-medium">{weaponAssignment.weapon.modelo || weaponAssignment.weapon.nombre || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{weaponAssignment.weapon.calibre}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {weaponAssignment?.numeroSerie ? (
                                <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                                  {weaponAssignment.numeroSerie}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-green-600 font-bold text-xs">
                                    {cliente.vendedorNombre?.charAt(0)}{cliente.vendedorApellidos?.charAt(0)}
                                  </span>
                                </div>
                                <span>{cliente.vendedorNombre} {cliente.vendedorApellidos}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {cliente.fechaCreacion ? new Date(cliente.fechaCreacion).toLocaleDateString('es-EC') : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleVerDetalleCliente(cliente)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center space-x-2 mx-auto"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Ver Detalle</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalle de Cliente */}
        {clienteSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
                    </h2>
                    <p className="text-gray-600">CI: {clienteSeleccionado.numeroIdentificacion}</p>
                  </div>
                  <button
                    onClick={handleCerrarDetalle}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Datos Personales */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Datos Personales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Cliente</p>
                      <p className="font-medium">{clienteSeleccionado.tipoClienteNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{clienteSeleccionado.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">{clienteSeleccionado.telefonoPrincipal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="font-medium">{clienteSeleccionado.direccion || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vendedor Responsable</p>
                      <p className="font-medium text-blue-600">
                        {clienteSeleccionado.vendedorNombre} {clienteSeleccionado.vendedorApellidos}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        clienteSeleccionado.estado === 'LISTO_IMPORTACION' ? 'bg-green-100 text-green-800' :
                        clienteSeleccionado.estado === 'BLOQUEADO' ? 'bg-red-100 text-red-800' :
                        clienteSeleccionado.estado === 'PENDIENTE_DOCUMENTOS' ? 'bg-yellow-100 text-yellow-800' :
                        clienteSeleccionado.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                        clienteSeleccionado.estado?.includes('INHABILITADO') ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {clienteSeleccionado.estado === 'PENDIENTE_DOCUMENTOS' ? 'Faltan documentos' :
                         clienteSeleccionado.estado === 'LISTO_IMPORTACION' ? 'Listo para importación' :
                         clienteSeleccionado.estado === 'EN_PROCESO' ? 'En proceso' :
                         clienteSeleccionado.estado === 'BLOQUEADO' ? 'Bloqueado' :
                         clienteSeleccionado.estado || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Validado por Cliente</p>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        clienteSeleccionado.emailVerificado === true ? 'bg-green-100 text-green-800' :
                        clienteSeleccionado.emailVerificado === false ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {clienteSeleccionado.emailVerificado === true ? 'Validado' :
                         clienteSeleccionado.emailVerificado === false ? 'Datos incorrectos' :
                         'Pendiente'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Grupo de Importación</p>
                      <p className="font-medium text-blue-600">{clienteSeleccionado.grupoImportacionNombre || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Licencia</p>
                      {clienteSeleccionado.licenciaNombre ? (
                        <div>
                          <p className="font-medium text-purple-600">{clienteSeleccionado.licenciaNombre}</p>
                          {clienteSeleccionado.licenciaNumero && (
                            <p className="text-xs text-gray-500">Número: {clienteSeleccionado.licenciaNumero}</p>
                          )}
                        </div>
                      ) : (
                        <p className="font-medium text-gray-400">N/A</p>
                      )}
                    </div>
                  </div>
                </div>

                {loadingDetalleCliente ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Cargando información completa...</p>
                  </div>
                ) : (
                  <>
                    {/* Armas Asignadas */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Armas Asignadas ({armasCliente.length})
                      </h3>
                      {armasCliente.length === 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                          No hay armas asignadas
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          {armasCliente.map((arma, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div>
                                  <p className="text-sm text-gray-600">Arma</p>
                                  <p className="font-semibold text-blue-600">{arma.armaModelo || arma.armaNombre || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Número de Serie</p>
                                  <p className="font-mono font-semibold">{arma.numeroSerie || 'Sin asignar'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Cantidad</p>
                                  <p className="font-medium">{arma.cantidad || 1}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Precio Unitario</p>
                                  <p className="font-medium">${arma.precioUnitario?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="flex items-end">
                                  {arma.estado !== 'ASIGNADA' && arma.estado !== 'COMPLETADA' ? (
                                    <button
                                      onClick={() => handleAbrirModalEditarArma(arma)}
                                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                      title="Editar arma asignada"
                                    >
                                      Editar Arma
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-500">No editable</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Documentos */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Documentos ({documentosCliente.length})
                      </h3>
                      {documentosCliente.length === 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                          No hay documentos subidos
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {documentosCliente.map((doc, index) => (
                              <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                  <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{doc.tipoDocumentoNombre || 'Documento'}</p>
                                    <p className="text-xs text-gray-500">{doc.nombreArchivo || 'archivo.pdf'}</p>
                                    {doc.descripcion && (
                                      <p className="text-xs text-gray-400 mt-1">{doc.descripcion}</p>
                                    )}
                                  </div>
                                </div>
                                {doc.id && (
                                  <div className="flex space-x-2 ml-3">
                                    <button
                                      onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve/${doc.id}`, '_blank')}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex items-center"
                                      title="Ver documento"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      Ver
                                    </button>
                                    <button
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve/${doc.id}`;
                                        link.download = doc.nombreArchivo || 'documento.pdf';
                                        link.click();
                                      }}
                                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs flex items-center"
                                      title="Descargar documento"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Descargar
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contratos */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Contratos Generados ({contratosCliente.length})
                      </h3>
                      {contratosCliente.length === 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                          No hay contratos generados
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          {contratosCliente.map((contrato, index) => {
                            const handleCargarContratoFirmado = async () => {
                              if (!archivoFirmado || !clienteSeleccionado) return;
                              
                              setCargandoFirmado(true);
                              try {
                                await apiService.cargarContratoFirmado(Number(clienteSeleccionado.id), archivoFirmado);
                                alert('✅ Contrato firmado cargado exitosamente');
                                // Recargar contratos
                                const contratos = await apiService.getContratosCliente(Number(clienteSeleccionado.id));
                                setContratosCliente(contratos);
                                setMostrarCargarFirmado(null);
                                setArchivoFirmado(null);
                              } catch (error: any) {
                                console.error('Error cargando contrato firmado:', error);
                                alert('Error al cargar contrato firmado: ' + (error.message || 'Error desconocido'));
                              } finally {
                                setCargandoFirmado(false);
                              }
                            };
                            
                            return (
                              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <p className="font-semibold text-blue-600">{contrato.nombreArchivo || 'Contrato de Compra-Venta'}</p>
                                    {contrato.fechaCreacion && (
                                      <p className="text-sm text-gray-600">Fecha: {new Date(contrato.fechaCreacion).toLocaleDateString('es-ES')}</p>
                                    )}
                                    {contrato.descripcion && (
                                      <p className="text-sm text-gray-500 mt-1">{contrato.descripcion}</p>
                                    )}
                                    {contrato.estado === 'FIRMADO' && (
                                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        ✅ Firmado
                                      </span>
                                    )}
                                  </div>
                                  {contrato.id && (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve-generated/${contrato.id}`, '_blank')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Ver PDF
                                      </button>
                                      <button
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve-generated/${contrato.id}`;
                                          link.download = contrato.nombreArchivo || 'contrato.pdf';
                                          link.click();
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Descargar
                                      </button>
                                      {contrato.estado !== 'FIRMADO' && (
                                        <button
                                          onClick={() => setMostrarCargarFirmado(mostrarCargarFirmado === contrato.id ? null : contrato.id)}
                                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center"
                                        >
                                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                          </svg>
                                          Cargar Firmado
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Formulario para cargar contrato firmado */}
                                {mostrarCargarFirmado === contrato.id && (
                                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Seleccionar Contrato Firmado (PDF)
                                    </label>
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setArchivoFirmado(file);
                                        }
                                      }}
                                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                                    />
                                    {archivoFirmado && (
                                      <div className="mt-3 flex justify-end space-x-2">
                                        <button
                                          onClick={() => {
                                            setMostrarCargarFirmado(null);
                                            setArchivoFirmado(null);
                                          }}
                                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                          disabled={cargandoFirmado}
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={handleCargarContratoFirmado}
                                          disabled={cargandoFirmado}
                                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center disabled:opacity-50"
                                        >
                                          {cargandoFirmado ? (
                                            <>
                                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                              Cargando...
                                            </>
                                          ) : (
                                            'Cargar Contrato Firmado'
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Plan de Pagos */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Plan de Pagos ({pagosCliente.length} cuotas)
                      </h3>
                      {pagosCliente.length === 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                          No hay plan de pagos registrado
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-200">
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Cuota</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Monto</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Fecha Vencimiento</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {pagosCliente.map((pago, index) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2 text-sm">Cuota #{pago.numeroCuota || index + 1}</td>
                                    <td className="px-3 py-2 text-sm font-semibold">${pago.monto?.toFixed(2) || '0.00'}</td>
                                    <td className="px-3 py-2 text-sm">{pago.fechaVencimiento ? new Date(pago.fechaVencimiento).toLocaleDateString('es-ES') : 'N/A'}</td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        pago.estado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                                        pago.estado === 'VENCIDO' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {pago.estado || 'PENDIENTE'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  {/* Botón Generar Contrato - Solo para JEFE DE VENTAS */}
                  {user?.roles?.some(role => {
                    const codigo = role.rol?.codigo || (role as any).codigo;
                    return codigo === 'SALES_CHIEF';
                  }) && (
                    <button
                      onClick={(e) => {
                        console.log('🟢 CLICK EN BOTÓN GENERAR CONTRATO - Handler ejecutándose');
                        e.preventDefault();
                        e.stopPropagation();
                        handleAbrirModalGenerarContrato();
                      }}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generar Contrato
                    </button>
                  )}
                  <button
                    onClick={handleCerrarDetalle}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Generar Contrato */}
        {modalGenerarContrato.isOpen && (() => {
          console.log('🟡 MODAL RENDERIZÁNDOSE - Estado:', {
            isOpen: modalGenerarContrato.isOpen,
            isLoading: modalGenerarContrato.isLoading,
            tieneDatosContrato: !!modalGenerarContrato.datosContrato,
            datosContrato: modalGenerarContrato.datosContrato
          });
          return null;
        })()}
        {modalGenerarContrato.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Generar Contrato</h2>
                  <button
                    onClick={() => setModalGenerarContrato({ isOpen: false, datosContrato: null, isLoading: false })}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {modalGenerarContrato.isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="mt-4 text-gray-600">Cargando datos del contrato...</p>
                  </div>
                ) : modalGenerarContrato.datosContrato ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Cliente</h3>
                      <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Nombres</p>
                          <p className="font-medium">{modalGenerarContrato.datosContrato.cliente?.nombres || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Apellidos</p>
                          <p className="font-medium">{modalGenerarContrato.datosContrato.cliente?.apellidos || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Número de Identificación</p>
                          <p className="font-medium">{modalGenerarContrato.datosContrato.cliente?.numeroIdentificacion || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{modalGenerarContrato.datosContrato.cliente?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Teléfono</p>
                          <p className="font-medium">{modalGenerarContrato.datosContrato.cliente?.telefonoPrincipal || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Dirección</p>
                          <p className="font-medium">{modalGenerarContrato.datosContrato.cliente?.direccion || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {modalGenerarContrato.datosContrato.pago && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Pago</h3>
                        <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Monto Total</p>
                            <p className="font-medium">${parseFloat(modalGenerarContrato.datosContrato.pago.montoTotal || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Tipo de Pago</p>
                            <p className="font-medium">{modalGenerarContrato.datosContrato.pago.tipoPago || 'N/A'}</p>
                          </div>
                          {modalGenerarContrato.datosContrato.pago.numeroCuotas && (
                            <div>
                              <p className="text-sm text-gray-600">Número de Cuotas</p>
                              <p className="font-medium">{modalGenerarContrato.datosContrato.pago.numeroCuotas}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {modalGenerarContrato.datosContrato.armas && modalGenerarContrato.datosContrato.armas.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Armas Asignadas</h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          {modalGenerarContrato.datosContrato.armas.map((arma: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="font-medium">{arma.modelo || arma.nombre || 'N/A'}</p>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Cantidad:</span> {arma.cantidad || 1}
                                </div>
                                <div>
                                  <span className="text-gray-600">Precio Unitario:</span> ${parseFloat(arma.precioUnitario || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setModalGenerarContrato({ isOpen: false, datosContrato: null, isLoading: false })}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        disabled={modalGenerarContrato.isLoading}
                      >
                        Cancelar
                      </button>
                      {(() => {
                        const emailVerificado = modalGenerarContrato.datosContrato?.cliente?.emailVerificado === true;
                        const documentosCompletos = modalGenerarContrato.datosContrato?.documentosCompletos === true;
                        const isDisabled = modalGenerarContrato.isLoading || !emailVerificado || !documentosCompletos;
                        
                        // Log directo en el render para debug
                        console.log('🔴 RENDER BOTÓN - Estado actual:', {
                          isLoading: modalGenerarContrato.isLoading,
                          emailVerificado,
                          documentosCompletos,
                          isDisabled,
                          datosCompletosRaw: modalGenerarContrato.datosContrato?.documentosCompletos,
                          emailVerificadoRaw: modalGenerarContrato.datosContrato?.cliente?.emailVerificado,
                          tieneDatosContrato: !!modalGenerarContrato.datosContrato,
                          datosContratoCompleto: modalGenerarContrato.datosContrato
                        });
                        
                        return (
                          <button
                            onClick={handleGenerarContrato}
                            disabled={isDisabled}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            title={
                              modalGenerarContrato.isLoading 
                                ? 'Cargando...'
                                : !emailVerificado
                                ? 'Email no validado'
                                : !documentosCompletos
                                ? 'Documentos incompletos'
                                : 'Generar contrato'
                            }
                          >
                        {modalGenerarContrato.isLoading ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generando...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generar Contrato
                          </>
                        )}
                          </button>
                        );
                      })()}
                    </div>
                    {(!(modalGenerarContrato.datosContrato?.cliente?.emailVerificado === true) || 
                      !(modalGenerarContrato.datosContrato?.documentosCompletos === true)) && (
                      <div className="mt-4 space-y-2">
                        {!(modalGenerarContrato.datosContrato?.cliente?.emailVerificado === true) && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                              ⚠️ El cliente no tiene su email validado. Debe validar los datos personales del cliente primero.
                            </p>
                          </div>
                        )}
                        {!(modalGenerarContrato.datosContrato?.documentosCompletos === true) && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                              ⚠️ El cliente no tiene todos sus documentos obligatorios cargados. Debe completar todos los documentos antes de generar el contrato.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No se pudieron cargar los datos del contrato.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contenido: Importaciones */}
        {vistaActual === 'importaciones' && (
          <ImportGroupManagement />
        )}

        {/* Contenido: Reasignar Armas */}
        {vistaActual === 'reasignar-armas' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">🔄 Reasignar Armas</h2>
                <p className="text-sm text-gray-600 mt-1">Armas con estado REASIGNADO esperando asignación a nuevo cliente</p>
              </div>
              <button
                onClick={cargarArmasReasignadas}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔄 Actualizar
              </button>
            </div>

            {loadingArmasReasignadas ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600">Cargando armas reasignadas...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Arma</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Categoría</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Cliente Anterior</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Precio</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Cantidad</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Número de Serie</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {armasReasignadas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">
                              No hay armas reasignadas
                            </p>
                            <p className="text-gray-400 text-sm mt-2">Las armas reasignadas aparecerán aquí</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      armasReasignadas.map((arma) => (
                        <tr key={arma.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <div className="font-medium">{arma.armaModelo || arma.armaNombre || 'N/A'}</div>
                              {arma.armaCalibre && (
                                <div className="text-xs text-gray-500">Calibre: {arma.armaCalibre}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{arma.armaCategoriaNombre || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <div className="font-medium">{arma.clienteNombre || 'N/A'}</div>
                              <div className="text-xs text-gray-500">ID: {arma.clienteId}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">${arma.precioUnitario?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-3 text-center text-sm">{arma.cantidad || 1}</td>
                          <td className="px-4 py-3 text-sm font-mono">{arma.numeroSerie || 'Sin serie'}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleAbrirModalClienteReasignado(arma)}
                              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Cliente Reasignado
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
        {modalReasignarArma.isOpen && modalReasignarArma.cliente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Reasignar Arma</h2>
                <button
                  onClick={() => setModalReasignarArma({ isOpen: false, cliente: null, isLoading: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Cliente actual: {modalReasignarArma.cliente.nombres} {modalReasignarArma.cliente.apellidos}
              </p>
              <p className="text-gray-600 mb-4">
                Esta funcionalidad requiere seleccionar un nuevo cliente. Por favor, use la pestaña "REASIGNAR ARMAS" para esta operación.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalReasignarArma({ isOpen: false, cliente: null, isLoading: false })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Editar Arma */}
        {modalEditarArma.isOpen && modalEditarArma.clienteArma && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Editar Arma Asignada</h2>
                <button
                  onClick={() => setModalEditarArma({
                    isOpen: false,
                    clienteArma: null,
                    armasDisponibles: [],
                    armaSeleccionada: null,
                    nuevoPrecio: '',
                    isLoading: false
                  })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Arma Actual</p>
                <p className="font-semibold text-blue-600">{modalEditarArma.clienteArma.armaModelo || modalEditarArma.clienteArma.armaNombre || 'N/A'}</p>
                <p className="text-sm text-gray-600 mt-2">Precio Actual</p>
                <p className="font-medium">${modalEditarArma.clienteArma.precioUnitario?.toFixed(2) || '0.00'}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Nueva Arma *
                </label>
                <select
                  value={modalEditarArma.armaSeleccionada?.id || ''}
                  onChange={(e) => {
                    const armaSeleccionada = modalEditarArma.armasDisponibles.find(
                      a => a.id.toString() === e.target.value
                    );
                    setModalEditarArma(prev => ({
                      ...prev,
                      armaSeleccionada,
                      nuevoPrecio: armaSeleccionada?.precioReferencia?.toString() || ''
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona una arma...</option>
                  {modalEditarArma.armasDisponibles.map((arma: any) => (
                    <option key={arma.id} value={arma.id}>
                      {arma.modelo || arma.nombre || 'N/A'} - ${arma.precioReferencia?.toFixed(2) || '0.00'}
                    </option>
                  ))}
                </select>
              </div>

              {modalEditarArma.armaSeleccionada && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevo Precio Unitario (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={modalEditarArma.nuevoPrecio}
                    onChange={(e) => setModalEditarArma(prev => ({ ...prev, nuevoPrecio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio de referencia: ${modalEditarArma.armaSeleccionada.precioReferencia?.toFixed(2) || '0.00'}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setModalEditarArma({
                    isOpen: false,
                    clienteArma: null,
                    armasDisponibles: [],
                    armaSeleccionada: null,
                    nuevoPrecio: '',
                    isLoading: false
                  })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  disabled={modalEditarArma.isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarEditarArma}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={modalEditarArma.isLoading || !modalEditarArma.armaSeleccionada}
                >
                  {modalEditarArma.isLoading ? 'Procesando...' : 'Confirmar Cambio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Desistimiento */}
        {modalDesistimiento.isOpen && modalDesistimiento.cliente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Cambiar Estado a DESISTIMIENTO</h2>
                <button
                  onClick={() => setModalDesistimiento({ isOpen: false, cliente: null, observacion: '', isLoading: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Cliente: {modalDesistimiento.cliente.nombres} {modalDesistimiento.cliente.apellidos}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observación (opcional)
                </label>
                <textarea
                  value={modalDesistimiento.observacion}
                  onChange={(e) => setModalDesistimiento(prev => ({ ...prev, observacion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={4}
                  placeholder="Ingrese la observación del desistimiento..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalDesistimiento({ isOpen: false, cliente: null, observacion: '', isLoading: false })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  disabled={modalDesistimiento.isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarDesistimiento}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={modalDesistimiento.isLoading}
                >
                  {modalDesistimiento.isLoading ? 'Procesando...' : 'Confirmar Desistimiento'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cliente Reasignado */}
        {modalClienteReasignado.isOpen && modalClienteReasignado.arma && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Asignar Arma a Nuevo Cliente</h2>
                <button
                  onClick={() => setModalClienteReasignado({ isOpen: false, arma: null, nuevoClienteId: null, isLoading: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Información del Arma</h3>
                <p className="text-sm text-gray-600"><strong>Arma:</strong> {modalClienteReasignado.arma.armaModelo || modalClienteReasignado.arma.armaNombre || 'N/A'}</p>
                {modalClienteReasignado.arma.armaCalibre && (
                  <p className="text-sm text-gray-600"><strong>Calibre:</strong> {modalClienteReasignado.arma.armaCalibre}</p>
                )}
                <p className="text-sm text-gray-600"><strong>Cliente Anterior:</strong> {modalClienteReasignado.arma.clienteNombre}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Nuevo Cliente *
                </label>
                <select
                  value={modalClienteReasignado.nuevoClienteId || ''}
                  onChange={(e) => setModalClienteReasignado(prev => ({ ...prev, nuevoClienteId: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">-- Seleccione un cliente --</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombres} {cliente.apellidos} - {cliente.numeroIdentificacion}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ El cliente seleccionado debe tener todos sus documentos aprobados para poder recibir el arma.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalClienteReasignado({ isOpen: false, arma: null, nuevoClienteId: null, isLoading: false })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  disabled={modalClienteReasignado.isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarClienteReasignado}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  disabled={modalClienteReasignado.isLoading || !modalClienteReasignado.nuevoClienteId}
                >
                  {modalClienteReasignado.isLoading ? 'Procesando...' : 'Confirmar Reasignación'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JefeVentas;
