import { useState, useRef } from 'react';
import type { Client } from '../types';

/**
 * Hook para gestionar todos los estados del módulo vendedor
 * Separado para cumplir con límite de 500 líneas por archivo
 */
export const useVendedorState = () => {
  // Ref para evitar re-montajes
  const hasInitializedRef = useRef(false);
  const selectedSerieNumeroRef = useRef<string | null>(null);
  
  // Estados de navegación
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFormMode, setClientFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Estados de datos
  const [clients, setClients] = useState<Client[]>([]);
  const [availableWeapons, setAvailableWeapons] = useState<any[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<any | null>(null);
  const [precioModificado, setPrecioModificado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>>({});
  const [weaponPrices, setWeaponPrices] = useState<Record<number, number>>({});
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [clientFormData, setClientFormData] = useState<any>(null);
  
  // Estados de carga
  const [clientsLoading, setClientsLoading] = useState(true);
  const [weaponsLoading, setWeaponsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Estados de bloqueo
  const [clientesBloqueados, setClientesBloqueados] = useState<Record<string, { bloqueado: boolean; motivo: string }>>({});
  
  // Estados de expoferia y series
  const [expoferiaActiva, setExpoferiaActiva] = useState<boolean>(false);
  const [selectedSerieId, setSelectedSerieId] = useState<number | null>(null);
  const [selectedSerieNumero, setSelectedSerieNumero] = useState<string | null>(null);
  
  // Estados de paginación
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalClients, setTotalClients] = useState<number>(0);
  const pageSize = 20;
  
  // Estados de provincias
  const [provinciasCompletas, setProvinciasCompletas] = useState<Array<{codigo: string, nombre: string}>>([]);
  
  return {
    // Refs
    hasInitializedRef,
    selectedSerieNumeroRef,
    
    // Estados de navegación
    currentPage,
    setCurrentPage,
    selectedClient,
    setSelectedClient,
    clientFormMode,
    setClientFormMode,
    
    // Estados de datos
    clients,
    setClients,
    availableWeapons,
    setAvailableWeapons,
    selectedWeapon,
    setSelectedWeapon,
    precioModificado,
    setPrecioModificado,
    cantidad,
    setCantidad,
    clientWeaponAssignments,
    setClientWeaponAssignments,
    weaponPrices,
    setWeaponPrices,
    clientFilter,
    setClientFilter,
    clientFormData,
    setClientFormData,
    
    // Estados de carga
    clientsLoading,
    setClientsLoading,
    weaponsLoading,
    setWeaponsLoading,
    isInitialized,
    setIsInitialized,
    
    // Estados de bloqueo
    clientesBloqueados,
    setClientesBloqueados,
    
    // Estados de expoferia y series
    expoferiaActiva,
    setExpoferiaActiva,
    selectedSerieId,
    setSelectedSerieId,
    selectedSerieNumero,
    setSelectedSerieNumero,
    
    // Estados de paginación
    currentPageNumber,
    setCurrentPageNumber,
    totalPages,
    setTotalPages,
    totalClients,
    setTotalClients,
    pageSize,
    
    // Estados de provincias
    provinciasCompletas,
    setProvinciasCompletas,
  };
};

