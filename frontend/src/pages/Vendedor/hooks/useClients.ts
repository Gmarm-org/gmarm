import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import type { Client } from '../../../types';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el servicio API apropiado
  // ⚠️ MODIFICADO PARA FASE PILOTO - Solo usar API real del backend
  const getApiService = async () => {
    // Forzar uso de API real para fase piloto
    console.log('🔒 FASE PILOTO: Usando solo API real del backend');
    return apiService;
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const service = await getApiService();
      const response = await service.getMisClientes();
      setClients((Array.isArray(response) ? response : (response as any).content || []) as any);
      setError(null);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Partial<Client>) => {
    try {
      const service = await getApiService();
      const newClient = await service.createCliente(clientData as any);
      setClients(prev => [...prev, newClient as any]);
      return newClient;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear cliente';
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  return {
    clients,
    loading,
    error,
    loadClients,
    createClient
  };
}; 