import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiService } from '../../../services/api';
import { validateEmail, validateIdentificacion } from '../../../utils/validations';
import type { ClientFormData } from './useClientFormData';

/**
 * Hook para manejar documentos del cliente (carga, upload, validación)
 * Extraído de ClientForm para mejorar mantenibilidad
 * OPTIMIZADO: Usa cache para evitar recargas innecesarias
 */
export const useClientDocuments = (
  clientId: string | undefined, 
  tipoClienteId: number | undefined,
  tipoCliente: string | undefined,
  estadoMilitar: string | undefined,
  esTipoMilitar: (tipo: string | undefined) => boolean,
  formData?: ClientFormData
) => {
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({});
  const [loadedDocuments, setLoadedDocuments] = useState<Record<string, any>>({});
  const [documentStatus, setDocumentStatus] = useState<'pending' | 'complete' | 'incomplete'>('pending');

  // OPTIMIZACIÓN: Cache para documentos requeridos usando clave compuesta
  const documentosCacheRef = useRef<Map<string, any[]>>(new Map());
  const ultimaClaveCacheRef = useRef<string>('');

  // OPTIMIZACIÓN: Crear clave de cache estable basada en valores relevantes
  const cacheKey = useMemo(() => {
    if (!tipoClienteId || !tipoCliente) return '';
    const esMilitar = esTipoMilitar(tipoCliente);
    return `${tipoClienteId}-${tipoCliente}-${esMilitar ? estadoMilitar || '' : ''}`;
  }, [tipoClienteId, tipoCliente, estadoMilitar, esTipoMilitar]);

  // Cargar documentos requeridos según el tipo de cliente
  // OPTIMIZACIÓN: Solo cargar si la clave de cache cambió realmente
  useEffect(() => {
    const loadRequiredDocuments = async () => {
      if (!tipoClienteId || !tipoCliente) {
        // Si no hay tipoCliente, limpiar documentos requeridos
        setRequiredDocuments([]);
        return;
      }

      // OPTIMIZACIÓN: Verificar cache antes de cargar - solo si la clave cambió
      if (cacheKey && cacheKey === ultimaClaveCacheRef.current && documentosCacheRef.current.has(cacheKey)) {
        const documentosCacheados = documentosCacheRef.current.get(cacheKey);
        if (documentosCacheados && documentosCacheados.length > 0) {
          setRequiredDocuments(documentosCacheados);
          return;
        }
      }

      // Solo cargar si la clave de cache realmente cambió
      if (cacheKey && cacheKey === ultimaClaveCacheRef.current) {
        return; // Ya está cargado para esta clave
      }

      try {
        let formulario;
        if (esTipoMilitar(tipoCliente) && estadoMilitar) {
          formulario = await apiService.getFormularioClienteConEstadoMilitar(tipoClienteId, estadoMilitar);
        } else {
          formulario = await apiService.getFormularioCliente(tipoClienteId);
        }
        
        if (formulario?.documentos) {
          const documentos = formulario.documentos || [];
          setRequiredDocuments(documentos);
          
          // OPTIMIZACIÓN: Guardar en cache y actualizar última clave
          if (cacheKey) {
            documentosCacheRef.current.set(cacheKey, documentos);
            ultimaClaveCacheRef.current = cacheKey;
          }
        }
      } catch (error) {
        console.error('❌ Error cargando documentos requeridos:', error);
      }
    };

    loadRequiredDocuments();
  }, [cacheKey, tipoClienteId, tipoCliente, estadoMilitar, esTipoMilitar]); // cacheKey ya está optimizado con useMemo

  // Cargar documentos existentes del cliente
  useEffect(() => {
    const loadExistingDocuments = async () => {
      // clientId puede ser string o number, convertir a string y validar
      const clientIdStr = clientId?.toString()?.trim();
      if (!clientIdStr) return;

      try {
        const documentos = await apiService.getDocumentosCliente(parseInt(clientIdStr));
        
        if (documentos && Array.isArray(documentos)) {
          const documentosMap: Record<string, any> = {};
          documentos.forEach(doc => {
            // Solo incluir documentos que NO estén reemplazados (mantener solo el más reciente de cada tipo)
            // El backend marca los anteriores como REEMPLAZADO, así que solo mostramos los activos
            // Solo incluir documentos CARGADOS (no PENDIENTE ni REEMPLAZADO)
            if (doc.tipoDocumentoNombre && doc.rutaArchivo && doc.estado === 'CARGADO' && doc.id) {
              // Si ya existe un documento de este tipo, mantener solo el más reciente (por fecha de carga)
              const fechaDoc = doc.fechaCarga ? new Date(doc.fechaCarga).getTime() : 0;
              const fechaExistente = documentosMap[doc.tipoDocumentoNombre]?.fechaCarga 
                ? new Date(documentosMap[doc.tipoDocumentoNombre].fechaCarga).getTime() 
                : 0;
              
              if (!documentosMap[doc.tipoDocumentoNombre] || fechaDoc > fechaExistente) {
                documentosMap[doc.tipoDocumentoNombre] = {
                  id: doc.id,
                  nombre: doc.tipoDocumentoNombre,
                  url: doc.rutaArchivo,
                  tipo: doc.tipoArchivo || 'application/pdf',
                  estado: doc.estado,
                  nombreArchivo: doc.nombreArchivo,
                  fechaCarga: doc.fechaCarga
                };
              }
            } else {
              console.warn('⚠️ Documento omitido (reemplazado, sin ruta o sin ID):', {
                nombre: doc.tipoDocumentoNombre,
                estado: doc.estado,
                tieneRuta: !!doc.rutaArchivo,
                tieneId: !!doc.id
              });
            }
          });
          setLoadedDocuments(documentosMap);
          console.log('📄 Documentos cargados mapeados (excluyendo reemplazados):', documentosMap);
          console.log('📄 Total documentos recibidos del backend:', documentos.length);
          console.log('📄 Documentos válidos cargados:', Object.keys(documentosMap).length);
        } else {
          console.warn('⚠️ No se recibieron documentos del backend o no es un array:', documentos);
        }
      } catch (error) {
        console.error('❌ Error cargando documentos del cliente:', error);
      }
    };

    loadExistingDocuments();
  }, [clientId]);

  // Validar estado de documentos
  useEffect(() => {
    if (requiredDocuments.length === 0) {
      setDocumentStatus('pending');
      return;
    }

    const allDocumentsUploaded = requiredDocuments.every(doc => {
      // Verificar tanto por nombre como por ID para compatibilidad
      const isUploaded = uploadedDocuments[doc.nombre] || uploadedDocuments[doc.id.toString()];
      const isLoaded = loadedDocuments[doc.nombre];
      
      // Un documento se considera válido si:
      // 1. Está en uploadedDocuments (recién subido, pendiente de guardar)
      // 2. Está en loadedDocuments con estado CARGADO
      //    - CARGADO = documento subido por el vendedor, listo para verificar completitud
      //    - PENDIENTE = documento NO cargado (no válido)
      const estadoValido = isLoaded && loadedDocuments[doc.nombre]?.estado === 'CARGADO';
      
      return isUploaded || estadoValido;
    });

    setDocumentStatus(allDocumentsUploaded ? 'complete' : 'incomplete');
  }, [requiredDocuments, uploadedDocuments, loadedDocuments]);

  const handleDocumentUpload = useCallback((documentName: string, file: File) => {
    // Buscar el documento en requiredDocuments para obtener su ID
    const document = requiredDocuments.find(doc => doc.nombre === documentName || doc.id.toString() === documentName);
    if (document) {
      // Guardar tanto por ID como por nombre para compatibilidad
      setUploadedDocuments(prev => ({
        ...prev,
        [document.id.toString()]: file,
        [document.nombre]: file
      }));
    } else {
      console.error('❌ Documento no encontrado en requiredDocuments:', documentName);
      // Fallback: usar el nombre del documento directamente
      setUploadedDocuments(prev => ({
        ...prev,
        [documentName]: file
      }));
    }
  }, [requiredDocuments]);

  const getBorderColor = useCallback((fieldName: string, value: string) => {
    if (!value || value.trim() === '') return 'border-gray-200';
    
    switch (fieldName) {
      case 'numeroIdentificacion':
        if (!formData?.tipoIdentificacion) return 'border-gray-200';
        if (!validateIdentificacion(value, formData.tipoIdentificacion)) {
          return 'border-red-500';
        }
        return 'border-green-500';
      case 'ruc':
        if (!validateIdentificacion(value, 'RUC')) {
          return 'border-red-500';
        }
        return 'border-green-500';
      case 'telefonoPrincipal':
      case 'telefonoSecundario':
      case 'telefonoReferencia':
        if (value.length !== 10) {
          return 'border-red-500';
        }
        return 'border-green-500';
      case 'codigoIssfa':
        if (value.length !== 10) {
          return 'border-red-500';
        }
        return 'border-green-500';
      case 'email':
      case 'correoEmpresa':
        return validateEmail(value) ? 'border-green-500' : 'border-red-500';
      default:
        return 'border-gray-200';
    }
  }, [formData]);

  const getDocumentStatusColor = () => {
    switch (documentStatus) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDocumentStatusText = () => {
    switch (documentStatus) {
      case 'complete':
        return 'Todos los documentos completos';
      case 'incomplete':
        return 'Faltan documentos por cargar';
      default:
        return 'Validando documentos...';
    }
  };

  return {
    requiredDocuments,
    uploadedDocuments,
    loadedDocuments,
    documentStatus,
    handleDocumentUpload,
    getBorderColor,
    getDocumentStatusColor,
    getDocumentStatusText,
    setLoadedDocuments
  };
};
