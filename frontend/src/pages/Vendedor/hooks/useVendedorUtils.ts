import { useCallback } from 'react';
import type { Client } from '../types';

/**
 * Funciones utilitarias para el módulo vendedor
 * Separado para cumplir con límite de 500 líneas por archivo
 */
export const useVendedorUtils = (
  clientesBloqueados: Record<string, { bloqueado: boolean; motivo: string }>,
  clientWeaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>
) => {
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
      case 'PENDIENTE_DOCUMENTOS':
        return 'Pendiente de documentos';
      case 'PROCESO_COMPLETADO':
        return 'Proceso completado';
      case 'LISTO_IMPORTACION':
        return 'Listo para importación';
      case 'INACTIVO':
        return 'Inactivo';
      default:
        return 'Faltan documentos';
    }
  }, []);

  // Función para obtener arma de un cliente
  const getWeaponForClient = useCallback((clientId: string) => {
    return clientWeaponAssignments[clientId] || null;
  }, [clientWeaponAssignments]);

  // Función para filtrar clientes
  const getFilteredClients = useCallback((clients: Client[], filter: string | null) => {
    if (!filter) {
      return clients;
    }
    return clients.filter(client => {
      const tipoCliente = (client as any).tipoProcesoNombre || client.tipoClienteNombre || client.tipoCliente || '';
      return tipoCliente.toLowerCase().includes(filter.toLowerCase());
    });
  }, []);

  // Función para contar clientes por tipo
  const getClientCountByType = useCallback((clients: Client[], tipo: string) => {
    return clients.filter(client => {
      const tipoCliente = (client as any).tipoProcesoNombre || client.tipoClienteNombre || client.tipoCliente || '';
      return tipoCliente === tipo;
    }).length;
  }, []);

  // Funciones de mapeo de provincias
  const mapearProvinciaACodigo = useCallback((nombreProvincia: string, provinciasCompletas: Array<{codigo: string, nombre: string}>) => {
    const provincia = provinciasCompletas.find(p => p.nombre === nombreProvincia);
    return provincia ? provincia.codigo : nombreProvincia;
  }, []);

  const mapearCodigoANombreProvincia = useCallback((codigoProvincia: string, provinciasCompletas: Array<{codigo: string, nombre: string}>) => {
    const provincia = provinciasCompletas.find(p => p.codigo === codigoProvincia);
    return provincia ? provincia.nombre : codigoProvincia;
  }, []);

  return {
    getClientStatus,
    getStatusColor,
    getStatusText,
    getWeaponForClient,
    getFilteredClients,
    getClientCountByType,
    mapearProvinciaACodigo,
    mapearCodigoANombreProvincia,
  };
};

