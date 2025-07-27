import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clientService, weaponService, catalogService } from '../services/api';
import type { Client, Weapon, ClientType, IdentificationType, Province, Canton } from '../types';

export const useVendedorState = () => {
  const { user } = useAuth();
  
  // Estados principales
  const [clients, setClients] = useState<Client[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [clientWeapons, setClientWeapons] = useState<Record<string, { weapon: Weapon; price: number; quantity: number }[]>>({});
  
  // Estados de catálogos
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cantonsByProvince, setCantonsByProvince] = useState<Record<string, Canton[]>>({});
  
  // Estados de carga
  const [loading, setLoading] = useState({
    clients: false,
    weapons: false,
    catalogs: false
  });
  
  // Estados de error
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar clientes del vendedor
  const loadClients = useCallback(async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, clients: true }));
    setErrors(prev => ({ ...prev, clients: '' }));
    
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, clients: error instanceof Error ? error.message : 'Error al cargar clientes' }));
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  }, [user]);

  // Cargar catálogo de armas
  const loadWeapons = useCallback(async () => {
    setLoading(prev => ({ ...prev, weapons: true }));
    setErrors(prev => ({ ...prev, weapons: '' }));
    
    try {
      const data = await weaponService.getWeapons();
      setWeapons(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, weapons: error instanceof Error ? error.message : 'Error al cargar armas' }));
    } finally {
      setLoading(prev => ({ ...prev, weapons: false }));
    }
  }, []);

  // Cargar catálogos
  const loadCatalogs = useCallback(async () => {
    setLoading(prev => ({ ...prev, catalogs: true }));
    setErrors(prev => ({ ...prev, catalogs: '' }));
    
    try {
      const [clientTypesData, identificationTypesData, provincesData] = await Promise.all([
        catalogService.getClientTypes(),
        catalogService.getIdentificationTypes(),
        catalogService.getProvinces()
      ]);
      
      setClientTypes(clientTypesData);
      setIdentificationTypes(identificationTypesData);
      setProvinces(provincesData);
    } catch (error) {
      setErrors(prev => ({ ...prev, catalogs: error instanceof Error ? error.message : 'Error al cargar catálogos' }));
    } finally {
      setLoading(prev => ({ ...prev, catalogs: false }));
    }
  }, []);

  // Cargar cantones por provincia
  const loadCantons = useCallback(async (provinceId: string) => {
    if (cantonsByProvince[provinceId]) return; // Ya cargados
    
    try {
      const cantons = await catalogService.getCantons(provinceId);
      setCantonsByProvince(prev => ({ ...prev, [provinceId]: cantons }));
    } catch (error) {
      console.error('Error al cargar cantones:', error);
    }
  }, [cantonsByProvince]);

  // Cargar armas de un cliente
  const loadClientWeapons = useCallback(async (clientId: string) => {
    try {
      const weapons = await weaponService.getClientWeapons(clientId);
      setClientWeapons(prev => ({ ...prev, [clientId]: weapons }));
    } catch (error) {
      console.error('Error al cargar armas del cliente:', error);
    }
  }, []);

  // Crear cliente
  const createClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newClient = await clientService.createClient(clientData as Omit<Client, 'id'>);
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (error) {
      throw error;
    }
  }, []);

  // Actualizar cliente
  const updateClient = useCallback(async (id: string, clientData: Partial<Client>) => {
    try {
      const updatedClient = await clientService.updateClient(id, clientData);
      setClients(prev => prev.map(client => client.id === id ? updatedClient : client));
      return updatedClient;
    } catch (error) {
      throw error;
    }
  }, []);

  // Eliminar cliente
  const deleteClient = useCallback(async (id: string) => {
    try {
      await clientService.deleteClient(id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (error) {
      throw error;
    }
  }, []);

  // Asignar arma a cliente
  const assignWeaponToClient = useCallback(async (clientId: string, weaponId: string, price: number, quantity: number = 1) => {
    try {
      await weaponService.assignWeaponToClient(clientId, weaponId, price, quantity);
      // Recargar armas del cliente
      await loadClientWeapons(clientId);
    } catch (error) {
      throw error;
    }
  }, [loadClientWeapons]);

  // Actualizar precio de arma
  const updateWeaponPrice = useCallback(async (clientId: string, weaponId: string, price: number) => {
    try {
      await weaponService.updateWeaponPrice(clientId, weaponId, price);
      // Recargar armas del cliente
      await loadClientWeapons(clientId);
    } catch (error) {
      throw error;
    }
  }, [loadClientWeapons]);

  // Verificar cédula duplicada
  const checkCedulaExists = useCallback(async (cedula: string, excludeId?: string) => {
    try {
      return await clientService.checkCedulaExists(cedula, excludeId);
    } catch (error) {
      throw error;
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadClients();
      loadWeapons();
      loadCatalogs();
    }
  }, [user, loadClients, loadWeapons, loadCatalogs]);

  // Obtener cantones de una provincia
  const getCantons = useCallback((provinceId: string) => {
    return cantonsByProvince[provinceId] || [];
  }, [cantonsByProvince]);

  // Obtener armas de un cliente
  const getClientWeapons = useCallback((clientId: string) => {
    return clientWeapons[clientId] || [];
  }, [clientWeapons]);

  // Obtener precio específico de arma para cliente
  const getWeaponPriceForClient = useCallback((weaponId: string, clientId?: string): number => {
    if (!clientId) return 0;
    
    const clientWeaponsList = clientWeapons[clientId];
    if (!clientWeaponsList) return 0;
    
    const clientWeapon = clientWeaponsList.find(cw => cw.weapon.id === weaponId);
    return clientWeapon ? clientWeapon.price : 0;
  }, [clientWeapons]);

  return {
    // Estados
    clients,
    weapons,
    clientTypes,
    identificationTypes,
    provinces,
    loading,
    errors,
    
    // Funciones de carga
    loadClients,
    loadWeapons,
    loadCatalogs,
    loadCantons,
    loadClientWeapons,
    
    // Funciones de CRUD
    createClient,
    updateClient,
    deleteClient,
    assignWeaponToClient,
    updateWeaponPrice,
    checkCedulaExists,
    
    // Funciones de utilidad
    getCantons,
    getClientWeapons,
    getWeaponPriceForClient
  };
}; 