import { useCallback } from 'react';
import { apiService } from '../../../services/api';
import type { Client } from '../types';
import type { Weapon } from '../types';

interface UseClientSubmitProps {
  mode: 'create' | 'edit' | 'view';
  client?: Client | null;
  formData: any;
  clientDataForBackend: any;
  clientStatus: string;
  uploadedDocuments: Record<string, File>;
  currentSelectedWeapon: Weapon | null;
  precioModificado: number;
  cantidad: number;
}

export const useClientSubmit = ({
  mode,
  client,
  formData,
  clientDataForBackend,
  clientStatus,
  uploadedDocuments,
  currentSelectedWeapon,
  precioModificado,
  cantidad
}: UseClientSubmitProps) => {
  
  /**
   * Lógica específica para ACTUALIZAR cliente existente
   */
  const handleUpdateCliente = useCallback(async () => {
    if (mode !== 'edit' || !client) {
      throw new Error('handleUpdateCliente solo debe usarse en modo edit');
    }

    // Construir datos del cliente con ID y estado
    const clientData = {
      ...clientDataForBackend,
      id: client.id,
      estado: clientStatus
    };
    
    // Formato esperado por actualizarClienteCompleto: { cliente: {...}, respuestas: [...] }
    const requestDataForBackend = {
      cliente: clientData,
      respuestas: (formData.respuestas || [])
        .filter((r: any) => r.respuesta && r.respuesta.trim() !== '')
        .map((r: any) => ({
          pregunta: r.pregunta,
          respuesta: r.respuesta,
          tipo: r.tipo || 'TEXTO',
          preguntaId: r.questionId || r.preguntaId || r.id || null
        }))
    };
    
    // 1. Actualizar cliente y respuestas (backend las procesa en una transacción)
    const updatedClient = await apiService.updateCliente(
      parseInt(client.id.toString()), 
      requestDataForBackend as any
    );
    
    const clienteId = parseInt(updatedClient.id.toString());
    
    // 2. Subir documentos nuevos (solo los nuevos, no duplicar)
    const documentErrors: string[] = [];
    if (Object.keys(uploadedDocuments).length > 0) {
      for (const [documentoId, file] of Object.entries(uploadedDocuments)) {
        try {
          await apiService.cargarDocumentoCliente(clienteId, parseInt(documentoId), file);
        } catch (error) {
          console.error(`❌ Error subiendo documento ${documentoId}:`, error);
          documentErrors.push(`Documento ${documentoId}`);
        }
      }
    }
    
    // 3. Asignar arma si hay una nueva seleccionada (solo si no está ya asignada)
    let armaError: string | null = null;
    if (currentSelectedWeapon) {
      try {
        const precioTotal = precioModificado * cantidad;
        await apiService.crearReservaArma(
          clienteId,
          parseInt(currentSelectedWeapon.id.toString()),
          cantidad,
          precioModificado,
          precioTotal
        );
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || '';
        // Solo mostrar error si NO es porque ya está asignada
        if (!errorMessage.includes('ya está asignada') && !errorMessage.includes('ya existe')) {
          armaError = errorMessage;
        }
      }
    }
    
    // Retornar resultado
    return {
      cliente: updatedClient,
      clienteId,
      documentErrors,
      armaError
    };
  }, [mode, client, formData, clientDataForBackend, clientStatus, uploadedDocuments, currentSelectedWeapon, precioModificado, cantidad]);
  
  /**
   * Lógica específica para CREAR cliente nuevo
   */
  const handleCreateCliente = useCallback(async () => {
    if (mode !== 'create') {
      throw new Error('handleCreateCliente solo debe usarse en modo create');
    }

    // Preparar respuestas para backend
    const respuestasParaBackend = (formData.respuestas || [])
      .filter((r: any) => r.questionId && r.respuesta)
      .map((r: any) => ({
        preguntaId: r.questionId,
        respuesta: r.respuesta
      }));
    
    // Construir requestData con formato esperado por ClienteCompletoService
    const requestData: any = {
      cliente: {
        ...clientDataForBackend,
        estado: clientStatus
      },
      respuestas: respuestasParaBackend
    };
    
    // Si hay arma seleccionada, incluirla en la transacción
    if (currentSelectedWeapon) {
      const precioTotal = precioModificado * cantidad;
      requestData.arma = {
        armaId: parseInt(currentSelectedWeapon.id.toString()),
        cantidad: cantidad,
        precioUnitario: precioModificado,
        precioTotal: precioTotal
      };
    }
    
    // Crear cliente completo (transaccional: cliente + respuestas + arma)
    const response = await apiService.createCliente(requestData);
    const clienteId = (response as any).clienteId || (response as any).id;
    
    // Subir documentos después (no pueden estar en la misma transacción porque son multipart)
    const documentErrors: string[] = [];
    if (Object.keys(uploadedDocuments).length > 0) {
      for (const [documentoId, file] of Object.entries(uploadedDocuments)) {
        try {
          await apiService.cargarDocumentoCliente(
            parseInt(clienteId.toString()), 
            parseInt(documentoId), 
            file
          );
        } catch (error) {
          console.error(`❌ Error subiendo documento ${documentoId}:`, error);
          documentErrors.push(`Documento ${documentoId}`);
        }
      }
    }
    
    return {
      cliente: response,
      clienteId: parseInt(clienteId.toString()),
      documentErrors
    };
  }, [mode, formData, clientDataForBackend, clientStatus, uploadedDocuments, currentSelectedWeapon, precioModificado, cantidad]);
  
  return {
    handleUpdateCliente,
    handleCreateCliente
  };
};

