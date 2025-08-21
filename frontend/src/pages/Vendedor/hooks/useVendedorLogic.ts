import { useState, useEffect, useRef, useCallback } from 'react';
import type { Client } from '../../../types';
import { apiService } from '../../../services/api';

export const useVendedorLogic = () => {
  // Ref para evitar re-montajes
  const hasInitializedRef = useRef(false);
  
  // Estados
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFormMode, setClientFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [clients, setClients] = useState<Client[]>([]);
  const [availableWeapons, setAvailableWeapons] = useState<any[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<any | null>(null);
  const [precioModificado, setPrecioModificado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: any; precio: number; cantidad: number }>>({});
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [weaponsLoading, setWeaponsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [clientesBloqueados, setClientesBloqueados] = useState<Record<string, { bloqueado: boolean; motivo: string }>>({});

  // Función para determinar el estado del cliente
  const getClientStatus = useCallback((client: Client) => {
    if (client.estado) {
      return client.estado;
    }
    
    if (clientesBloqueados[client.id]?.bloqueado) {
      return 'BLOQUEADO';
    }
    
    const requiredDocuments = client.documentos?.filter(doc => doc.status === 'pending') || [];
    const uploadedDocuments = client.documentos?.filter(doc => doc.status === 'approved') || [];
    
    if (requiredDocuments.length > 0 && uploadedDocuments.length < requiredDocuments.length) {
      return 'FALTAN_DOCUMENTOS';
    }
    
    const hasWeapon = clientWeaponAssignments[client.id];
    if (hasWeapon) {
      return 'LISTO_IMPORTACION';
    }
    
    return 'FALTAN_DOCUMENTOS';
  }, [clientesBloqueados, clientWeaponAssignments]);

  // Función para obtener el color del estado
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'BLOQUEADO':
        return 'bg-red-100 text-red-800';
      case 'FALTAN_DOCUMENTOS':
        return 'bg-yellow-100 text-yellow-800';
      case 'LISTO_IMPORTACION':
        return 'bg-green-100 text-green-800';
      case 'INACTIVO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Función para obtener el texto del estado
  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'BLOQUEADO':
        return 'Bloqueado';
      case 'FALTAN_DOCUMENTOS':
        return 'Faltan documentos';
      case 'LISTO_IMPORTACION':
        return 'Listo para importación';
      case 'INACTIVO':
        return 'Inactivo';
      default:
        return 'Sin estado';
    }
  }, []);

  // useEffect principal
  useEffect(() => {
    if (hasInitializedRef.current) {
      console.log('🔫 Vendedor - ⚠️ Ya inicializado, saltando useEffect...');
      return;
    }
    
    console.log('🔫 Vendedor - useEffect ejecutándose... - TIMESTAMP:', new Date().toISOString());
    console.log('🔫 Vendedor - Estado inicial currentPage:', 'dashboard');
    console.log('🔫 Vendedor - useEffect - STACK TRACE:', new Error().stack);
    
    hasInitializedRef.current = true;
    loadClients();
    loadWeapons();
  }, []);

  // Monitorear cambios en availableWeapons
  useEffect(() => {
    if (availableWeapons.length > 0) {
      console.log('🔫 Vendedor - 🔄 availableWeapons cambió - Nuevo valor:', availableWeapons?.length || 0);
      console.log('🔫 Vendedor - 🔄 availableWeapons contenido:', availableWeapons);
    }
  }, [availableWeapons]);

  // useEffect de asignaciones
  useEffect(() => {
    if (!hasInitializedRef.current) {
      console.log('🔫 Vendedor - ⚠️ Componente no inicializado, saltando useEffect asignaciones...');
      return;
    }
    
    console.log('🔫 Vendedor - useEffect asignaciones ejecutándose... - TIMESTAMP:', new Date().toISOString());
    console.log('🔫 Vendedor - useEffect asignaciones - availableWeapons.length:', availableWeapons.length);
    console.log('🔫 Vendedor - useEffect asignaciones - clients.length:', clients.length);
    console.log('🔫 Vendedor - useEffect asignaciones - clientWeaponAssignments keys:', Object.keys(clientWeaponAssignments));
    console.log('🔫 Vendedor - useEffect asignaciones - isInitialized:', isInitialized);
    
    // CAMBIO: Inicializar solo cuando tenemos armas, sin esperar a clientes
    if (availableWeapons.length > 0 && !isInitialized) {
      console.log('🔫 Vendedor - ✅ Inicializando pantalla (con armas, con o sin clientes)...');
      console.log('🔫 Vendedor - availableWeapons.length:', availableWeapons.length);
      console.log('🔫 Vendedor - clients.length:', clients.length);
      
      // Si hay clientes, crear asignaciones de prueba
      if (clients.length > 0) {
        const testAssignments: Record<string, { weapon: any; precio: number; cantidad: number }> = {};
        const firstWeapon = availableWeapons[0];
        
        clients.slice(0, 3).forEach(client => {
          testAssignments[client.id] = {
            weapon: firstWeapon,
            precio: firstWeapon.precioReferencia || 0,
            cantidad: 1
          };
        });
        
        setClientWeaponAssignments(testAssignments);
        console.log('🔫 Vendedor - ✅ Asignaciones de prueba creadas para clientes existentes');
      }
      
      setIsInitialized(true);
      console.log('🔫 Vendedor - ✅ Pantalla inicializada, isInitialized = true');
    }
  }, [availableWeapons, clients, isInitialized]);

  const loadClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      const response = await apiService.getClientes();
      setClients((response.content || []) as any);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const loadWeapons = useCallback(async () => {
    try {
      setWeaponsLoading(true);
      console.log('🔫 Vendedor - Iniciando carga de armas desde API...');
      console.log('🔫 Vendedor - Llamando a apiService.getArmas()...');
      
      const armas = await apiService.getArmas();
      
      console.log('🔫 Vendedor - RESPUESTA COMPLETA DE LA API:', armas);
      console.log('🔫 Vendedor - Total de armas recibidas:', armas?.length || 0);
      console.log('🔫 Vendedor - Tipo de armas:', typeof armas);
      console.log('🔫 Vendedor - Es array:', Array.isArray(armas));
      
      if (Array.isArray(armas)) {
        console.log('🔫 Vendedor - ✅ RESPUESTA ES ARRAY - Procesando armas...');
        console.log('🔫 Vendedor - Primeras 3 armas:', armas.slice(0, 3));
        console.log('🔫 Vendedor - Últimas 3 armas:', armas.slice(-3));
        
        armas.forEach((arma, index) => {
          console.log(`🔫 Vendedor - Arma ${index + 1}:`, {
            id: arma.id,
            nombre: arma.nombre,
            codigo: arma.codigo,
            calibre: arma.calibre,
            categoriaNombre: arma.categoriaNombre,
            precioReferencia: arma.precioReferencia,
            urlImagen: arma.urlImagen
          });
        });
        
        const armasSinNombre = armas.filter(arma => !arma.nombre);
        if (armasSinNombre.length > 0) {
          console.error('🔫 Vendedor - ❌ ARMAS SIN NOMBRE ENCONTRADAS:', armasSinNombre);
        } else {
          console.log('🔫 Vendedor - ✅ Todas las armas tienen nombre');
        }
        
        const armasSinId = armas.filter(arma => !arma.id);
        if (armasSinId.length > 0) {
          console.error('🔫 Vendedor - ❌ ARMAS SIN ID ENCONTRADAS:', armasSinId);
        } else {
          console.log('🔫 Vendedor - ✅ Todas las armas tienen ID');
        }
        
        console.log('🔫 Vendedor - ANTES de setAvailableWeapons - armas:', armas);
        setAvailableWeapons(armas);
        console.log('🔫 Vendedor - DESPUÉS de setAvailableWeapons - Estado actualizado');
        
      } else {
        console.error('🔫 Vendedor - ❌ RESPUESTA NO ES ARRAY:', armas);
        console.error('🔫 Vendedor - Tipo de respuesta:', typeof armas);
        console.error('🔫 Vendedor - Estructura completa:', JSON.stringify(armas, null, 2));
      }
      
    } catch (error) {
      console.error('❌ Error al cargar armas:', error);
      console.error('❌ Error completo:', error);
      console.log('🔫 Vendedor - Usando armas mock como fallback');
    } finally {
      setWeaponsLoading(false);
      console.log('🔫 Vendedor - Loading de armas terminado');
    }
  }, []);

  const handleCreateClient = useCallback(() => {
    setCurrentPage('clientForm');
    setClientFormMode('create');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, []);

  const handleAssignWeaponWithoutClient = useCallback(() => {
    setCurrentPage('weaponSelection');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, []);

  const handleClientSaved = useCallback((client: Client) => {
    setClients(prev => {
      const existingIndex = prev.findIndex(c => c.id === client.id);
      if (existingIndex !== -1) {
        const updatedClients = [...prev];
        updatedClients[existingIndex] = client;
        return updatedClients;
      } else {
        return [client, ...prev];
      }
    });
    
    setSelectedClient(client);
    
    if (selectedWeapon) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [client.id]: {
          weapon: selectedWeapon,
          precio: precioModificado,
          cantidad: cantidad
        }
      }));
    }
    
    if (client.estado === 'BLOQUEADO' || clientesBloqueados[client.id]?.bloqueado) {
      setCurrentPage('dashboard');
    } else if (client.estado === 'LISTO_IMPORTACION') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('dashboard');
    }
  }, [selectedWeapon, precioModificado, cantidad, clientesBloqueados]);

  const handleClienteBloqueado = useCallback((clientId: string, bloqueado: boolean, motivo: string) => {
    if (bloqueado) {
      setClientesBloqueados(prev => ({
        ...prev,
        [clientId]: { bloqueado, motivo }
      }));
      
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
  }, [currentPage]);

  const handleCloseForm = useCallback(() => {
    setCurrentPage('dashboard');
    setClientFormMode('create');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, []);

  const handleWeaponSelected = useCallback((weapon: any | null) => {
    if (weapon) {
      setSelectedWeapon(weapon);
      setPrecioModificado(weapon.precioReferencia || 0);
      setCantidad(1);
      
      if (selectedClient) {
        setClientWeaponAssignments(prev => ({
          ...prev,
          [selectedClient.id]: {
            weapon: weapon,
            precio: weapon.precioReferencia || 0,
            cantidad: 1
          }
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
  }, [selectedClient]);

  const handlePriceChange = useCallback((_weaponId: number, newPrice: number) => {
    setPrecioModificado(newPrice);
    
    if (selectedClient) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon!,
          precio: newPrice,
          cantidad: cantidad
        }
      }));
    }
  }, [selectedClient, selectedWeapon, cantidad]);

  const handleQuantityChange = useCallback((_weaponId: number, newQuantity: number) => {
    setCantidad(newQuantity);
    
    if (selectedClient) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon!,
          precio: precioModificado,
          cantidad: newQuantity
        }
      }));
    }
  }, [selectedClient, selectedWeapon, precioModificado]);

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
  }, [selectedClient, selectedWeapon, precioModificado, cantidad]);

  const handleViewClient = useCallback((client: Client) => {
    setSelectedClient(client);
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
  }, [clientWeaponAssignments]);

  const handleEditClient = useCallback((client: Client) => {
    setSelectedClient(client);
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
  }, [clientWeaponAssignments]);

  const handleFilterByType = useCallback((tipoCliente: string) => {
    if (clientFilter === tipoCliente) {
      setClientFilter(null);
    } else {
      setClientFilter(tipoCliente);
    }
  }, [clientFilter]);

  const clearFilter = useCallback(() => {
    setClientFilter(null);
  }, []);

  const getFilteredClients = useCallback(() => {
    if (!clientFilter) return clients;
    return clients.filter(client => client.tipoCliente === clientFilter);
  }, [clientFilter, clients]);

  const getWeaponForClient = useCallback((clientId: string) => {
    return clientWeaponAssignments[clientId];
  }, [clientWeaponAssignments]);

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
  }, []);

  const getClientCountByType = useCallback((tipo: string) => {
    return clients.filter(client => client.tipoCliente === tipo).length;
  }, [clients]);

  const isLoading = clientsLoading || weaponsLoading || !isInitialized;

  return {
    // Estados
    currentPage,
    selectedClient,
    clientFormMode,
    clients,
    availableWeapons,
    selectedWeapon,
    precioModificado,
    cantidad,
    clientWeaponAssignments,
    clientFilter,
    clientsLoading,
    weaponsLoading,
    isInitialized,
    clientesBloqueados,
    isLoading,
    
    // Funciones
    setCurrentPage,
    setSelectedClient,
    setClientFormMode,
    setSelectedWeapon,
    setPrecioModificado,
    setCantidad,
    setClientWeaponAssignments,
    setClientesBloqueados,
    
    getClientStatus,
    getStatusColor,
    getStatusText,
    handleCreateClient,
    handleAssignWeaponWithoutClient,
    handleClientSaved,
    handleClienteBloqueado,
    handleCloseForm,
    handleWeaponSelected,
    handlePriceChange,
    handleQuantityChange,
    handleFinishProcess,
    handleViewClient,
    handleEditClient,
    handleFilterByType,
    clearFilter,
    getFilteredClients,
    getWeaponForClient,
    handlePriceChangeWrapper,
    handleQuantityChangeWrapper,
    handleNavigateToWeaponSelection,
    getClientCountByType,
  };
};
