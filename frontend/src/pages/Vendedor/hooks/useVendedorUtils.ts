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
  // NOTA: El estado ahora viene calculado del backend de manera consistente
  // Esta función solo se usa como fallback si el estado no viene del backend
  const getClientStatus = useCallback((client: Client) => {
    // Si el estado viene del backend, usarlo directamente
    if (client.estado) {
      // Mapear estados del backend a estados del frontend si es necesario
      if (client.estado === 'PENDIENTE_DOCUMENTOS') {
        return 'PENDIENTE_DOCUMENTOS';
      }
      if (client.estado === 'EN_PROCESO') {
        return 'EN_PROCESO';
      }
      return client.estado;
    }
    
    // Fallback: calcular estado localmente si no viene del backend
    if (clientesBloqueados[client.id]?.bloqueado) {
      return 'BLOQUEADO';
    }
    
    const requiredDocuments = client.documentos?.filter(doc => doc.status === 'pending') || [];
    const uploadedDocuments = client.documentos?.filter(doc => doc.status === 'approved') || [];
    
    if (requiredDocuments.length > 0 && uploadedDocuments.length < requiredDocuments.length) {
      return 'PENDIENTE_DOCUMENTOS';
    }
    
    const hasWeapon = clientWeaponAssignments[client.id];
    if (hasWeapon) {
      return 'LISTO_IMPORTACION';
    }
    
    return 'PENDIENTE_DOCUMENTOS';
  }, [clientesBloqueados, clientWeaponAssignments]);

  // Función para obtener el color del estado
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'BLOQUEADO':
      case 'RECHAZADO':
      case 'CANCELADO':
      case 'INHABILITADO_COMPRA':
        return 'bg-red-100 text-red-800';
      case 'FALTAN_DOCUMENTOS':
      case 'PENDIENTE_DOCUMENTOS':
        return 'bg-yellow-100 text-yellow-800';
      case 'EN_PROCESO':
      case 'ACTIVO': // ACTIVO se mapea al mismo color que EN_PROCESO
      case 'PENDIENTE_ASIGNACION_CLIENTE':
      case 'CONTRATO_ENVIADO':
        return 'bg-blue-100 text-blue-800';
      case 'LISTO_IMPORTACION':
      case 'APROBADO':
      case 'PROCESO_COMPLETADO':
      case 'CONTRATO_FIRMADO':
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
      case 'PENDIENTE_DOCUMENTOS':
        return 'Faltan documentos';
      case 'EN_PROCESO':
        return 'En proceso';
      case 'ACTIVO':
        // ACTIVO es un estado interno, debe convertirse a estado descriptivo
        // Si viene ACTIVO del backend, significa que el estado calculado no se aplicó
        // Por ahora, mapearlo a "En proceso" hasta que se calcule correctamente
        return 'En proceso';
      case 'PROCESO_COMPLETADO':
        return 'Proceso completado';
      case 'LISTO_IMPORTACION':
        return 'Listo para importación';
      case 'INACTIVO':
        return 'Inactivo';
      case 'PENDIENTE_ASIGNACION_CLIENTE':
        return 'Pendiente asignación cliente';
      case 'RECHAZADO':
        return 'Rechazado';
      case 'CANCELADO':
        return 'Cancelado';
      case 'INHABILITADO_COMPRA':
        return 'Inhabilitado para compra';
      case 'APROBADO':
        return 'Aprobado';
      case 'CONTRATO_ENVIADO':
        return 'Contrato enviado';
      case 'CONTRATO_FIRMADO':
        return 'Contrato firmado';
      default:
        return status || 'Faltan documentos';
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

