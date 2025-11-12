import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { calcularEdad, validarEdadMinima, obtenerMensajeErrorEdad } from '../../../utils/ageValidation';
import { validateIdentificacion, validateTelefono, validateEmail } from '../../../utils/validations';
import { useTiposClienteConfig } from '../../../contexts/TiposClienteContext';
import { useIVA } from '../../../hooks/useConfiguracion';
import type { Client } from '../types';
import type { Weapon } from '../types';

// Tipo local para respuestas del formulario
interface RespuestaFormulario {
  id: string;
  pregunta: string;
  respuesta: string;
  tipo: string;
  questionId?: number;
}

// Tipo extendido para el formulario que incluye respuestas del formulario
interface ClientFormData extends Omit<Client, 'respuestas'> {
  respuestas: RespuestaFormulario[];
  codigoIssfa?: string; // Asegurar que el campo esté disponible
  rango?: string; // Rango militar/policial (opcional)
}

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
  const { getCodigoTipoCliente, esTipoMilitar, esUniformado, requiereCodigoIssfa } = useTiposClienteConfig();
  const { iva: ivaDecimal, ivaPorcentaje } = useIVA();

  const [formData, setFormData] = useState<ClientFormData>({
    id: '',
    nombres: '',
    apellidos: '',
    email: '',
    numeroIdentificacion: '',
    tipoCliente: '',
    tipoIdentificacion: '', // Ahora será el código (CED, RUC, etc.)
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
    codigoIssfa: '',
    rango: '',
    documentos: [],
    respuestas: []
  });

  const [availableCantons, setAvailableCantons] = useState<string[]>([]);
  const [availableCantonsEmpresa, setAvailableCantonsEmpresa] = useState<string[]>([]);
  const [clientQuestions, setClientQuestions] = useState<any[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({});
  const [loadedDocuments, setLoadedDocuments] = useState<Record<string, any>>({});
  const [documentStatus, setDocumentStatus] = useState<'pending' | 'complete' | 'incomplete'>('pending');
  const [showMilitaryWarning, setShowMilitaryWarning] = useState(false);
  const [clienteBloqueado, setClienteBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState<string>('');
  
  // Estados para datos cargados del cliente
  const [loadedArmas, setLoadedArmas] = useState<any[]>([]);
  const [loadedPagos, setLoadedPagos] = useState<any[]>([]);
  const [loadedContratos, setLoadedContratos] = useState<any[]>([]);
  const [localSelectedWeapon, setLocalSelectedWeapon] = useState<Weapon | null>(null);
  
  // Combinar selectedWeapon prop con localSelectedWeapon para mostrar la arma correcta
  const currentSelectedWeapon = localSelectedWeapon || selectedWeapon;
  
  // Log para diagnosticar el estado del arma
  useEffect(() => {
    console.log('🔍 DEBUG currentSelectedWeapon:', currentSelectedWeapon);
    console.log('🔍 DEBUG localSelectedWeapon:', localSelectedWeapon);
    console.log('🔍 DEBUG selectedWeapon prop:', selectedWeapon);
  }, [currentSelectedWeapon, localSelectedWeapon, selectedWeapon]);
  
  // Estados para catálogos
  const [tiposCliente, setTiposCliente] = useState<any[]>([]);
  const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);
  const [provincias, setProvincias] = useState<Array<{codigo: string, nombre: string}>>([]);
  
  // Estados para errores de validación
  // const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Determinar si es empresa
  const isEmpresa = formData.tipoCliente === 'Compañía de Seguridad';
  
  // Determinar si es uniformado basado en el tipo de cliente (militar O policía)
  const isUniformadoByType = esUniformado(formData.tipoCliente);
  
  // Determinar si es tipo militar específico que requiere código ISSFA (usando configuración dinámica)
  const isMilitaryType = esTipoMilitar(formData.tipoCliente) && requiereCodigoIssfa(formData.tipoCliente);
  
  // Determinar si es uniformado en servicio activo basado en estado militar
  const isUniformado = isUniformadoByType && formData.estadoMilitar === 'ACTIVO';
  
  // Determinar el tipo de proceso real para cargar preguntas y documentos
  const tipoProcesoReal = isUniformado ? 'UNIFORMADO' : isEmpresa ? 'EMPRESA' : 'CIVIL';
  
  // Función helper para obtener el nombre de la provincia desde el código
  const getNombreProvincia = (codigo: string | undefined): string => {
    if (!codigo || provincias.length === 0) return codigo || 'No especificado';
    const provincia = provincias.find(p => p.codigo === codigo);
    return provincia ? provincia.nombre : codigo;
  };
  
  // Función para cargar datos adicionales del cliente
  const loadClientData = useCallback(async (clienteId: number) => {
    try {
      console.log('🔄 Cargando datos adicionales del cliente:', clienteId);
      
      // Cargar respuestas del cliente
      const respuestas = await apiService.getRespuestasCliente(clienteId);
      console.log('📋 Respuestas cargadas:', respuestas);
      
      // Cargar documentos del cliente
      const documentos = await apiService.getDocumentosCliente(clienteId);
      console.log('📄 Documentos cargados:', documentos);
      
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
        console.log('📄 Documentos cargados mapeados:', documentosMap);
      }
      
      // Cargar armas asignadas al cliente
      const armasCliente = await apiService.getArmasCliente(clienteId);
      console.log('🔫 Armas del cliente cargadas:', armasCliente);
      setLoadedArmas(armasCliente || []);
      
      // Cargar pagos del cliente
      const pagosCliente = await apiService.getPagosCliente(clienteId);
      console.log('💰 Pagos del cliente cargados:', pagosCliente);
      setLoadedPagos(pagosCliente || []);
      
      // Cargar contratos generados del cliente
      const contratosCliente = await apiService.getContratosCliente(clienteId);
      console.log('📋 Contratos del cliente cargados:', contratosCliente);
      setLoadedContratos(contratosCliente || []);
      
      // Actualizar formData con las respuestas cargadas
      if (respuestas && Array.isArray(respuestas)) {
        setFormData(prev => ({
          ...prev,
          respuestas: respuestas.map(r => ({
            id: r.id?.toString() || Math.random().toString(),
            pregunta: r.preguntaTexto || r.pregunta?.pregunta || r.pregunta || '',
            respuesta: r.respuesta || '',
            tipo: r.tipoRespuesta || r.tipo || 'TEXTO',
            questionId: r.preguntaId || r.pregunta?.id
          }))
        }));
        console.log('📋 Respuestas mapeadas para formData:', respuestas.map(r => ({
          id: r.id?.toString() || Math.random().toString(),
          pregunta: r.preguntaTexto || r.pregunta?.pregunta || r.pregunta || '',
          respuesta: r.respuesta || '',
          tipo: r.tipoRespuesta || r.tipo || 'TEXTO',
          questionId: r.preguntaId || r.pregunta?.id
        })));
      }
      
      // Si hay armas asignadas, actualizar el precio modificado y selectedWeapon
      if (armasCliente && armasCliente.length > 0) {
        const armaAsignada = armasCliente[0]; // Tomar la primera arma
        console.log('💰 Arma asignada encontrada:', armaAsignada);
        
        // Establecer selectedWeapon para que se muestre en modo edit
        const weaponData = {
          id: armaAsignada.armaId,
          nombre: armaAsignada.armaNombre || 'N/A',
          codigo: armaAsignada.armaCodigo || '',
          calibre: armaAsignada.armaModelo || 'N/A',
          categoriaNombre: 'N/A',
          precioReferencia: parseFloat(armaAsignada.precioUnitario) || 0,
          urlImagen: armaAsignada.armaImagen || '',
          disponible: true,
          precioModificado: parseFloat(armaAsignada.precioUnitario) || 0
        } as Weapon;
        console.log('🔫 Estableciendo localSelectedWeapon:', weaponData);
        setLocalSelectedWeapon(weaponData);
        
        // Notificar al padre sobre el precio de la arma asignada
        if (onPriceChange && armaAsignada.precioUnitario) {
          onPriceChange(parseFloat(armaAsignada.precioUnitario.toString()));
        }
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos del cliente:', error);
    }
  }, [onPriceChange]);
  
  // Cargar catálogos al iniciar el componente
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        console.log('🔄 Cargando catálogos...');
        
        // Cargar tipos de cliente
        const tiposClienteData = await apiService.getClientTypes();
        setTiposCliente(tiposClienteData);
        // Tipos de cliente cargados
        
        // Cargar tipos de identificación
        const tiposIdentificacionData = await apiService.getTiposIdentificacion();
        setTiposIdentificacion(tiposIdentificacionData);
        // Tipos de identificación cargados
        
        // Cargar provincias completas (con códigos y nombres)
        const provinciasData = await apiService.getProvinciasCompletas();
        setProvincias(provinciasData);
        // Provincias completas cargadas
        
      } catch (error) {
        console.error('❌ Error cargando catálogos:', error);
      }
    };
    
    loadCatalogos();
  }, []);
  
  // Cargar preguntas y documentos requeridos
  useEffect(() => {
    const loadFormulario = async () => {
      if (tiposCliente.length > 0 && formData.tipoCliente) {
        try {
          console.log('🔄 Cargando formulario para tipo:', tipoProcesoReal);
          
          // Buscar el tipo de cliente en los catálogos
          const tipoClienteEncontrado = tiposCliente.find(tc => tc.nombre === formData.tipoCliente);
          if (tipoClienteEncontrado) {
            let formulario;
            
            // Si es tipo militar y tiene estado militar definido, usar el endpoint con estado
            const isMilitaryType = esTipoMilitar(formData.tipoCliente);
            console.log('🔍 Debug formulario:', { 
              tipoCliente: formData.tipoCliente, 
              estadoMilitar: formData.estadoMilitar, 
              isMilitaryType 
            });
            
            if (isMilitaryType && formData.estadoMilitar) {
              console.log('🔄 Cargando formulario para militar con estado:', formData.estadoMilitar);
              formulario = await apiService.getFormularioClienteConEstadoMilitar(tipoClienteEncontrado.id, formData.estadoMilitar);
            } else {
              console.log('🔄 Cargando formulario estándar para tipo:', formData.tipoCliente);
              formulario = await apiService.getFormularioCliente(tipoClienteEncontrado.id);
            }
            // Formulario cargado
            
            if (formulario.preguntas) {
              setClientQuestions(formulario.preguntas);
              // Preguntas cargadas
            }
            
            if (formulario.documentos) {
              setRequiredDocuments(formulario.documentos);
              // Documentos requeridos cargados
            }
          }
        } catch (error) {
          console.error('❌ Error cargando formulario:', error);
        }
      }
    };
    
    loadFormulario();
  }, [tiposCliente, formData.tipoCliente, formData.estadoMilitar, tipoProcesoReal]);
  
  // Cargar datos del cliente cuando se edite
  useEffect(() => {
    if (client && mode !== 'create') {
      loadClientData(parseInt(client.id.toString()));
    }
  }, [client, mode, loadClientData]);
  
  // NUEVO: Restaurar datos del formulario cuando se regresa en el flujo de creación
  useEffect(() => {
    if (client && mode === 'create' && client.nombres) {
      console.log('🔄 Restaurando datos del formulario en proceso de creación:', client);
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
        codigoIssfa: client.codigoIssfa || '',
        rango: client.rango || '',
        documentos: client.documentos || [],
        respuestas: client.respuestas || []
      });
      
      // Si tiene documentos cargados, restaurarlos también
      if ((client as any).uploadedDocuments) {
        setUploadedDocuments((client as any).uploadedDocuments);
      }
      
      console.log('✅ Datos del formulario restaurados correctamente');
    }
  }, [client, mode]);
  
  // Mostrar advertencia para uniformado pasivo
  useEffect(() => {
    if (isUniformado && formData.estadoMilitar === 'PASIVO') {
      setShowMilitaryWarning(true);
    } else {
      setShowMilitaryWarning(false);
    }
  }, [isUniformado, formData.estadoMilitar]);

  // Verificar estado de documentos
  useEffect(() => {
    const checkDocumentCompleteness = () => {
      const mandatoryDocuments = requiredDocuments.filter(doc => doc.obligatorio);
      const uploadedMandatoryDocs = mandatoryDocuments.filter(doc => 
        uploadedDocuments[doc.id.toString()] || loadedDocuments[doc.nombre]
      );
      
      if (mandatoryDocuments.length === 0) {
        setDocumentStatus('complete');
      } else if (uploadedMandatoryDocs.length === mandatoryDocuments.length) {
        setDocumentStatus('complete');
      } else if (uploadedMandatoryDocs.length > 0) {
        setDocumentStatus('incomplete');
      } else {
        setDocumentStatus('pending');
      }
    };

    checkDocumentCompleteness();
  }, [uploadedDocuments, loadedDocuments, requiredDocuments]);

  // Función para convertir a mayúsculas
  const toUpperCase = (value: string) => {
    return value.toUpperCase();
  };

  // Función para manejar carga de documentos
  const handleDocumentUpload = (documentName: string, file: File) => {
    // Buscar el documento en requiredDocuments para obtener su ID
    const document = requiredDocuments.find(doc => doc.nombre === documentName);
    if (document) {
      setUploadedDocuments(prev => ({
        ...prev,
        [document.id.toString()]: file
      }));
    } else {
      console.error('❌ Documento no encontrado en requiredDocuments:', documentName);
    }
  };

  // Función para obtener el color del borde según la validación del campo
  const getBorderColor = (fieldName: string, value: string) => {
    if (!value) return 'border-gray-200'; // Campo vacío - borde normal
    
    switch (fieldName) {
      case 'numeroIdentificacion':
        // Validar con los algoritmos oficiales de Ecuador
        if (!formData.tipoIdentificacion) return 'border-gray-200'; // Sin tipo seleccionado
        if (!validateIdentificacion(value, formData.tipoIdentificacion)) {
          return 'border-red-500'; // Identificación inválida
        }
        return 'border-green-500'; // Válido
      case 'ruc':
        // Validar RUC con algoritmo oficial
        if (!validateIdentificacion(value, 'RUC')) {
          return 'border-red-500'; // RUC inválido
        }
        return 'border-green-500'; // Válido
      case 'telefonoPrincipal':
      case 'telefonoSecundario':
      case 'telefonoReferencia':
        if (value.length !== 10) {
          return 'border-red-500'; // Teléfono debe tener 10 dígitos
        }
        return 'border-green-500'; // Válido
      case 'codigoIssfa':
        if (value.length !== 10) {
          return 'border-red-500'; // Código ISSFA debe tener 10 dígitos
        }
        return 'border-green-500'; // Válido
      case 'email':
        if (!validateEmail(value)) {
          return 'border-red-500'; // Email inválido
        }
        return 'border-green-500'; // Válido
      default:
        return 'border-gray-200'; // Campo normal
    }
  };

  // Función para obtener el estado de color de documentos
  const getDocumentStatusColor = () => {
    switch (documentStatus) {
      case 'complete': return 'bg-green-100 border-green-500 text-green-700';
      case 'incomplete': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'pending': return 'bg-gray-100 border-gray-500 text-gray-700';
      default: return 'bg-gray-100 border-gray-500 text-green-700';
    }
  };

  // Función para obtener el texto del estado de documentos
  const getDocumentStatusText = () => {
    switch (documentStatus) {
      case 'complete': return 'Documentos Completos';
      case 'incomplete': return 'Documentos Pendientes';
      case 'pending': return 'Sin Documentos';
      default: return 'Sin Documentos';
    }
  };

  // Función para obtener respuesta de pregunta
  const getAnswerForQuestion = useMemo(() => {
    return (question: string) => {
      const respuesta = formData.respuestas?.find(r => r.pregunta === question);
      return respuesta?.respuesta || '';
    };
  }, [formData.respuestas]);

  // Función para manejar cambio de respuesta
  const handleAnswerChange = (question: string, answer: string, preguntaId?: number) => {
    console.log('handleAnswerChange called:', { question, answer, preguntaId, currentRespuestas: formData.respuestas });
    
    // Validar respuesta a la pregunta de armas registradas
    if (question.toLowerCase().includes('armas registradas')) {
      // Verificar si la respuesta indica 2 o más armas
      const tieneDosMasArmas = answer.includes('2 armas') || answer.includes('más armas');
      
      if (tieneDosMasArmas) {
        // Mostrar alerta y bloquear selección de arma
        alert('⚠️ ATENCIÓN: El cliente ya tiene 2 o más armas registradas.\n\n' +
              'Por ley ecuatoriana, no se permite tener más de 2 armas.\n\n' +
              'El cliente será guardado con estado INHABILITADO pero NO podrá seleccionar armas adicionales.');
        
        // Marcar cliente como bloqueado
        setClienteBloqueado(true);
        setMotivoBloqueo('Cliente ya tiene 2 o más armas registradas. Máximo legal: 2 armas.');
        
        // Notificar al componente padre
        if (onClienteBloqueado) {
          onClienteBloqueado('temp-id', true, 'Cliente ya tiene 2 o más armas registradas. Máximo legal: 2 armas.');
        }
      } else if (answer === 'NO' || answer.includes('1 arma')) {
        // Si responde NO o tiene solo 1 arma, puede continuar
        setClienteBloqueado(false);
        setMotivoBloqueo('');
        
        if (onClienteBloqueado) {
          onClienteBloqueado('temp-id', false, '');
        }
      }
    }
    
    // Use a more direct approach to avoid potential race conditions
    setFormData(prev => {
      const currentRespuestas = prev.respuestas || [];
      const existingIndex = currentRespuestas.findIndex(r => r.pregunta === question);
      
      console.log('setFormData - existingIndex:', existingIndex, 'for question:', question);
      
      let newRespuestas;
      if (existingIndex >= 0) {
        // Update existing answer
        newRespuestas = [...currentRespuestas];
        newRespuestas[existingIndex] = { 
          ...newRespuestas[existingIndex], 
          respuesta: answer,
          questionId: preguntaId || newRespuestas[existingIndex].questionId
        };
        console.log('Updated existing answer at index:', existingIndex, 'with answer:', answer);
      } else {
        // Add new answer
        newRespuestas = [...currentRespuestas, { 
          id: Date.now().toString(), 
          pregunta: question, 
          respuesta: answer, 
          tipo: 'TEXTO',
          questionId: preguntaId
        }];
        console.log('Added new answer for question:', question, 'with answer:', answer, 'preguntaId:', preguntaId);
      }
      
      console.log('New respuestas array:', newRespuestas);
      
      const updatedFormData = { ...prev, respuestas: newRespuestas };
      console.log('setFormData returning updated formData with respuestas:', updatedFormData.respuestas);
      return updatedFormData;
    });
  };



  useEffect(() => {
    console.log('ClientForm useEffect triggered:', { client, mode, clientId: client?.id });
    
    if (client && mode !== 'create') {
      console.log('Setting form data from client:', client);
      
      // Solo establecer formData si los catálogos están disponibles
      if (tiposCliente.length > 0 && tiposIdentificacion.length > 0) {
        // Mapear las claves foráneas a nombres descriptivos para los dropdowns
        const mappedClient = { ...client };
        
        // Mapear tipoCliente de código a nombre descriptivo
        if (client.tipoClienteNombre) {
          // El backend ya devuelve el nombre, no necesitamos mapear
          mappedClient.tipoCliente = client.tipoClienteNombre;
          // Usando tipoClienteNombre del backend
        } else if (client.tipoCliente) {
          // Fallback: intentar mapear si solo tenemos el código
          const tipoClienteEncontrado = tiposCliente.find(tc => tc.codigo === client.tipoCliente);
          if (tipoClienteEncontrado) {
            mappedClient.tipoCliente = tipoClienteEncontrado.nombre;
            // Mapeado tipoCliente desde código
          } else {
            console.log('⚠️ No se encontró tipoCliente para código:', client.tipoCliente);
            mappedClient.tipoCliente = client.tipoCliente;
          }
        }
        
        // Mapear tipoIdentificacion de código a nombre descriptivo
        if (client.tipoIdentificacionNombre) {
          // El backend ya devuelve el nombre, no necesitamos mapear
          mappedClient.tipoIdentificacion = client.tipoIdentificacionNombre;
          console.log('✅ Usando tipoIdentificacionNombre del backend:', client.tipoIdentificacionNombre);
        } else if (client.tipoIdentificacion) {
          // Fallback: intentar mapear si solo tenemos el código
          const tipoIdentificacionEncontrado = tiposIdentificacion.find(ti => ti.codigo === client.tipoIdentificacion);
          if (tipoIdentificacionEncontrado) {
            mappedClient.tipoIdentificacion = tipoIdentificacionEncontrado.nombre;
            console.log('✅ Mapeado tipoIdentificacion desde código:', { codigo: client.tipoIdentificacion, nombre: tipoIdentificacionEncontrado.nombre });
          } else {
            console.log('⚠️ No se encontró tipoIdentificacion para código:', client.tipoIdentificacion);
            mappedClient.tipoIdentificacion = client.tipoIdentificacion;
          }
        }
        
        // Mapear código ISSFA si está disponible
        if ((client as any).codigoIssfa) {
          (mappedClient as any).codigoIssfa = (client as any).codigoIssfa;
          console.log('✅ Código ISSFA cargado:', (client as any).codigoIssfa);
        }
        
        // Mapear rango si está disponible
        if ((client as any).rango) {
          (mappedClient as any).rango = (client as any).rango;
          console.log('✅ Rango cargado:', (client as any).rango);
        }
        
        console.log('🔍 Mapeando cliente:', { 
          original: { tipoCliente: client.tipoCliente, tipoIdentificacion: client.tipoIdentificacion },
          mapeado: { tipoCliente: mappedClient.tipoCliente, tipoIdentificacion: mappedClient.tipoIdentificacion }
        });
        
        console.log('Mapped client data:', mappedClient);
        
        // Cargar respuestas existentes si las hay
        if (client.respuestas && Array.isArray(client.respuestas)) {
          console.log('📋 Cargando respuestas existentes del cliente:', client.respuestas);
          mappedClient.respuestas = client.respuestas;
        }
        
        setFormData({
          ...mappedClient,
          respuestas: mappedClient.respuestas?.map(r => ({
            id: r.id?.toString() || Math.random().toString(),
            pregunta: r.pregunta || '',
            respuesta: r.respuesta || '',
            tipo: 'TEXTO',
            questionId: (r as any).questionId ? parseInt((r as any).questionId) : undefined
          })) || []
        });
        
        // Reset bloqueo state first
        setClienteBloqueado(false);
        setMotivoBloqueo('');
        
        // Validar respuestas existentes para verificar si está bloqueado (sin notificar al padre al cargar)
        if (client.respuestas && Array.isArray(client.respuestas)) {
          const violenciaRespuesta = client.respuestas.find(r => r.pregunta && r.pregunta.includes('denuncias de violencia'));
          if (violenciaRespuesta?.respuesta === 'SI') {
            setClienteBloqueado(true);
            setMotivoBloqueo('Denuncias de violencia de género o intrafamiliar');
          }
        }
      } else {
        console.log('Catálogos no disponibles aún, esperando...');
        // Establecer el formData básico del cliente mientras se cargan los catálogos
        setFormData({
          ...client,
          respuestas: client.respuestas?.map(r => ({
            id: r.id?.toString() || Math.random().toString(),
            pregunta: r.pregunta || '',
            respuesta: r.respuesta || '',
            tipo: 'TEXTO',
            questionId: (r as any).questionId ? parseInt((r as any).questionId) : undefined
          })) || []
        });
      }
    } else if (mode === 'create' && (!client || !client.nombres)) {
      // Solo resetear el formulario si NO hay datos de cliente para restaurar
      console.log('Resetting form data for create mode (no client data to restore)');
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
    } else if (mode === 'create' && client && client.nombres) {
      console.log('Skipping reset - client data exists for restoration');
    }
  }, [client, mode, tiposCliente, tiposIdentificacion]); // Agregar dependencias de catálogos

  // Monitor formData.respuestas changes for debugging
  useEffect(() => {
    console.log('formData.respuestas changed:', formData.respuestas);
  }, [formData.respuestas]);

  // Monitor formData changes for debugging
  useEffect(() => {
    console.log('formData changed:', { 
      nombres: formData.nombres, 
      apellidos: formData.apellidos, 
      tipoCliente: formData.tipoCliente,
      mode 
    });
  }, [formData.nombres, formData.apellidos, formData.tipoCliente, mode]);

  // Re-validar todas las respuestas cuando cambien (solo en modo edit, no en view)
  useEffect(() => {
    console.log('useEffect re-validating responses:', { 
      formData: formData.respuestas, 
      mode,
      respuestasLength: formData.respuestas?.length || 0
    });
    // Solo ejecutar si no estamos en modo view y hay respuestas
    if (formData.respuestas && formData.respuestas.length > 0 && mode !== 'view') {
      formData.respuestas.forEach(respuesta => {
        if (respuesta.pregunta && respuesta.pregunta.includes('denuncias de violencia')) {
          console.log('Processing violence question:', respuesta);
          // Solo actualizar el estado local, no notificar al padre inmediatamente
          if (respuesta.respuesta === 'SI') {
            console.log('Setting clienteBloqueado to true');
            setClienteBloqueado(true);
            setMotivoBloqueo('Denuncias de violencia de género o intrafamiliar');
          } else if (respuesta.respuesta === 'NO') {
            console.log('Setting clienteBloqueado to false');
            setClienteBloqueado(false);
            setMotivoBloqueo('');
          }
        }
      });
    }
  }, [formData.respuestas, mode]);

  useEffect(() => {
    if (formData.provincia && provincias.length > 0) {
      const loadCantones = async () => {
        try {
          // Obtener el nombre de la provincia desde el código
          const provinciaNombre = getNombreProvincia(formData.provincia);
          console.log('🔄 Cargando cantones para provincia:', formData.provincia, '->', provinciaNombre);
          
          // Si el nombre de la provincia es igual al código, significa que no se encontró
          // En ese caso, intentar buscar directamente con el código como nombre
          const nombreParaBuscar = provinciaNombre === formData.provincia ? formData.provincia : provinciaNombre;
          
          const cantones = await apiService.getCantones(nombreParaBuscar);
          console.log('✅ Cantones cargados:', cantones);
          setAvailableCantons(cantones);
        } catch (error) {
          console.error('❌ Error cargando cantones:', error);
          // En caso de error, mantener el cantón actual si existe
          if (formData.canton) {
            setAvailableCantons([formData.canton]);
          } else {
            setAvailableCantons([]);
          }
        }
      };
      loadCantones();
    } else {
      console.log('⚠️ No hay provincia seleccionada o provincias no cargadas, limpiando cantones');
      // Si no hay provincia pero hay cantón (modo edición), mantener el cantón
      if (formData.canton && mode !== 'create') {
        setAvailableCantons([formData.canton]);
      } else {
        setAvailableCantons([]);
      }
    }
  }, [formData.provincia, provincias.length]);

  useEffect(() => {
    if (formData.provinciaEmpresa && provincias.length > 0) {
      const loadCantones = async () => {
        try {
          // Obtener el nombre de la provincia desde el código
          const provinciaNombre = getNombreProvincia(formData.provinciaEmpresa);
          console.log('🔄 Cargando cantones para provincia empresa:', formData.provinciaEmpresa, '->', provinciaNombre);
          
          // Si el nombre de la provincia es igual al código, significa que no se encontró
          // En ese caso, intentar buscar directamente con el código como nombre
          const nombreParaBuscar = provinciaNombre === formData.provinciaEmpresa ? formData.provinciaEmpresa : provinciaNombre;
          
          const cantones = await apiService.getCantones(nombreParaBuscar);
          console.log('✅ Cantones empresa cargados:', cantones);
          setAvailableCantonsEmpresa(cantones);
        } catch (error) {
          console.error('❌ Error cargando cantones empresa:', error);
          // En caso de error, mantener el cantón actual si existe
          if (formData.cantonEmpresa) {
            setAvailableCantonsEmpresa([formData.cantonEmpresa]);
          } else {
            setAvailableCantonsEmpresa([]);
          }
        }
      };
      loadCantones();
    } else {
      console.log('⚠️ No hay provincia empresa seleccionada o provincias no cargadas, limpiando cantones empresa');
      // Si no hay provincia pero hay cantón (modo edición), mantener el cantón
      if (formData.cantonEmpresa && mode !== 'create') {
        setAvailableCantonsEmpresa([formData.cantonEmpresa]);
      } else {
        setAvailableCantonsEmpresa([]);
      }
    }
  }, [formData.provinciaEmpresa, provincias.length]);

  // Función para manejar cambios en los campos del formulario
  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    let processedValue = value;

    // Aplicar transformaciones según el campo
    if (['nombres', 'apellidos', 'representanteLegal'].includes(field)) {
      // Solo letras y espacios para nombres y apellidos
      processedValue = toUpperCase(value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, ''));
    } else if (['direccion', 'nombreEmpresa', 'direccionFiscal'].includes(field)) {
      // Direcciones pueden tener números, pero se muestran en mayúsculas
      processedValue = toUpperCase(value);
    } else if (['email', 'correoEmpresa'].includes(field)) {
      // Emails en minúsculas
      processedValue = value.toLowerCase();
    } else if (['numeroIdentificacion', 'ruc', 'telefonoPrincipal', 'telefonoSecundario', 'telefonoReferencia'].includes(field)) {
      // Solo números para identificación y teléfonos
      let numericValue = value.replace(/\D/g, '');
      
      // Para teléfonos, limitar a máximo 10 dígitos
      if (['telefonoPrincipal', 'telefonoSecundario', 'telefonoReferencia'].includes(field)) {
        numericValue = numericValue.slice(0, 10);
      }
      
      // Para identificación, limitar según el tipo seleccionado
      if (field === 'numeroIdentificacion' && formData.tipoIdentificacion) {
        const maxLength = getMaxLength();
        numericValue = numericValue.slice(0, maxLength);
      }
      
      // Para RUC, limitar a 13 dígitos
      if (field === 'ruc') {
        numericValue = numericValue.slice(0, 13);
      }
      
      processedValue = numericValue;
    }
    // Para campos de dropdown (tipoCliente, tipoIdentificacion, provincia, canton, etc.) no aplicar procesamiento

    // Actualizar el formulario con el valor procesado (mayúsculas/minúsculas)
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // Función para mapear tipoCliente descriptivo a código (ahora usando configuración dinámica)
  const mapTipoClienteToCode = (tipoCliente: string | undefined): string => {
    return getCodigoTipoCliente(tipoCliente);
  };

  // Función para mapear tipoIdentificacion descriptivo a código
  const mapTipoIdentificacionToCode = (tipoIdentificacion: string | undefined): string => {
    if (!tipoIdentificacion) return 'CED'; // Por defecto Cédula
    
    switch (tipoIdentificacion) {
      case 'Cédula':
      case 'Cédula de Identidad':
        return 'CED';
      case 'RUC':
        return 'RUC';
      case 'Pasaporte':
        return 'PAS';
      default:
        return 'CED'; // Por defecto Cédula
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Por favor, corrija los errores en el formulario antes de continuar.');
      return;
    }

    try {
      // Determinar el estado del cliente
      let clientStatus = 'PENDIENTE_DOCUMENTOS';
      
      if (clienteBloqueado) {
        clientStatus = 'BLOQUEADO'; // Bloqueado por violencia
      } else if (!edadValida) {
        clientStatus = 'INHABILITADO_COMPRA'; // Inhabilitado por edad o armas registradas
      } else if (documentStatus === 'complete') {
        clientStatus = 'LISTO_IMPORTACION';
      }

      // Preparar datos del cliente con códigos mapeados
      console.log('🔍 Preparando datos para backend:', {
        tipoIdentificacionFrontend: formData.tipoIdentificacion,
        tipoClienteFrontend: formData.tipoCliente,
        tipoIdentificacionCodigo: mapTipoIdentificacionToCode(formData.tipoIdentificacion),
        tipoClienteCodigo: mapTipoClienteToCode(formData.tipoCliente)
      });
      
      const clientDataForBackend = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        numeroIdentificacion: formData.numeroIdentificacion,
        tipoIdentificacionCodigo: mapTipoIdentificacionToCode(formData.tipoIdentificacion),
        tipoClienteCodigo: mapTipoClienteToCode(formData.tipoCliente),
        fechaNacimiento: formData.fechaNacimiento,
        direccion: formData.direccion,
        provincia: formData.provincia,
        canton: formData.canton,
        email: formData.email,
        telefonoPrincipal: formData.telefonoPrincipal,
        telefonoSecundario: formData.telefonoSecundario,
        representanteLegal: formData.representanteLegal || '',
        ruc: formData.ruc || '',
        nombreEmpresa: formData.nombreEmpresa || '',
        direccionFiscal: formData.direccionFiscal || '',
        telefonoReferencia: formData.telefonoReferencia || '',
        correoEmpresa: formData.correoEmpresa || '',
        provinciaEmpresa: formData.provinciaEmpresa || '',
        cantonEmpresa: formData.cantonEmpresa || '',
        estadoMilitar: formData.estadoMilitar || '',
        codigoIssfa: formData.codigoIssfa || '',
        rango: formData.rango || '',
        usuarioCreadorId: user?.id // Incluir ID del usuario que crea el cliente
      };

      let updatedClient;
      if (mode === 'edit' && client) {
        // Actualizar cliente existente - incluir el ID original y el estado
        const clientData = {
          ...clientDataForBackend,
          id: client.id, // Mantener el ID original
          estado: clientStatus
        };
        updatedClient = await apiService.updateCliente(parseInt(client.id.toString()), clientData as any);
        
        // En modo edit, también guardar documentos, respuestas y arma
        console.log('🔄 Guardando datos adicionales para cliente editado...');
        
        try {
          // 1. Subir documentos si existen
          if (Object.keys(uploadedDocuments).length > 0) {
            console.log('📄 Subiendo documentos...');
            console.log('📄 Documentos a subir:', uploadedDocuments);
            for (const [documentoId, file] of Object.entries(uploadedDocuments)) {
              console.log(`📄 Subiendo documento ID: ${documentoId}, Cliente ID: ${updatedClient.id}, Archivo:`, file);
              try {
                const result = await apiService.cargarDocumentoCliente(
                  parseInt(updatedClient.id.toString()), 
                  parseInt(documentoId), 
                  file
                );
                console.log(`✅ Documento ${documentoId} subido exitosamente:`, result);
              } catch (error) {
                console.error(`❌ Error subiendo documento ${documentoId}:`, error);
                throw error;
              }
            }
          } else {
            console.log('📄 No hay documentos para subir');
          }

          // 2. Guardar respuestas a preguntas si existen
          if (formData.respuestas && formData.respuestas.length > 0) {
            console.log('❓ Guardando respuestas...');
            for (const respuesta of formData.respuestas) {
              // Buscar el ID de la pregunta en clientQuestions
              const pregunta = clientQuestions.find(q => q.pregunta === respuesta.pregunta);
              if (pregunta) {
                await apiService.guardarRespuestaCliente(
                  parseInt(updatedClient.id.toString()),
                  pregunta.id,
                  respuesta.respuesta,
                  user?.id || 1 // Usar el ID del usuario autenticado
                );
                console.log(`✅ Respuesta guardada exitosamente`);
              }
            }
          }

          // 3. Asignar arma seleccionada si existe
          if (currentSelectedWeapon) {
            console.log('🔫 Asignando arma seleccionada...');
            try {
              // Crear reserva de arma para el cliente
              const precioTotal = precioModificado * cantidad;
              await apiService.crearReservaArma(
                parseInt(updatedClient.id.toString()),
                parseInt(currentSelectedWeapon.id.toString()),
                cantidad,
                precioModificado,
                precioTotal
              );
              console.log('✅ Arma asignada exitosamente');
            } catch (error) {
              console.error('❌ Error asignando arma:', error);
              // No fallar la edición del cliente por errores en la asignación de arma
            }
          }
          
          console.log('✅ Cliente editado con todos los datos adicionales');
        } catch (processError) {
          console.error('❌ Error guardando datos adicionales:', processError);
          alert('⚠️ Cliente actualizado pero hubo problemas guardando documentos/respuestas. Contacte al administrador.');
        }
      } else {
        // Crear nuevo cliente con estado y respuestas
        const respuestasParaBackend = (formData.respuestas || [])
          .filter(r => r.questionId && r.respuesta) // Solo respuestas válidas
          .map(r => ({
            preguntaId: r.questionId,
            respuesta: r.respuesta
          }));
        
        const clientData = {
          ...clientDataForBackend,
          estado: clientStatus,
          respuestas: respuestasParaBackend
        };
        console.log('🔍 Enviando datos completos al backend:', clientData);
        console.log('🔍 Respuestas filtradas:', respuestasParaBackend);
        console.log('🔍 Respuestas originales:', formData.respuestas);
        updatedClient = await apiService.createCliente(clientData as any);
        
        // Si es un cliente nuevo, implementar el proceso básico
        if (updatedClient) {
          console.log('🔄 Proceso básico completado para nuevo cliente...');
          
          try {
            // 1. Subir documentos si existen
            if (Object.keys(uploadedDocuments).length > 0) {
              console.log('📄 Subiendo documentos...');
              console.log('📄 Documentos a subir:', uploadedDocuments);
              for (const [documentoId, file] of Object.entries(uploadedDocuments)) {
                console.log(`📄 Subiendo documento ID: ${documentoId}, Cliente ID: ${updatedClient.id}, Archivo:`, file);
                try {
                  const result = await apiService.cargarDocumentoCliente(
                    parseInt(updatedClient.id.toString()), 
                    parseInt(documentoId), 
                    file
                  );
                  console.log(`✅ Documento ${documentoId} subido exitosamente:`, result);
                } catch (error) {
                  console.error(`❌ Error subiendo documento ${documentoId}:`, error);
                  throw error;
                }
              }
            } else {
              console.log('📄 No hay documentos para subir');
            }

            // 2. Guardar respuestas a preguntas si existen
            if (formData.respuestas && formData.respuestas.length > 0) {
              console.log('❓ Guardando respuestas...');
              for (const respuesta of formData.respuestas) {
                // Buscar el ID de la pregunta en clientQuestions
                const pregunta = clientQuestions.find(q => q.pregunta === respuesta.pregunta);
                if (pregunta) {
                  await apiService.guardarRespuestaCliente(
                    parseInt(updatedClient.id.toString()),
                    pregunta.id,
                    respuesta.respuesta,
                    user?.id || 1 // Usar el ID del usuario autenticado
                  );
                  console.log(`✅ Respuesta guardada exitosamente`);
                }
              }
            }

            console.log('✅ Cliente creado con documentos y respuestas guardados');
            
            // Mostrar mensaje de éxito simple
            alert('✅ Cliente creado exitosamente con todos los datos.');
            
          } catch (processError) {
            console.error('❌ Error en proceso básico:', processError);
            // No fallar la creación del cliente por errores en el proceso
            alert('⚠️ Cliente creado pero hubo problemas guardando documentos/respuestas. Contacte al administrador.');
          }
        }
      }
      
      // Notificar al componente padre sobre el estado de bloqueo
      if (clienteBloqueado) {
        onClienteBloqueado?.(updatedClient.id.toString(), true, motivoBloqueo);
      } else if (client && (client as any).estado === 'BLOQUEADO' && !clienteBloqueado) {
        // Si el cliente estaba bloqueado pero ya no lo está, notificar el desbloqueo
        onClienteBloqueado?.(updatedClient.id.toString(), false, '');
      }
      
      // Si el cliente está listo para importación, ir a la selección de arma
      if (clientStatus === 'LISTO_IMPORTACION') {
        console.log('✅ Cliente listo para importación, navegando a selección de arma...');
        onNavigateToWeaponSelection?.();
      } else {
        // Si no está listo, solo guardar
        onSave(updatedClient as any);
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente. Por favor, intente nuevamente.');
    }
  };

  const getMaxLength = () => {
    switch (formData.tipoIdentificacion) {
      case 'CED': return 10; // Código de Cédula
      case 'RUC': return 13; // Código de RUC
      case 'PAS': return 20; // Código de Pasaporte
      default: return 20;
    }
  };

  // Helper para obtener el nombre del tipo de identificación desde el código
  const getNombreTipoIdentificacion = (codigo: string): string => {
    const tipo = tiposIdentificacion.find(t => t.codigo === codigo);
    return tipo ? tipo.nombre : codigo;
  };

  const validateForm = () => {
    // Validaciones básicas de campos obligatorios
    if (!formData.tipoCliente || !formData.tipoIdentificacion || !formData.numeroIdentificacion || 
        !formData.nombres || !formData.apellidos || !formData.email || !formData.telefonoPrincipal || 
        !formData.direccion || !formData.provincia || !formData.canton || !formData.fechaNacimiento) {
      return false;
    }

    // Validar identificación usando las funciones de validación
    if (!validateIdentificacion(formData.numeroIdentificacion, formData.tipoIdentificacion)) {
      return false;
    }

    // Validar email
    if (!validateEmail(formData.email)) {
      return false;
    }

    // Validar teléfono principal
    if (!validateTelefono(formData.telefonoPrincipal)) {
      return false;
    }

    // Validar teléfono secundario si existe
    if (formData.telefonoSecundario && !validateTelefono(formData.telefonoSecundario)) {
      return false;
    }

    const isEmpresa = formData.tipoCliente === 'Compañía de Seguridad';
    const isUniformadoByType = formData.tipoCliente === 'Militar Fuerza Terrestre' || 
                               formData.tipoCliente === 'Militar Fuerza Naval' || 
                               formData.tipoCliente === 'Militar Fuerza Aérea' || 
                               formData.tipoCliente === 'Uniformado Policial';

    if (isEmpresa) {
      if (!formData.representanteLegal?.trim()) return false;
      if (!formData.ruc?.trim()) return false;
      if (!formData.nombreEmpresa?.trim()) return false;
      if (!formData.direccionFiscal?.trim()) return false;
      if (!formData.telefonoReferencia?.trim()) return false;
      if (!formData.correoEmpresa?.trim()) return false;
      if (!formData.provinciaEmpresa) return false;
      if (!formData.cantonEmpresa) return false;
      
      // Validar RUC de empresa
      if (!validateIdentificacion(formData.ruc, 'RUC')) {
        return false;
      }
      
      // Validar teléfono de referencia
      if (!validateTelefono(formData.telefonoReferencia)) {
        return false;
      }
      
      // Validar correo de empresa
      if (!validateEmail(formData.correoEmpresa)) {
        return false;
      }
    }

    // Para uniformados, validar que tengan estado militar
    if (isUniformadoByType) {
      if (!formData.estadoMilitar) return false;
      
      // Validar código ISSFA para militares activos y pasivos
      if (formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO') {
        if (!formData.codigoIssfa || formData.codigoIssfa.trim() === '') {
          // No mostrar alert, solo validar con borde rojo
          return false;
        }
        
        // Validar que tenga exactamente 10 dígitos (solo borde rojo, sin alert)
        if (formData.codigoIssfa.length !== 10) {
          return false;
        }
        
        // Validar que sea solo números (solo borde rojo, sin alert)
        if (!/^\d{10}$/.test(formData.codigoIssfa)) {
          return false;
        }
      }
    }

    return true;
  };

  // Función para validar si puede continuar con el proceso de armas
  const canContinueWithWeapons = () => {
    // Validar que el formulario esté completo
    if (!validateForm()) {
      return false;
    }
    
    // Validar que no esté bloqueado por violencia
    if (clienteBloqueado) {
      return false;
    }
    
    // Validar edad mínima (25 años)
    if (!edadValida) {
      return false;
    }
    
    return true;
  };

  const edad = formData.fechaNacimiento ? calcularEdad(formData.fechaNacimiento) : null;
  const edadValida = formData.fechaNacimiento ? validarEdadMinima(formData.fechaNacimiento) : false;
  const mensajeErrorEdad = formData.fechaNacimiento ? obtenerMensajeErrorEdad(formData.fechaNacimiento) : 'Fecha de nacimiento no especificada';

  console.log('ClientForm render - mode:', mode, 'client:', client, 'formData:', formData);
  console.log('🔍 Estado de catálogos:', { tiposCliente: tiposCliente.length, tiposIdentificacion: tiposIdentificacion.length });
  console.log('🔍 Datos del cliente recibido:', {
    id: client?.id,
    tipoCliente: client?.tipoCliente,
    tipoIdentificacion: client?.tipoIdentificacion,
    nombres: client?.nombres
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
              {/* Datos Personales */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Datos Personales</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Cliente *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.tipoCliente || 'No especificado'}
                      </div>
                    ) : (
                      <select
                        value={formData.tipoCliente}
                        onChange={(e) => handleInputChange('tipoCliente', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="">Seleccionar tipo</option>
                        {tiposCliente.map(tipo => (
                          <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Identificación *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.tipoIdentificacion ? getNombreTipoIdentificacion(formData.tipoIdentificacion) : 'No especificado'}
                      </div>
                    ) : (
                      <select
                        value={formData.tipoIdentificacion}
                        onChange={(e) => handleInputChange('tipoIdentificacion', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="">Seleccionar tipo</option>
                        {tiposIdentificacion.map(tipo => (
                          <option key={tipo.id} value={tipo.codigo}>{tipo.nombre}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Identificación *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.numeroIdentificacion || 'No especificado'}
                      </div>
                    ) : (
                                             <input
                         type="text"
                         value={formData.numeroIdentificacion}
                         onChange={(e) => handleInputChange('numeroIdentificacion', e.target.value)}
                         required
                         maxLength={getMaxLength()}
                         className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${getBorderColor('numeroIdentificacion', formData.numeroIdentificacion)}`}
                         placeholder={`Ingrese ${formData.tipoIdentificacion ? getNombreTipoIdentificacion(formData.tipoIdentificacion).toLowerCase() : 'número de identificación'}`}
                       />
                    )}
                  </div>

                  {/* Campo Rango - Solo para militares y policías */}
                  {isUniformadoByType && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rango (Opcional)
                      </label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.rango || 'No especificado'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.rango}
                          onChange={(e) => handleInputChange('rango', e.target.value.toUpperCase())}
                          placeholder="Ej: TENIENTE, CAPITÁN, MAYOR, etc."
                          maxLength={100}
                          style={{ textTransform: 'uppercase' }}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                        />
                      )}
                    </div>
                  )}

                                      <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombres *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.nombres || 'No especificado'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.nombres}
                          onChange={(e) => handleInputChange('nombres', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                          placeholder="Ingrese nombres"
                        />
                      )}
                    </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Apellidos *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.apellidos || 'No especificado'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.apellidos}
                        onChange={(e) => handleInputChange('apellidos', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                        placeholder="Ingrese los apellidos"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Nacimiento *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.fechaNacimiento || 'No especificado'}
                      </div>
                    ) : (
                      <>
                        <input
                          type="date"
                          value={formData.fechaNacimiento}
                          onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                          min="1900-01-01"
                          max={(() => {
                            const hoy = new Date();
                            const año = hoy.getFullYear();
                            const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                            const dia = String(hoy.getDate()).padStart(2, '0');
                            return `${año}-${mes}-${dia}`;
                          })()}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Rango válido: 1900 - {new Date().getFullYear()} • El cliente debe tener al menos 25 años
                        </p>
                      </>
                    )}
                    {formData.fechaNacimiento && edad !== null && (
                      <div className={`mt-2 p-3 rounded-lg text-sm ${edadValida ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        <span className="font-medium">Edad: {edad} años</span>
                        {!edadValida && (
                          <div className="mt-2">
                            <p className="font-bold">⚠️ CLIENTE INHABILITADO PARA COMPRA DE ARMAS</p>
                            <p className="mt-1">{mensajeErrorEdad}</p>
                            <p className="mt-1 text-xs">El cliente se guardará pero NO podrá seleccionar armas hasta cumplir 25 años.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.email || 'No especificado'}
                      </div>
                    ) : (
                                               <input
                           type="email"
                           value={formData.email}
                           onChange={(e) => handleInputChange('email', e.target.value)}
                           required
                           className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${getBorderColor('email', formData.email)}`}
                           placeholder="ejemplo@correo.com"
                         />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono Principal *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.telefonoPrincipal || 'No especificado'}
                      </div>
                    ) : (
                                               <input
                           type="tel"
                           value={formData.telefonoPrincipal}
                           onChange={(e) => handleInputChange('telefonoPrincipal', e.target.value)}
                           required
                           className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${getBorderColor('telefonoPrincipal', formData.telefonoPrincipal)}`}
                           placeholder="0999999999"
                         />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono Secundario</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.telefonoSecundario || 'No especificado'}
                      </div>
                    ) : (
                                               <input
                           type="tel"
                           value={formData.telefonoSecundario}
                           onChange={(e) => handleInputChange('telefonoSecundario', e.target.value)}
                           className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${getBorderColor('telefonoSecundario', formData.telefonoSecundario || '')}`}
                           placeholder="0999999999 (opcional)"
                         />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Provincia *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {getNombreProvincia(formData.provincia)}
                      </div>
                    ) : (
                      <select
                        value={formData.provincia}
                        onChange={(e) => handleInputChange('provincia', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="">Seleccionar provincia</option>
                        {provincias.map(provincia => (
                          <option key={provincia.codigo} value={provincia.codigo}>{provincia.nombre}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cantón *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.canton || 'No especificado'}
                      </div>
                    ) : (
                      <select
                        value={formData.canton}
                        onChange={(e) => handleInputChange('canton', e.target.value)}
                        disabled={!formData.provincia}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      >
                        <option value="">Seleccionar cantón</option>
                        {availableCantons.map((canton, index) => (
                          <option key={`canton-${index}-${canton}`} value={canton}>{canton}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.direccion || 'No especificado'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                        placeholder="Ingrese la dirección completa"
                      />
                    )}
                  </div>

                  {isUniformadoByType && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Estado Militar *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.estadoMilitar || 'No especificado'}
                        </div>
                      ) : (
                        <select
                          value={formData.estadoMilitar}
                          onChange={(e) => handleInputChange('estadoMilitar', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Seleccionar estado</option>
                          <option value="ACTIVO">Activo</option>
                          <option value="PASIVO">Pasivo</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* Campo Código ISSFA para tipos militares específicos */}
                  {isMilitaryType && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Código ISSFA {formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO' ? '*' : ''}
                      </label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.codigoIssfa || 'No especificado'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.codigoIssfa}
                          onChange={(e) => {
                            // Solo permitir números de hasta 10 dígitos
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            handleInputChange('codigoIssfa', value);
                          }}
                          placeholder="Ingrese código ISSFA de 10 dígitos"
                          required={formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO'}
                          maxLength={10}
                          pattern="\d{10}"
                          className={`w-full px-4 py-3 border-2 ${getBorderColor('codigoIssfa', formData.codigoIssfa || '')} rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200`}
                        />
                      )}
                    </div>
                  )}

                  {/* Mensaje informativo para uniformados en estado pasivo */}
                  {isUniformadoByType && formData.estadoMilitar === 'PASIVO' && (
                    <div className="md:col-span-2">
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
                        <div className="flex items-start">
                          <div className="bg-yellow-100 p-2 rounded-full mr-4 mt-1">
                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Proceso como Cliente Civil</h3>
                            <p className="text-yellow-700">
                              Al estar en estado pasivo, el proceso continuará como cliente Civil. 
                              Se aplicarán las preguntas y documentos correspondientes a clientes Civiles.
                              El código ISSFA es obligatorio.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                </div>
              </div>

              {/* Datos de Empresa */}
              {isEmpresa && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Datos de la Empresa</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Representante Legal *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.representanteLegal || 'No especificado'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.representanteLegal}
                          onChange={(e) => handleInputChange('representanteLegal', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                          placeholder="Nombres y apellidos del representante"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">RUC *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.ruc || 'No especificado'}
                        </div>
                      ) : (
                                                 <input
                           type="text"
                           value={formData.ruc}
                           onChange={(e) => handleInputChange('ruc', e.target.value)}
                           required
                           maxLength={13}
                           className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 ${getBorderColor('ruc', formData.ruc || '')}`}
                           placeholder="1234567890001"
                         />
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Empresa *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.nombreEmpresa || 'No especificado'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.nombreEmpresa}
                          onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                          placeholder="Nombre completo de la empresa"
                        />
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección Fiscal *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.direccionFiscal || 'No especificado'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.direccionFiscal}
                          onChange={(e) => handleInputChange('direccionFiscal', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                          placeholder="Dirección fiscal de la empresa"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono de Referencia *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.telefonoReferencia || 'No especificado'}
                        </div>
                      ) : (
                                                 <input
                           type="tel"
                           value={formData.telefonoReferencia}
                           onChange={(e) => handleInputChange('telefonoReferencia', e.target.value)}
                           required
                           className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 ${getBorderColor('telefonoReferencia', formData.telefonoReferencia || '')}`}
                           placeholder="Teléfono de la empresa"
                         />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Correo de la Empresa *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.correoEmpresa || 'No especificado'}
                        </div>
                      ) : (
                                                 <input
                           type="email"
                           value={formData.correoEmpresa}
                           onChange={(e) => handleInputChange('correoEmpresa', e.target.value)}
                           required
                           className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 ${getBorderColor('correoEmpresa', formData.correoEmpresa || '')}`}
                           placeholder="correo@empresa.com"
                         />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Provincia de la Empresa *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {getNombreProvincia(formData.provinciaEmpresa)}
                        </div>
                      ) : (
                        <select
                          value={formData.provinciaEmpresa}
                          onChange={(e) => handleInputChange('provinciaEmpresa', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                        >
                          <option value="">Seleccionar provincia</option>
                          {provincias.map(provincia => (
                            <option key={provincia.codigo} value={provincia.codigo}>{provincia.nombre}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cantón de la Empresa *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.cantonEmpresa || 'No especificado'}
                        </div>
                      ) : (
                        <select
                          value={formData.cantonEmpresa}
                          onChange={(e) => handleInputChange('cantonEmpresa', e.target.value)}
                          disabled={!formData.provinciaEmpresa}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                        >
                          <option value="">Seleccionar cantón</option>
                          {availableCantonsEmpresa.map((canton, index) => (
                            <option key={`canton-empresa-${index}-${canton}`} value={canton}>{canton}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
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

              {/* Documentos del Cliente */}
              {formData.tipoCliente && requiredDocuments.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-3 rounded-full mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Documentos del Cliente</h2>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border-2 ${getDocumentStatusColor()}`}>
                      <span className="font-semibold">{getDocumentStatusText()}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredDocuments.map((document) => (
                      <div 
                        key={document.id} 
                        className={`bg-white p-4 rounded-xl border-2 transition-all duration-200 ${
                          document.urlDocumento 
                            ? 'border-blue-200 hover:border-blue-300' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${
                          uploadedDocuments[document.nombre] 
                            ? 'bg-green-50 border-green-300' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{document.nombre}</h3>
                            <p className="text-sm text-gray-500 mb-2">{document.descripcion}</p>
                            <div className="flex flex-wrap gap-2">
                              {document.urlDocumento && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                  </svg>
                                  📄 En Línea
                                </span>
                              )}
                              {document.obligatorio && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Obligatorio
                                </span>
                              )}
                              {(uploadedDocuments[document.id.toString()] || loadedDocuments[document.nombre]) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Subido
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {document.urlDocumento && (
                          <div className="mb-3 flex justify-center">
                            <a 
                              href={document.urlDocumento} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                            >
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                              Acceder a la Fuente Oficial
                            </a>
                          </div>
                        )}
                        
                        {/* Mostrar documento cargado */}
                        {loadedDocuments[document.nombre] ? (
                          <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium text-green-800">
                                  {loadedDocuments[document.nombre].nombreArchivo}
                                </span>
                              </div>
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                {loadedDocuments[document.nombre].estado}
                              </span>
                            </div>
                            
                            {/* Previsualización del documento */}
                            <div className="mb-3">
                              <iframe
                                src={`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve/${loadedDocuments[document.nombre].id}`}
                                className="w-full h-64 border border-gray-300 rounded-lg"
                                title={`Previsualización de ${document.nombre}`}
                              />
                            </div>
                            
                            {/* Botones de acción */}
                            <div className="flex gap-2">
                              <a 
                                href={`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve/${loadedDocuments[document.nombre].id}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                                Abrir en Nueva Pestaña
                              </a>
                              
                              {mode !== 'view' && (
                                <button
                                  onClick={() => {
                                    // TODO: Implementar función para reemplazar documento
                                    console.log('Reemplazar documento:', document.nombre);
                                  }}
                                  className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                  </svg>
                                  Reemplazar
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <input
                            type="file"
                            disabled={mode === 'view'}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentUpload(document.nombre, file);
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preguntas de Seguridad */}
              {formData.tipoCliente && clientQuestions.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Preguntas de Seguridad</h2>
                  </div>

                  {/* Advertencia de Cliente Bloqueado */}
                  {clienteBloqueado && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
                      <div className="flex items-start">
                        <div className="bg-red-100 p-2 rounded-full mr-4 mt-1">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-red-800 mb-2">CLIENTE BLOQUEADO</h3>
                          <p className="text-red-700 mb-3">
                            <strong>Motivo:</strong> {motivoBloqueo}
                          </p>
                          <p className="text-red-600 text-sm">
                            ⚠️ El cliente puede ser guardado pero NO podrá continuar con el proceso de selección de armas.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {clientQuestions.map((question) => {
                      console.log('Rendering question:', { 
                        id: question.id, 
                        pregunta: question.pregunta, 
                        tipoRespuesta: question.tipoRespuesta,
                        currentValue: getAnswerForQuestion(question.pregunta),
                        isViolenceQuestion: question.pregunta.includes('denuncias de violencia'),
                        fullQuestion: question
                      });
                      return (
                      <div key={question.id} className="bg-white p-4 rounded-xl border-2 border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2">{question.pregunta}</h3>
                            <div className="flex flex-wrap gap-2">
                              {question.obligatoria && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Obligatoria
                                </span>
                              )}
                              {question.tipoRespuesta === 'SI_NO' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  SI/NO
                                </span>
                              )}
                              {question.bloquea_proceso && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Bloquea Proceso
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {mode === 'view' ? (
                          <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                            {getAnswerForQuestion(question.pregunta) || 'Sin respuesta'}
                          </div>
                        ) : (
                          question.tipoRespuesta === 'SI_NO' ? (
                            <div className="space-y-3">
                              {/* Primer dropdown: SI/NO */}
                              <select
                                key={`${question.id}-${getAnswerForQuestion(question.pregunta)}`}
                                value={getAnswerForQuestion(question.pregunta)?.startsWith('SI') ? 'SI' : getAnswerForQuestion(question.pregunta)?.startsWith('NO') ? 'NO' : ''}
                                onChange={(e) => {
                                  console.log('Dropdown SI/NO onChange triggered:', { 
                                    question: question.pregunta, 
                                    newValue: e.target.value,
                                    currentValue: getAnswerForQuestion(question.pregunta)
                                  });
                                  
                                  if (e.target.value === 'NO') {
                                    // Si es NO, solo guardar NO
                                    handleAnswerChange(question.pregunta, 'NO', question.id);
                                  } else if (e.target.value === 'SI') {
                                    // Si es SI, mantener el valor actual si ya tiene cantidad, o poner solo SI
                                    const currentAnswer = getAnswerForQuestion(question.pregunta);
                                    if (currentAnswer && currentAnswer.startsWith('SI')) {
                                      handleAnswerChange(question.pregunta, currentAnswer, question.id);
                                    } else {
                                      handleAnswerChange(question.pregunta, 'SI', question.id);
                                    }
                                  }
                                }}
                                required={question.obligatoria}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                              >
                                <option value="">Seleccionar respuesta</option>
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                              </select>

                              {/* Segundo dropdown: Cantidad de armas (solo si responde SI y es la pregunta de armas registradas) */}
                              {getAnswerForQuestion(question.pregunta)?.startsWith('SI') && 
                               question.pregunta.toLowerCase().includes('armas registradas') && (
                                <select
                                  value={getAnswerForQuestion(question.pregunta)?.includes('1 arma') ? '1 arma' : 
                                         getAnswerForQuestion(question.pregunta)?.includes('2 armas') ? '2 armas' : 
                                         getAnswerForQuestion(question.pregunta)?.includes('más armas') ? 'más armas' : ''}
                                  onChange={(e) => {
                                    console.log('Dropdown cantidad onChange triggered:', { 
                                      question: question.pregunta, 
                                      newValue: e.target.value
                                    });
                                    
                                    // Combinar SI con la cantidad seleccionada
                                    const combinedAnswer = `SI, ${e.target.value}`;
                                    handleAnswerChange(question.pregunta, combinedAnswer, question.id);
                                  }}
                                  required={question.obligatoria}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                                >
                                  <option value="">Seleccionar cantidad</option>
                                  <option value="1 arma">1 arma</option>
                                  <option value="2 armas">2 armas</option>
                                  <option value="más armas">más armas</option>
                                </select>
                              )}
                            </div>
                          ) : (
                            <textarea
                              value={getAnswerForQuestion(question.pregunta)}
                              onChange={(e) => handleAnswerChange(question.pregunta, e.target.value, question.id)}
                              required={question.obligatoria}
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 resize-none"
                              placeholder="Escriba su respuesta aquí..."
                            />
                          )
                        )}
                      </div>
                    );
                    })}
                  </div>
                  
                  {/* Aviso de bloqueo por exceso de armas */}
                  {clienteBloqueado && motivoBloqueo.includes('arma registrada') && (
                    <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-lg font-semibold text-red-800 mb-2">
                            ⚠️ Cliente Bloqueado para Selección de Armas
                          </h3>
                          <p className="text-red-700 mb-3">
                            {motivoBloqueo}
                          </p>
                          <p className="text-sm text-red-600 font-medium">
                            El cliente puede ser guardado en el sistema, pero NO podrá continuar con la selección de armas hasta que se resuelva esta situación.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sección de Arma Reservada - Solo en modo edit */}
              {mode === 'edit' && currentSelectedWeapon && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-yellow-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Arma Reservada</h2>
                      <p className="text-sm text-gray-600">Esta arma está reservada pero aún no tiene número de serie asignado</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Arma</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Modelo:</span>
                          <span className="text-gray-900">{currentSelectedWeapon.nombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Calibre:</span>
                          <span className="text-gray-900">{currentSelectedWeapon.calibre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Código:</span>
                          <span className="text-gray-900">{currentSelectedWeapon.codigo}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Precios y Cantidad</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Precio Unitario:</label>
                          <input
                            type="number"
                            value={precioModificado}
                            onChange={(e) => onPriceChange?.(parseFloat(e.target.value) || 0)}
                            disabled={false}
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad:</label>
                          <input
                            type="number"
                            value={cantidad}
                            onChange={(e) => onQuantityChange?.(parseInt(e.target.value) || 1)}
                            disabled={false}
                            min="1"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                          />
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Subtotal:</span>
                              <span className="text-green-600 font-semibold">${(precioModificado * cantidad).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">IVA ({ivaPorcentaje}%):</span>
                              <span className="text-green-600 font-semibold">${(precioModificado * cantidad * ivaDecimal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t pt-2">
                              <span>Total:</span>
                              <span className="text-green-600">${(precioModificado * cantidad * (1 + ivaDecimal)).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {mode === 'edit' && (
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => onNavigateToWeaponSelection?.()}
                        className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
                      >
                        Cambiar Arma
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sección de Contratos Generados - Solo en modo view */}
              {mode === 'view' && (
                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Contratos Generados</h2>
                      <p className="text-sm text-gray-600 mt-1">Documentos generados al finalizar el proceso de creación del cliente</p>
                    </div>
                  </div>
                  
                  {loadedContratos.length > 0 ? (
                    <div className="space-y-4">
                      {loadedContratos.map((contrato, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl border-2 border-purple-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 mb-2">{contrato.nombreArchivo}</h3>
                              <p className="text-sm text-gray-500 mb-3">{contrato.descripcion}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  📄 Contrato
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Generado
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Previsualización del contrato */}
                          <div className="mb-4">
                            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                              <iframe
                                src={`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve-generated/${contrato.id}`}
                                className="w-full h-96 rounded-lg border-0"
                                title={`Previsualización de ${contrato.nombreArchivo}`}
                              />
                            </div>
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="flex justify-center space-x-3">
                            <button
                              type="button"
                              onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve-generated/${contrato.id}`, '_blank')}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver Contrato</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve-generated/${contrato.id}`;
                                link.download = contrato.nombreArchivo;
                                link.click();
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Descargar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-300 text-center">
                      <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay contratos generados</h3>
                      <p className="text-gray-500 mb-4">Los contratos se generarán automáticamente al finalizar el proceso de creación del cliente.</p>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pendiente de generación
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sección de Armas Asignadas - Solo en modo view */}
              {mode === 'view' && loadedArmas.length > 0 && (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Armas Asignadas</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loadedArmas.map((arma, index) => {
                      const precioSinIva = parseFloat(arma.precioUnitario) || 0;
                      const cantidad = parseInt(arma.cantidad) || 0;
                      const subtotal = precioSinIva * cantidad;
                      const ivaArma = subtotal * ivaDecimal;
                      const totalConIva = subtotal + ivaArma;
                      
                      return (
                        <div key={index} className="bg-white p-4 rounded-xl border-2 border-blue-200">
                          <div className="flex items-start space-x-4">
                            {/* Imagen del arma */}
                            {arma.armaImagen && (
                              <div className="flex-shrink-0">
                                <img 
                                  src={`${arma.armaImagen}?t=${Date.now()}`} 
                                  alt={arma.armaNombre}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Información del arma */}
                            <div className="flex-1 space-y-2">
                              <p><span className="font-medium">Arma:</span> {arma.armaNombre || 'N/A'}</p>
                              <p><span className="font-medium">Modelo:</span> {arma.armaModelo || 'N/A'}</p>
                              <p><span className="font-medium">Código:</span> {arma.armaCodigo || 'N/A'}</p>
                              {arma.numeroSerie && (
                                <p>
                                  <span className="font-medium">Número de Serie:</span>{' '}
                                  <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                                    {arma.numeroSerie}
                                  </span>
                                </p>
                              )}
                              {arma.estado && (
                                <p>
                                  <span className="font-medium">Estado:</span>{' '}
                                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                    arma.estado === 'ASIGNADA' ? 'bg-green-100 text-green-800' :
                                    arma.estado === 'RESERVADA' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {arma.estado}
                                  </span>
                                </p>
                              )}
                              <p><span className="font-medium">Cantidad:</span> {cantidad}</p>
                              <p><span className="font-medium">Precio Unitario (sin IVA):</span> ${precioSinIva.toFixed(2)}</p>
                              <div className="border-t pt-2 mt-2">
                                <p><span className="font-medium">Subtotal:</span> ${subtotal.toFixed(2)}</p>
                                <p><span className="font-medium">IVA ({ivaPorcentaje}%):</span> ${ivaArma.toFixed(2)}</p>
                                <p className="font-bold text-lg"><span className="font-medium">Total (con IVA):</span> ${totalConIva.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sección de Pagos - Solo en modo view */}
              {mode === 'view' && loadedPagos.length > 0 && (
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Información de Pagos</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loadedPagos.map((pago, index) => {
                      const montoTotal = parseFloat(pago.montoTotal) || 0;
                      const subtotal = montoTotal / (1 + ivaDecimal); // Calcular subtotal sin IVA
                      const ivaPago = montoTotal - subtotal; // Calcular IVA
                      
                      return (
                        <div key={index} className="bg-white p-4 rounded-xl border-2 border-green-200">
                          <div className="space-y-2">
                            <p><span className="font-medium">Tipo de Pago:</span> {pago.tipoPago || 'N/A'}</p>
                            <p><span className="font-medium">Estado:</span> {pago.estado || 'N/A'}</p>
                            <p><span className="font-medium">Fecha de Creación:</span> {pago.fechaCreacion ? new Date(pago.fechaCreacion).toLocaleDateString('es-ES') : 'N/A'}</p>
                            <div className="border-t pt-2 mt-2">
                              <p><span className="font-medium">Subtotal (sin IVA):</span> ${subtotal.toFixed(2)}</p>
                              <p><span className="font-medium">IVA ({ivaPorcentaje}%):</span> ${ivaPago.toFixed(2)}</p>
                              <p className="font-bold text-lg"><span className="font-medium">Total (con IVA):</span> ${montoTotal.toFixed(2)}</p>
                            </div>
                            {pago.numeroCuotas && (
                              <p><span className="font-medium">Número de Cuotas:</span> {pago.numeroCuotas}</p>
                            )}
                            {pago.montoCuota && (
                              <p><span className="font-medium">Monto por Cuota:</span> ${parseFloat(pago.montoCuota).toFixed(2)}</p>
                            )}
                            {pago.montoPagado && (
                              <p><span className="font-medium">Monto Pagado:</span> ${parseFloat(pago.montoPagado).toFixed(2)}</p>
                            )}
                            {pago.montoPendiente && (
                              <p><span className="font-medium">Monto Pendiente:</span> ${parseFloat(pago.montoPendiente).toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
                  >
                    Editar Cliente
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
                          const clientDataForBackend = {
                            nombres: formData.nombres,
                            apellidos: formData.apellidos,
                            numeroIdentificacion: formData.numeroIdentificacion,
                            tipoIdentificacionCodigo: mapTipoIdentificacionToCode(formData.tipoIdentificacion),
                            tipoClienteCodigo: mapTipoClienteToCode(formData.tipoCliente),
                            fechaNacimiento: formData.fechaNacimiento,
                            direccion: formData.direccion,
                            provincia: formData.provincia,
                            canton: formData.canton,
                            email: formData.email,
                            telefonoPrincipal: formData.telefonoPrincipal,
                            telefonoSecundario: formData.telefonoSecundario,
                            representanteLegal: formData.representanteLegal || '',
                            ruc: formData.ruc || '',
                            nombreEmpresa: formData.nombreEmpresa || '',
                            direccionFiscal: formData.direccionFiscal || '',
                            telefonoReferencia: formData.telefonoReferencia || '',
                            correoEmpresa: formData.correoEmpresa || '',
                            provinciaEmpresa: formData.provinciaEmpresa || '',
                            cantonEmpresa: formData.cantonEmpresa || '',
                            estadoMilitar: formData.estadoMilitar || '',
                            codigoIssfa: formData.codigoIssfa || '',
                            rango: formData.rango || '',
                            usuarioCreadorId: user?.id // Incluir ID del usuario que crea el cliente
                          };
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
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        disabled={!validateForm()}
                      >
                        ✅ Actualizar Cliente
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