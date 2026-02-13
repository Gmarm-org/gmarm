import { useState } from 'react';
import type { StockArma, ClienteConVendedor } from '../types';

export type VistaActual = 'clientes' | 'clientes-asignados' | 'stock' | 'importaciones' | 'gestion-importaciones' | 'series' | 'reasignar-armas' | 'armas' | 'categorias';

export function useJefeVentasState() {
  const [vistaActual, setVistaActual] = useState<VistaActual>('clientes');

  // Stock de Armas
  const [stockArmas, setStockArmas] = useState<StockArma[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Clientes
  const [clientes, setClientes] = useState<ClienteConVendedor[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConVendedor | null>(null);
  const [clientesAsignados, setClientesAsignados] = useState<ClienteConVendedor[]>([]);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>>({});

  // Autorizaciones
  const [autorizaciones, setAutorizaciones] = useState<Record<string, any[]>>({});

  // Detalle completo del cliente
  const [armasCliente, setArmasCliente] = useState<any[]>([]);
  const [documentosCliente, setDocumentosCliente] = useState<any[]>([]);
  const [contratosCliente, setContratosCliente] = useState<any[]>([]);
  const [pagosCliente, setPagosCliente] = useState<any[]>([]);
  const [loadingDetalleCliente, setLoadingDetalleCliente] = useState(false);

  // Modal de generar contrato
  const [modalGenerarContrato, setModalGenerarContrato] = useState<{ isOpen: boolean; datosContrato: any | null; isLoading: boolean }>({
    isOpen: false,
    datosContrato: null,
    isLoading: false
  });

  // Editar cliente
  const [currentPage, setCurrentPage] = useState<string>('clientes');
  const [selectedClient, setSelectedClient] = useState<ClienteConVendedor | null>(null);
  const [clientFormMode, setClientFormMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedWeapon, setSelectedWeapon] = useState<any | null>(null);
  const [precioModificado, setPrecioModificado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);

  // Reasignar arma
  const [modalReasignarArma, setModalReasignarArma] = useState<{ isOpen: boolean; cliente: ClienteConVendedor | null; isLoading: boolean }>({
    isOpen: false,
    cliente: null,
    isLoading: false
  });

  // Desistimiento
  const [modalDesistimiento, setModalDesistimiento] = useState<{ isOpen: boolean; cliente: ClienteConVendedor | null; observacion: string; isLoading: boolean }>({
    isOpen: false,
    cliente: null,
    observacion: '',
    isLoading: false
  });

  // Editar arma
  const [modalEditarArma, setModalEditarArma] = useState<{ isOpen: boolean; clienteArma: any | null; armasDisponibles: any[]; armaSeleccionada: any | null; nuevoPrecio: string; isLoading: boolean }>({
    isOpen: false,
    clienteArma: null,
    armasDisponibles: [],
    armaSeleccionada: null,
    nuevoPrecio: '',
    isLoading: false
  });

  // Armas reasignadas
  const [armasReasignadas, setArmasReasignadas] = useState<any[]>([]);
  const [loadingArmasReasignadas, setLoadingArmasReasignadas] = useState(false);

  // Modal de generar autorización
  const [mostrarModalAutorizacion, setMostrarModalAutorizacion] = useState(false);
  const [clienteAutorizacion, setClienteAutorizacion] = useState<ClienteConVendedor | null>(null);
  const [numeroFacturaAutorizacion, setNumeroFacturaAutorizacion] = useState('');
  const [tramiteAutorizacion, setTramiteAutorizacion] = useState('');
  const [generandoAutorizacion, setGenerandoAutorizacion] = useState(false);

  // Cliente reasignado
  const [modalClienteReasignado, setModalClienteReasignado] = useState<{ isOpen: boolean; arma: any | null; nuevoClienteId: number | null; isLoading: boolean }>({
    isOpen: false,
    arma: null,
    nuevoClienteId: null,
    isLoading: false
  });

  return {
    vistaActual, setVistaActual,
    stockArmas, setStockArmas,
    loadingStock, setLoadingStock,
    clientes, setClientes,
    loadingClientes, setLoadingClientes,
    clienteSeleccionado, setClienteSeleccionado,
    clientesAsignados, setClientesAsignados,
    clientWeaponAssignments, setClientWeaponAssignments,
    autorizaciones, setAutorizaciones,
    armasCliente, setArmasCliente,
    documentosCliente, setDocumentosCliente,
    contratosCliente, setContratosCliente,
    pagosCliente, setPagosCliente,
    loadingDetalleCliente, setLoadingDetalleCliente,
    modalGenerarContrato, setModalGenerarContrato,
    currentPage, setCurrentPage,
    selectedClient, setSelectedClient,
    clientFormMode, setClientFormMode,
    selectedWeapon, setSelectedWeapon,
    precioModificado, setPrecioModificado,
    cantidad, setCantidad,
    modalReasignarArma, setModalReasignarArma,
    modalDesistimiento, setModalDesistimiento,
    modalEditarArma, setModalEditarArma,
    armasReasignadas, setArmasReasignadas,
    loadingArmasReasignadas, setLoadingArmasReasignadas,
    mostrarModalAutorizacion, setMostrarModalAutorizacion,
    clienteAutorizacion, setClienteAutorizacion,
    numeroFacturaAutorizacion, setNumeroFacturaAutorizacion,
    tramiteAutorizacion, setTramiteAutorizacion,
    generandoAutorizacion, setGenerandoAutorizacion,
    modalClienteReasignado, setModalClienteReasignado,
  };
}
