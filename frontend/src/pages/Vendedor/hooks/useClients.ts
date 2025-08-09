import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import { mockApiService } from '../../../services/mockApiService';
import type { Client } from '../../../types';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el servicio API apropiado
  const getApiService = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok ? apiService : mockApiService;
    } catch {
      console.log('Usando datos mock para clientes');
      return mockApiService;
    }
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const service = await getApiService();
      const response = await service.getClientes();
      setClients(response.data as any);
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