import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { validarEdadMinima } from '../../../utils/ageValidation';
import { useTiposClienteConfig } from '../../../contexts/TiposClienteContext';
import { useIVA } from '../../../hooks/useConfiguracion';
import type { Client } from '../types';
import type { Weapon } from '../types';

// Hooks refactorizados
import { useClientFormData } from '../hooks/useClientFormData';
import { useClientCatalogs } from '../hooks/useClientCatalogs';
import { useClientDocuments } from '../hooks/useClientDocuments';
import { useClientAnswers } from '../hooks/useClientAnswers';
import { useClientSubmit } from '../hooks/useClientSubmit';

// Componentes de secciones
import { ClientPersonalDataSection } from './sections/ClientPersonalDataSection';
import { ClientCompanyDataSection } from './sections/ClientCompanyDataSection';
import { ClientDocumentsSection } from './sections/ClientDocumentsSection';
import { ClientAnswersSection } from './sections/ClientAnswersSection';
import { ClientReservedWeaponSection } from './sections/ClientReservedWeaponSection';
import { ClientViewSections } from './sections/ClientViewSections';
import { VendedorStockWeaponsSection } from './sections/VendedorStockWeaponsSection';

interface ClientFormProps {
  mode: 'create' | 'edit' | 'view';
  client?: Client | null;
  onSave: (client: Client) => void;
  onCancel: () => void;
  onEdit?: () => void; // Callback para cambiar a modo edición
  selectedWeapon?: Weapon | null;
  precioModificado?: number;
  cantidad?: number;
  onPriceChange?: (price: number) => void;
  onQuantityChange?: (quantity: number) => void;
  onNavigateToWeaponSelection?: () => void;
  onConfirmData?: (formData: any) => void;
  onClienteBloqueado?: (clientId: string, bloqueado: boolean, motivo: string) => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  mode, 
  client, 
  onSave, 
  onCancel,
  onEdit,
  selectedWeapon,
  precioModificado = 0,
  cantidad = 1,
  onPriceChange,
  onQuantityChange,
  onNavigateToWeaponSelection,
  onConfirmData,
  onClienteBloqueado
}) => {
  const { user } = useAuth();
  const { getCodigoTipoCliente, esTipoMilitar, esTipoPolicia, esUniformado, requiereCodigoIssfa, loading: tiposClienteLoading } = useTiposClienteConfig();
  const { iva: ivaDecimal, ivaPorcentaje } = useIVA();
  const lastGrupoCheckRef = useRef<string | null>(null);

  // Hooks refactorizados
  const {
    formData,
    setFormData,
    handleInputChange: handleInputChangeBase,
    showMilitaryWarning,
    setShowMilitaryWarning,
    clienteBloqueado,
    setClienteBloqueado,
    motivoBloqueo,
    setMotivoBloqueo
  } = useClientFormData();

  const {
    tiposCliente,
    tiposIdentificacion,
    provincias,
    availableCantons,
    availableCantonsEmpresa,
    getNombreProvincia,
    loadCantones,
    setAvailableCantons,
    setAvailableCantonsEmpresa
  } = useClientCatalogs();

  // Estados para datos cargados del cliente
  const [loadedArmas, setLoadedArmas] = useState<any[]>([]);
  const [loadedPagos, setLoadedPagos] = useState<any[]>([]);
  const [loadedContratos, setLoadedContratos] = useState<any[]>([]);
  const [localSelectedWeapon, setLocalSelectedWeapon] = useState<Weapon | null>(null);
  
  // Estado para armas en stock del vendedor
  const [armasEnStock, setArmasEnStock] = useState<any[]>([]);
  
  // Estado para guardar el ID de la relación ClienteArma del stock (para reasignar después)
  const [clienteArmaIdDelStock, setClienteArmaIdDelStock] = useState<number | null>(null);
  
  // Combinar selectedWeapon prop con localSelectedWeapon para mostrar la arma correcta
  const currentSelectedWeapon = localSelectedWeapon || selectedWeapon;
  
  // Determinar si es empresa
  const isEmpresa = formData.tipoCliente === 'Compañía de Seguridad';
  
  const tipoClienteLower = (formData.tipoCliente || '').toLowerCase();
  const isPoliceTypeFallback = tipoClienteLower.includes('polic');
  const isMilitaryTypeFallback = tipoClienteLower.includes('militar');

  // Determinar si es uniformado basado en el tipo de cliente (militar O policía)
  const isUniformadoByType = esUniformado(formData.tipoCliente) || isPoliceTypeFallback || isMilitaryTypeFallback;
  
  // Determinar si es tipo militar específico que requiere código ISSFA (usando configuración dinámica)
  const isMilitaryType = (esTipoMilitar(formData.tipoCliente) && requiereCodigoIssfa(formData.tipoCliente))
    || isMilitaryTypeFallback;
  
  // Determinar si es tipo policía que requiere código ISSPOL
  const isPoliceType = esTipoPolicia(formData.tipoCliente) || isPoliceTypeFallback;
  
  // Determinar si es uniformado en servicio activo basado en estado militar
  const isUniformado = isUniformadoByType && formData.estadoMilitar === 'ACTIVO';

  const isCivilByType = formData.tipoCliente === 'Civil' || formData.tipoCliente === 'Cliente Civil';
  const isUniformadoPasivoTratadoComoCivil = isUniformadoByType &&
    formData.estadoMilitar === 'PASIVO';
  const isCivil = isCivilByType || isUniformadoPasivoTratadoComoCivil;

  const isClientConfirmed = client?.emailVerificado === true;
  // Si el cliente tiene serie asignada, NADIE puede editar datos (solo documentos)
  const hasSerieAsignada = ['SERIE_ASIGNADA', 'CONTRATO_ENVIADO', 'CONTRATO_FIRMADO', 'PROCESO_COMPLETADO'].includes(client?.estado || '');
  const canEditAllInEditMode = Boolean(
    user?.roles?.some((role: any) => {
      const codigo = role.rol?.codigo || (role as any).codigo || role;
      return codigo === 'SALES_CHIEF' || codigo === 'JEFE_VENTAS' || codigo === 'ADMIN';
    })
  );
  // Restringir a solo documentos si: tiene serie asignada (siempre) O si vendedor y cliente confirmado
  const isRestrictedToDocuments = mode === 'edit' && (hasSerieAsignada || (isClientConfirmed && !canEditAllInEditMode));
  const personalSectionMode = isRestrictedToDocuments ? 'view' : mode;
  const answersSectionMode = isRestrictedToDocuments ? 'view' : mode;
  const documentsSectionMode = mode;
  // Etiqueta del botón según restricciones
  const editButtonLabel = hasSerieAsignada
    ? 'Editar Documentos'
    : (isClientConfirmed && !canEditAllInEditMode ? 'Editar Documentos' : 'Editar Cliente');
  
  // El tipo de proceso real se usa internamente en los hooks useClientDocuments y useClientAnswers

  // Obtener tipoClienteId para hooks de documentos y respuestas
  const tipoClienteEncontrado = tiposCliente.find(tc => tc.nombre === formData.tipoCliente);
  const tipoClienteId = tipoClienteEncontrado?.id;

  // Selección automática de ISSFA para militares e ISSPOL para policías
  useEffect(() => {
    if (mode === 'create' || mode === 'edit') {
      // Si se selecciona un tipo militar, activar campo ISSFA automáticamente
      if (isMilitaryType && !formData.codigoIssfa) {
        // No llenar automáticamente, solo asegurar que el campo esté habilitado
        // El usuario debe ingresar el código manualmente
      }
      
      // Si se selecciona un tipo policía, activar campo ISSPOL automáticamente
      if (isPoliceType && !formData.codigoIsspol) {
        // No llenar automáticamente, solo asegurar que el campo esté habilitado
        // El usuario debe ingresar el código manualmente
      }
      
      // Si cambia el tipo de cliente a uno que NO es militar, limpiar ISSFA
      if (!isMilitaryType && formData.codigoIssfa) {
        handleInputChange('codigoIssfa', '');
      }
      
      // Si cambia el tipo de cliente a uno que NO es policía, limpiar ISSPOL
      if (!isPoliceType && formData.codigoIsspol) {
        handleInputChange('codigoIsspol', '');
      }
    }
  }, [formData.tipoCliente, isMilitaryType, isPoliceType, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hooks para documentos y respuestas
  const esTipoUniformadoParaForm = useCallback((tipo: string | undefined) => {
    const tipoLower = (tipo || '').toLowerCase();
    return esTipoMilitar(tipo) || esTipoPolicia(tipo) || tipoLower.includes('militar') || tipoLower.includes('polic');
  }, [esTipoMilitar, esTipoPolicia]);

  const {
    requiredDocuments,
    uploadedDocuments,
    loadedDocuments,
    documentStatus,
    handleDocumentUpload,
    getBorderColor,
    getDocumentStatusColor,
    getDocumentStatusText,
    setLoadedDocuments
  } = useClientDocuments(
    formData.id?.toString(), // Convertir a string para el hook
    tipoClienteId,
    formData.tipoCliente,
    formData.estadoMilitar,
    esTipoUniformadoParaForm,
    formData
  );

  // Hook para respuestas
  const {
    clientQuestions,
    getAnswerForQuestion,
    handleAnswerChange: handleAnswerChangeBase
  } = useClientAnswers(
    tipoClienteId,
    formData.tipoCliente,
    formData.estadoMilitar,
    esTipoUniformadoParaForm,
    formData.id?.toString(), // Convertir a string para el hook
    formData.respuestas,
    setFormData
  );

  // Wrapper para handleAnswerChange que incluye callbacks
  const handleAnswerChange = useCallback((question: string, answer: string, preguntaId?: number) => {
    handleAnswerChangeBase(question, answer, preguntaId, onClienteBloqueado, setClienteBloqueado, setMotivoBloqueo);
  }, [handleAnswerChangeBase, onClienteBloqueado, setClienteBloqueado, setMotivoBloqueo]);

  // Usar handleInputChange directamente del hook (ya incluye toda la lógica necesaria)
  const handleInputChange = handleInputChangeBase;

  useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    if (!formData.tipoCliente) {
      return;
    }

    if (tiposClienteLoading) {
      return;
    }

    let tipoClienteCodigo: string;
    try {
      tipoClienteCodigo = getCodigoTipoCliente(formData.tipoCliente);
    } catch (error) {
      return;
    }

    if (tipoClienteCodigo === 'CIV' || tipoClienteCodigo === 'DEP') {
      return;
    }

    const estadoMilitar = formData.estadoMilitar || '';
    const checkKey = `${tipoClienteCodigo}-${estadoMilitar}`;
    if (lastGrupoCheckRef.current === checkKey) {
      return;
    }
    lastGrupoCheckRef.current = checkKey;

    const verificarDisponibilidad = async () => {
      try {
        const resultado = await apiService.verificarGrupoDisponiblePorTipo(
          tipoClienteCodigo,
          estadoMilitar || undefined
        );

        if (!resultado.disponible) {
          const mensaje = resultado.mensaje
            || (resultado.tipoGrupoRequerido
              ? `No existe grupo de tipo ${resultado.tipoGrupoRequerido} para poder cargar el cliente.`
              : 'No hay grupos de importación disponibles para este tipo de cliente.');
          alert(`⚠️ ${mensaje}`);
          onCancel();
        }
      } catch (error) {
        console.error('Error verificando disponibilidad de grupos:', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    verificarDisponibilidad();
  }, [formData.tipoCliente, formData.estadoMilitar, mode, getCodigoTipoCliente, esUniformado, onCancel, tiposClienteLoading]);
  
  // Función para cargar datos adicionales del cliente
  const loadClientData = useCallback(async (clienteId: number) => {
    try {
      // OPTIMIZACIÓN CRÍTICA: NO cargar respuestas aquí
      // Las respuestas se cargan automáticamente por useClientAnswers hook
      // Esto evita cargas duplicadas y procesamiento innecesario
      
      // Cargar documentos del cliente
      const documentos = await apiService.getDocumentosCliente(clienteId);
      
      // Actualizar el estado de documentos cargados
      if (documentos && Array.isArray(documentos)) {
        const documentosMap: Record<string, any> = {};
        documentos.forEach(doc => {
          if (doc.tipoDocumentoNombre && doc.rutaArchivo) {
            documentosMap[doc.tipoDocumentoNombre] = {
              id: doc.id,
              nombre: doc.tipoDocumentoNombre,
              url: doc.rutaArchivo, // Usar rutaArchivo de la BD
              tipo: doc.tipoArchivo || 'application/pdf',
              estado: doc.estado,
              nombreArchivo: doc.nombreArchivo
            };
          }
        });
        setLoadedDocuments(documentosMap);
      }
      
      // Cargar armas asignadas al cliente (solo para mostrar en el formulario)
      const armasCliente = await apiService.getArmasCliente(clienteId);
      setLoadedArmas(armasCliente || []);
      
      // OPTIMIZACIÓN: No cargar pagos y contratos aquí, solo cuando se necesiten (no se usan en el formulario)
      // Esto reduce significativamente el tiempo de carga
      setLoadedPagos([]);
      setLoadedContratos([]);
      
      // Si hay armas asignadas, actualizar el precio modificado y selectedWeapon
      if (armasCliente && armasCliente.length > 0) {
        const armaAsignada = armasCliente[0]; // Tomar la primera arma
        
        // Establecer selectedWeapon para que se muestre en modo edit
        const weaponData = {
          id: armaAsignada.armaId,
          modelo: armaAsignada.armaModelo || 'N/A',
          codigo: armaAsignada.armaCodigo || '',
          calibre: armaAsignada.armaCalibre || 'N/A',
          categoriaNombre: 'N/A',
          precioReferencia: parseFloat(armaAsignada.precioUnitario) || 0,
          urlImagen: armaAsignada.armaImagen || '',
          disponible: true,
          precioModificado: parseFloat(armaAsignada.precioUnitario) || 0
        } as Weapon;
        setLocalSelectedWeapon(weaponData);
        
        // Notificar al padre sobre el precio de la arma asignada
        if (onPriceChange && armaAsignada.precioUnitario) {
          onPriceChange(parseFloat(armaAsignada.precioUnitario.toString()));
        }
      }
      
    } catch (error) {
      console.error('Error cargando datos del cliente:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [onPriceChange]);
  
  // Los catálogos se cargan automáticamente en useClientCatalogs
  // Los documentos y preguntas se cargan automáticamente en useClientDocuments y useClientAnswers
  
  // Cargar datos del cliente cuando se edite
  useEffect(() => {
    if (client && mode !== 'create') {
      loadClientData(parseInt(client.id.toString()));
    }
  }, [client, mode, loadClientData]);
  
  // Cargar armas en stock del vendedor cuando se está creando un cliente nuevo
  useEffect(() => {
    if (mode === 'create' && user?.id) {
      const cargarArmasEnStock = async () => {
        try {
          const armas = await apiService.getArmasEnStockVendedor(parseInt(user.id.toString()));
          setArmasEnStock(armas || []);
        } catch (error) {
          console.error('Error cargando armas en stock:', error instanceof Error ? error.message : 'Unknown error');
          setArmasEnStock([]);
        }
      };
      
      cargarArmasEnStock();
    }
  }, [mode, user?.id]);
  
 // Función para asignar un arma del stock al nuevo cliente
  const handleAsignarArmaDelStock = useCallback((armaEnStock: any) => {
    // Convertir el arma del stock al formato Weapon
    const weapon: Weapon = {
      id: armaEnStock.armaId.toString(),
      modelo: armaEnStock.armaModelo || 'N/A',
      codigo: armaEnStock.armaCodigo,
      calibre: armaEnStock.armaCalibre,
      categoriaNombre: armaEnStock.armaCategoriaNombre || 'N/A',
      precioReferencia: parseFloat(armaEnStock.precioUnitario.toString()),
      urlImagen: armaEnStock.armaImagen || '',
      disponible: true
    };
    
    // Establecer el arma seleccionada
    setLocalSelectedWeapon(weapon);
    
    // Guardar el ID de la relación ClienteArma para reasignarla después
    setClienteArmaIdDelStock(armaEnStock.id);
    
    // Establecer precio y cantidad desde el stock
    if (onPriceChange) {
      onPriceChange(parseFloat(armaEnStock.precioUnitario.toString()));
    }
    if (onQuantityChange) {
      onQuantityChange(armaEnStock.cantidad);
    }
    
    // Mostrar mensaje informativo sobre documentos requeridos
    alert(`✅ Arma "${armaEnStock.armaModelo || 'N/A'}" seleccionada del stock.\n\n` +
          `⚠️ IMPORTANTE: Para poder entregar el arma al cliente, debes:\n` +
          `1. Completar todos los datos del cliente\n` +
          `2. Cargar y aprobar TODOS los documentos obligatorios\n` +
          `3. Guardar el cliente\n\n` +
          `El arma se reasignará automáticamente cuando el cliente tenga toda su documentación completa.`);
  }, [onPriceChange, onQuantityChange]);
  
  // NUEVO: Restaurar datos del formulario cuando se regresa en el flujo de creación
  useEffect(() => {
    if (client && mode === 'create' && client.nombres) {
      setFormData({
        id: client.id || '',
        nombres: client.nombres || '',
        apellidos: client.apellidos || '',
        email: client.email || '',
        numeroIdentificacion: client.numeroIdentificacion || '',
        tipoCliente: client.tipoCliente || client.tipoClienteNombre || '',
        tipoIdentificacion: client.tipoIdentificacion || client.tipoIdentificacionNombre || '',
        telefonoPrincipal: client.telefonoPrincipal || '',
        telefonoSecundario: client.telefonoSecundario || '',
        direccion: client.direccion || '',
        provincia: client.provincia || '',
        canton: client.canton || '',
        fechaNacimiento: client.fechaNacimiento || '',
        representanteLegal: client.representanteLegal || '',
        ruc: client.ruc || '',
        nombreEmpresa: client.nombreEmpresa || '',
        direccionFiscal: client.direccionFiscal || '',
        telefonoReferencia: client.telefonoReferencia || '',
        correoEmpresa: client.correoEmpresa || '',
        provinciaEmpresa: client.provinciaEmpresa || '',
        cantonEmpresa: client.cantonEmpresa || '',
        estadoMilitar: client.estadoMilitar,
        codigoIssfa: client.codigoIssfa || '', // Para militares
        codigoIsspol: (client as any).codigoIsspol || '', // Para policías (nuevo campo)
        rango: client.rango || '',
        documentos: client.documentos || [],
        respuestas: [] // Inicializar vacío - se cargarán por useClientAnswers cuando detecte el clientId
      });
    }
  }, [client, mode, setFormData]);
  
  // Mostrar advertencia para uniformado pasivo
  useEffect(() => {
    if (isUniformado && formData.estadoMilitar === 'PASIVO') {
      setShowMilitaryWarning(true);
    } else {
      setShowMilitaryWarning(false);
    }
  }, [isUniformado, formData.estadoMilitar]);

  // La validación de documentos se hace automáticamente en useClientDocuments
  // Las funciones handleDocumentUpload, getBorderColor, getDocumentStatusColor, getDocumentStatusText
  // y getAnswerForQuestion están en los hooks correspondientes



  useEffect(() => {
    if (client && mode !== 'create') {
      
      // Solo establecer formData si los catálogos están disponibles
      if (tiposCliente.length > 0 && tiposIdentificacion.length > 0) {
        // Mapear las claves foráneas a nombres descriptivos para los dropdowns
        const mappedClient = { ...client };
        
        // Mapear tipoCliente: debe ser el NOMBRE para que coincida con el select (value={tipo.nombre})
        // Priorizar tipoClienteNombre del backend, luego tipoCliente si es nombre, luego mapear desde código
        if (client.tipoClienteNombre) {
          // El backend ya devuelve el nombre, usar directamente
          mappedClient.tipoCliente = client.tipoClienteNombre;
        } else if (client.tipoCliente) {
          // Verificar si tipoCliente es nombre o código
          const tipoClientePorNombre = tiposCliente.find(tc => tc.nombre === client.tipoCliente);
          const tipoClientePorCodigo = tiposCliente.find(tc => tc.codigo === client.tipoCliente);
          
          if (tipoClientePorNombre) {
            // Ya es nombre, mantenerlo
            mappedClient.tipoCliente = tipoClientePorNombre.nombre;
          } else if (tipoClientePorCodigo) {
            // Es código, convertir a nombre
            mappedClient.tipoCliente = tipoClientePorCodigo.nombre;
          } else {
            // Si no se encuentra, asumir que es nombre (fallback)
            mappedClient.tipoCliente = client.tipoCliente;
          }
        }
        
        // Mapear tipoIdentificacion: el select usa códigos (value={tipo.codigo}), así que necesitamos el código
        // El backend puede devolver tipoIdentificacionNombre o tipoIdentificacion (código)
        if (client.tipoIdentificacion) {
          // Si ya viene como código, mantenerlo
          const tipoIdentificacionPorCodigo = tiposIdentificacion.find(ti => ti.codigo === client.tipoIdentificacion);
          if (tipoIdentificacionPorCodigo) {
            // Ya es código, mantenerlo
            mappedClient.tipoIdentificacion = tipoIdentificacionPorCodigo.codigo;
          } else {
            // No se encontró por código, puede ser nombre, intentar buscar por nombre
            const tipoIdentificacionPorNombre = tiposIdentificacion.find(ti => ti.nombre === client.tipoIdentificacion);
            if (tipoIdentificacionPorNombre) {
              // Es nombre, convertir a código
              mappedClient.tipoIdentificacion = tipoIdentificacionPorNombre.codigo;
            } else {
              // Si no se encuentra, usar el valor original (fallback)
              mappedClient.tipoIdentificacion = client.tipoIdentificacion;
            }
          }
        } else if (client.tipoIdentificacionNombre) {
          // Si solo tenemos el nombre del backend, buscar el código correspondiente
          const tipoIdentificacionPorNombre = tiposIdentificacion.find(ti => ti.nombre === client.tipoIdentificacionNombre);
          if (tipoIdentificacionPorNombre) {
            mappedClient.tipoIdentificacion = tipoIdentificacionPorNombre.codigo;
          } else {
            mappedClient.tipoIdentificacion = '';
          }
        }
        
        // Mapear código ISSFA si está disponible (para militares)
        if ((client as any).codigoIssfa) {
          (mappedClient as any).codigoIssfa = (client as any).codigoIssfa;
        }
        
        // Mapear código ISSPOL si está disponible (para policías)
        if ((client as any).codigoIsspol) {
          (mappedClient as any).codigoIsspol = (client as any).codigoIsspol;
        }
        
        // Mapear rango si está disponible
        if ((client as any).rango) {
          (mappedClient as any).rango = (client as any).rango;
        }
        
        // CRÍTICO: Mapear provincia correctamente
        // El backend puede devolver provincia como código o como nombre
        // El select de provincia usa códigos (value={provincia.codigo}), así que necesitamos el código
        if (client.provincia) {
          // Buscar si el valor es código o nombre
          const provinciaPorCodigo = provincias.find(p => p.codigo === client.provincia);
          const provinciaPorNombre = provincias.find(p => p.nombre === client.provincia);
          
          if (provinciaPorCodigo) {
            // Ya es código, mantenerlo
            mappedClient.provincia = provinciaPorCodigo.codigo;
          } else if (provinciaPorNombre) {
            // Es nombre, convertir a código
            mappedClient.provincia = provinciaPorNombre.codigo;
          } else {
            // Si no se encuentra, usar el valor original (puede ser código válido que no está en el catálogo)
            mappedClient.provincia = client.provincia;
          }
        }
        
        // Asegurar que tipoCliente esté establecido (verificación final)
        if (!mappedClient.tipoCliente && client.tipoClienteNombre) {
          mappedClient.tipoCliente = client.tipoClienteNombre;
        }
        
        // OPTIMIZACIÓN CRÍTICA: NO cargar respuestas desde client.respuestas
        // El objeto client puede venir con TODAS las respuestas de TODOS los clientes (276k+)
        // Las respuestas se cargarán solo a través de useClientAnswers hook que usa el endpoint específico
        // Esto evita procesar cientos de miles de respuestas innecesarias
        
        setFormData({
          ...mappedClient,
          // Asegurar que tipoCliente y provincia estén presentes
          tipoCliente: mappedClient.tipoCliente || client.tipoClienteNombre || client.tipoCliente || '',
          provincia: mappedClient.provincia || client.provincia || '',
          // Inicializar respuestas vacías - se cargarán por useClientAnswers
          respuestas: []
        });
        
        // Reset bloqueo state first
        setClienteBloqueado(false);
        setMotivoBloqueo('');
        
        // La validación de bloqueo se hará cuando useClientAnswers cargue las respuestas
      } else {
        // Establecer el formData básico del cliente mientras se cargan los catálogos
        // OPTIMIZACIÓN: NO incluir respuestas aquí - se cargarán por useClientAnswers
        setFormData({
          ...client,
          respuestas: [] // Inicializar vacío - se cargarán por useClientAnswers
        });
      }
    } else if (mode === 'create' && (!client || !client.nombres)) {
      // Solo resetear el formulario si NO hay datos de cliente para restaurar
      setFormData({
        id: '',
        nombres: '',
        apellidos: '',
        email: '',
        numeroIdentificacion: '',
        tipoCliente: '',
        tipoIdentificacion: '',
        telefonoPrincipal: '',
        telefonoSecundario: '',
        direccion: '',
        provincia: '',
        canton: '',
        fechaNacimiento: '',
        representanteLegal: '',
        ruc: '',
        nombreEmpresa: '',
        direccionFiscal: '',
        telefonoReferencia: '',
        correoEmpresa: '',
        provinciaEmpresa: '',
        cantonEmpresa: '',
        estadoMilitar: undefined,
        documentos: [],
        respuestas: []
      });
      setClienteBloqueado(false);
      setMotivoBloqueo('');
    }
  }, [client, mode, tiposCliente, tiposIdentificacion, provincias]); // Agregar provincias como dependencia para mapeo correcto

  // OPTIMIZACIÓN: Logs de debug removidos para evitar ruido en cada keystroke
  // Si necesitas debug, usar React DevTools Profiler en lugar de console.log en useEffect

  // Re-validar todas las respuestas cuando cambien (solo en modo edit, no en view)
  // OPTIMIZACIÓN: Usar find en lugar de forEach para detener en la primera coincidencia
  useEffect(() => {
    if (formData.respuestas && formData.respuestas.length > 0 && mode !== 'view') {
      // Limitar búsqueda a las primeras 100 respuestas para evitar procesar miles
      const respuestasLimitadas = formData.respuestas.slice(0, 100);
      const violenciaRespuesta = respuestasLimitadas.find(respuesta => 
        respuesta.pregunta && respuesta.pregunta.toLowerCase().includes('denuncias de violencia')
      );
      
      if (violenciaRespuesta) {
        if (violenciaRespuesta.respuesta === 'SI') {
          setClienteBloqueado(true);
          setMotivoBloqueo('Denuncias de violencia de género o intrafamiliar');
        } else if (violenciaRespuesta.respuesta === 'NO') {
          setClienteBloqueado(false);
          setMotivoBloqueo('');
        }
      }
    }
  }, [formData.respuestas, mode, setClienteBloqueado, setMotivoBloqueo]);

  // Cargar cantones cuando cambia la provincia
  useEffect(() => {
    if (formData.provincia) {
      loadCantones(formData.provincia, false);
      // Si no hay provincia pero hay cantón (modo edición), mantener el cantón
      if (!formData.provincia && formData.canton && mode !== 'create') {
        setAvailableCantons([formData.canton]);
      }
    } else {
      setAvailableCantons([]);
    }
  }, [formData.provincia, mode, formData.canton, loadCantones, setAvailableCantons]);

  // Cargar cantones de empresa cuando cambia la provincia empresa
  useEffect(() => {
    if (formData.provinciaEmpresa) {
      loadCantones(formData.provinciaEmpresa, true);
      // Si no hay provincia pero hay cantón (modo edición), mantener el cantón
      if (!formData.provinciaEmpresa && formData.cantonEmpresa && mode !== 'create') {
        setAvailableCantonsEmpresa([formData.cantonEmpresa]);
      }
    } else {
      setAvailableCantonsEmpresa([]);
    }
  }, [formData.provinciaEmpresa, mode, formData.cantonEmpresa, loadCantones, setAvailableCantonsEmpresa]);

  // handleInputChange ya está manejado por useClientFormData hook

  // Validación de edad
  const edadValida = formData.fechaNacimiento ? validarEdadMinima(formData.fechaNacimiento) : false;

  // Hook para submit (handleSubmit, validaciones, buildClientDataForBackend)
  const {
    handleSubmit,
    isSubmitting,
    buildClientDataForBackend,
    validateForm,
    canContinueWithWeapons
  } = useClientSubmit({
    mode,
    client,
    formData,
    getCodigoTipoCliente,
    userId: user?.id,
    uploadedDocuments,
    loadedDocuments,
    requiredDocuments,
    currentSelectedWeapon: currentSelectedWeapon || null,
    precioModificado,
    cantidad,
    documentStatus,
    clienteBloqueado,
    motivoBloqueo,
    edadValida,
    isMilitaryType,
    isPoliceType,
    clienteArmaIdDelStock,
    setClienteArmaIdDelStock,
    setLoadedDocuments,
    onSave,
    onConfirmData,
    onNavigateToWeaponSelection,
    onClienteBloqueado
  });

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-8 py-12 text-center text-white">
            <h1 className="text-4xl font-bold mb-3">
              {mode === 'create' ? 'Crear Nuevo Cliente' : mode === 'edit' ? 'Editar Cliente' : 'Ver Cliente'}
            </h1>
            <p className="text-xl text-blue-100">
              {mode === 'create' ? 'Complete la información del cliente' : mode === 'edit' ? 'Modifique la información del cliente' : 'Información del cliente'}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* error && ( // This line was removed */}
            {/*   <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg"> // This line was removed */}
            {/*     <div className="flex"> // This line was removed */}
            {/*       <div className="flex-shrink-0"> // This line was removed */}
            {/*         <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"> // This line was removed */}
            {/*           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /> // This line was removed */}
            {/*         </svg> // This line was removed */}
            {/*       </div> // This line was removed */}
            {/*       <div className="ml-3"> // This line was removed */}
            {/*         <p className="text-sm text-red-700 font-medium">Error: {error}</p> // This line was removed */}
            {/*       </div> // This line was removed */}
            {/*     </div> // This line was removed */}
            {/*   </div> // This line was removed */}
            {/* ) // This line was removed */}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Datos Personales - Componente Extraído */}
              <ClientPersonalDataSection
                mode={personalSectionMode}
                formData={formData}
                handleInputChange={(field, value) => handleInputChange(field as keyof typeof formData, value)}
                tiposCliente={tiposCliente}
                tiposIdentificacion={tiposIdentificacion}
                provincias={provincias}
                availableCantons={availableCantons}
                getNombreProvincia={getNombreProvincia}
                isUniformadoByType={isUniformadoByType}
                isMilitaryType={isMilitaryType}
                isPoliceType={isPoliceType}
                getBorderColor={getBorderColor}
              />

              {/* Datos de Empresa - Componente Extraído */}
              {isEmpresa && (
                <ClientCompanyDataSection
                  mode={personalSectionMode}
                  formData={formData}
                  handleInputChange={(field, value) => handleInputChange(field as keyof typeof formData, value)}
                  provincias={provincias}
                  availableCantonsEmpresa={availableCantonsEmpresa}
                  getNombreProvincia={getNombreProvincia}
                  getBorderColor={getBorderColor}
                />
              )}

              {/* Advertencia para Uniformado Pasivo */}
              {showMilitaryWarning && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
                  <div className="flex items-start">
                    <div className="bg-yellow-100 p-2 rounded-full mr-4 mt-1">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Advertencia - Servicio Pasivo</h3>
                      <p className="text-yellow-700">
                        Al estar en servicio pasivo, el proceso continuará como cliente Civil. 
                        Se aplicarán las preguntas y documentos correspondientes a clientes Civiles.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documentos del Cliente - Componente Extraído (solo en modo create/edit) */}
              {formData.tipoCliente && requiredDocuments.length > 0 && documentsSectionMode !== 'view' && (
                <ClientDocumentsSection
                  mode={documentsSectionMode}
                  requiredDocuments={requiredDocuments}
                  uploadedDocuments={uploadedDocuments}
                  loadedDocuments={loadedDocuments}
                  handleDocumentUpload={handleDocumentUpload}
                  getDocumentStatusColor={getDocumentStatusColor}
                  getDocumentStatusText={getDocumentStatusText}
                />
              )}

              {/* Preguntas de Seguridad - Componente Extraído */}
              {formData.tipoCliente && clientQuestions.length > 0 && (
                <ClientAnswersSection
                  mode={answersSectionMode}
                  clientQuestions={clientQuestions}
                  getAnswerForQuestion={getAnswerForQuestion}
                  handleAnswerChange={handleAnswerChange}
                  clienteBloqueado={clienteBloqueado}
                  motivoBloqueo={motivoBloqueo}
                  tipoClienteCodigo={tipoClienteEncontrado?.codigo}
                />
              )}

              {/* Sección de Armas en Stock del Vendedor - Solo en modo create */}
              {mode === 'create' && (
                <VendedorStockWeaponsSection
                  armasEnStock={armasEnStock}
                  onAsignarArma={handleAsignarArmaDelStock}
                  mode={mode}
                />
              )}

              {/* Sección de Arma Reservada - Componente Extraído */}
              <ClientReservedWeaponSection
                mode={mode}
                currentSelectedWeapon={currentSelectedWeapon || null}
                precioModificado={precioModificado}
                cantidad={cantidad}
                maxCantidad={isCivil ? 2 : undefined}
                canEditWeapon={mode !== 'edit' || canEditAllInEditMode}
                onPriceChange={mode !== 'edit' || canEditAllInEditMode ? onPriceChange : undefined}
                onQuantityChange={mode !== 'edit' || canEditAllInEditMode ? onQuantityChange : undefined}
                onNavigateToWeaponSelection={mode !== 'edit' || canEditAllInEditMode ? onNavigateToWeaponSelection : undefined}
                ivaDecimal={ivaDecimal}
                ivaPorcentaje={ivaPorcentaje}
              />

              {/* Secciones de View - Componente Extraído */}
              {mode === 'view' && (
                <ClientViewSections
                  loadedContratos={loadedContratos}
                  loadedArmas={loadedArmas}
                  loadedPagos={loadedPagos}
                  loadedDocuments={loadedDocuments}
                  requiredDocuments={requiredDocuments}
                  ivaDecimal={ivaDecimal}
                  ivaPorcentaje={ivaPorcentaje}
                  emailVerificado={client?.emailVerificado}
                  grupoImportacionNombre={client?.grupoImportacionNombre}
                  licenciaNombre={client?.licenciaNombre}
                  licenciaNumero={client?.licenciaNumero}
                />
              )}

              {/* Botones - Al final después de todas las secciones */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>
                
                {mode === 'view' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onEdit) {
                        onEdit();
                      } else {
                        // Fallback: Cambiar a modo edit con evento
                        const event = new Event('edit-mode');
                        window.dispatchEvent(event);
                      }
                    }}
                    disabled={false}
                    className={`px-8 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg ${
                      'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    }`}
                    title={
                      isClientConfirmed && !canEditAllInEditMode
                        ? 'El cliente confirmó sus datos: solo puede actualizar documentos.'
                        : 'Editar cliente'
                    }
                  >
                    {editButtonLabel}
                  </button>
                )}
                
                {mode !== 'view' && (
                  <>
                    {/* Alerta de cliente inhabilitado */}
                    {mode === 'create' && (!edadValida || clienteBloqueado) && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-bold text-red-800">Cliente Inhabilitado para Compra de Armas</h3>
                            <div className="mt-2 text-sm text-red-700">
                              {!edadValida && (
                                <p>• Edad insuficiente: Debe tener al menos 25 años para adquirir armas.</p>
                              )}
                              {clienteBloqueado && (
                                <p>• {motivoBloqueo}</p>
                              )}
                              <p className="mt-2 font-medium">El cliente se guardará en la base de datos, pero NO podrá seleccionar armas ni generar contrato hasta que se resuelvan estas restricciones.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Botón para continuar con selección de armas (solo en modo create) */}
                    {!clienteBloqueado && edadValida && mode === 'create' && (
                      <button
                        type="button"
                        onClick={() => onConfirmData?.({...formData, uploadedDocuments})}
                        disabled={!canContinueWithWeapons()}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        Continuar con Selección de Armas
                      </button>
                    )}
                    
                    {/* Botón para guardar cliente bloqueado (cuando hay restricciones de edad o violencia) */}
                    {(clienteBloqueado || !edadValida) && mode === 'create' && (
                      <button
                        type="button"
                        onClick={() => {
                          const clientDataForBackend = buildClientDataForBackend();
                          onSave(clientDataForBackend as any);
                        }}
                        disabled={!validateForm()}
                        className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        💾 Guardar Cliente Inhabilitado (Sin Arma)
                      </button>
                    )}
                    
                    {/* Botón para actualizar cliente existente */}
                    {mode === 'edit' && !clienteBloqueado && (
                      <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                        disabled={!validateForm() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Actualizando...</span>
                          </>
                        ) : (
                          <>
                            ✅ Actualizar Cliente
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientForm; 