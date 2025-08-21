import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
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
      const response = await apiService.getMisClientes();
      setClients((Array.isArray(response) ? response : (response as any).content || []) as any);
    } catch (error) {
      setErrors(prev => ({ ...prev, clients: error instanceof Error ? error.message : 'Error al cargar clientes' }));
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  }, [user]);

  // Cargar catálogo de armas (usando datos hardcodeados por ahora)
  const loadWeapons = useCallback(async () => {
    setLoading(prev => ({ ...prev, weapons: true }));
    setErrors(prev => ({ ...prev, weapons: '' }));
    
    try {
      // Por ahora usamos datos hardcodeados
      setWeapons([]);
    } catch (error) {
      setErrors(prev => ({ ...prev, weapons: error instanceof Error ? error.message : 'Error al cargar armas' }));
    } finally {
      setLoading(prev => ({ ...prev, weapons: false }));
    }
  }, []);

  // Cargar catálogos (usando datos hardcodeados por ahora)
  const loadCatalogs = useCallback(async () => {
    setLoading(prev => ({ ...prev, catalogs: true }));
    setErrors(prev => ({ ...prev, catalogs: '' }));
    
    try {
      // Por ahora usamos datos hardcodeados
      setClientTypes([]);
      setIdentificationTypes([]);
      setProvinces([]);
    } catch (error) {
      setErrors(prev => ({ ...prev, catalogs: error instanceof Error ? error.message : 'Error al cargar catálogos' }));
    } finally {
      setLoading(prev => ({ ...prev, catalogs: false }));
    }
  }, []);

  // Cargar cantones por provincia (placeholder)
  const loadCantons = useCallback(async (provinceId: string) => {
    if (cantonsByProvince[provinceId]) return; // Ya cargados
    
    try {
      // Placeholder - implementar cuando esté disponible
      setCantonsByProvince(prev => ({ ...prev, [provinceId]: [] }));
    } catch (error) {
      console.error('Error al cargar cantones:', error);
    }
  }, [cantonsByProvince]);

  // Cargar armas de un cliente (placeholder)
  const loadClientWeapons = useCallback(async (clientId: string) => {
    try {
      // Placeholder - implementar cuando esté disponible
      setClientWeapons(prev => ({ ...prev, [clientId]: [] }));
    } catch (error) {
      console.error('Error al cargar armas del cliente:', error);
    }
  }, []);

  // Crear cliente (placeholder)
  const createClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Placeholder - implementar cuando esté disponible
    const newClient = { ...clientData, id: Date.now().toString() } as Client;
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, []);

  // Actualizar cliente (placeholder)
  const updateClient = useCallback(async (id: string, clientData: Partial<Client>) => {
    // Placeholder - implementar cuando esté disponible
    const updatedClient = { ...clientData, id } as Client;
    setClients(prev => prev.map(client => client.id === id ? updatedClient : client));
    return updatedClient;
  }, []);

  // Eliminar cliente (placeholder)
  const deleteClient = useCallback(async (id: string) => {
    // Placeholder - implementar cuando esté disponible
    setClients(prev => prev.filter(client => client.id !== id));
  }, []);

  // Asignar arma a cliente (placeholder)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const assignWeaponToClient = useCallback(async (clientId: string, _weaponId: string, _price: number, _quantity: number = 1) => {
    // Placeholder - implementar cuando esté disponible
    await loadClientWeapons(clientId);
  }, [loadClientWeapons]);

  // Actualizar precio de arma (placeholder)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateWeaponPrice = useCallback(async (clientId: string, _weaponId: string, _price: number) => {
    // Placeholder - implementar cuando esté disponible
    await loadClientWeapons(clientId);
  }, [loadClientWeapons]);

  // Verificar cédula duplicada (placeholder)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkCedulaExists = useCallback(async (_cedula: string, _excludeId?: string) => {
    // Placeholder - implementar cuando esté disponible
    return false;
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