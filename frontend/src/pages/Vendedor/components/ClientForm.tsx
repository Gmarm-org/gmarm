import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { validarEdadMinima } from '../../../utils/ageValidation';
import { validateIdentificacion, validateTelefono, validateEmail } from '../../../utils/validations';
import { mapTipoIdentificacionToCode } from '../../../utils/typeMappers';
import { useTiposClienteConfig } from '../../../contexts/TiposClienteContext';
import { useIVA } from '../../../hooks/useConfiguracion';
import type { Client } from '../types';
import type { Weapon } from '../types';

// Hooks refactorizados
import { useClientFormData } from '../hooks/useClientFormData';
import { useClientCatalogs } from '../hooks/useClientCatalogs';
import { useClientDocuments } from '../hooks/useClientDocuments';
import { useClientAnswers } from '../hooks/useClientAnswers';
// useClientSubmit preparado para integrar cuando se simplifique handleSubmit
// import { useClientSubmit } from '../hooks/useClientSubmit';

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
  
  // Log para diagnosticar el estado del arma
  useEffect(() => {
    console.log('🔍 DEBUG currentSelectedWeapon:', currentSelectedWeapon);
    console.log('🔍 DEBUG localSelectedWeapon:', localSelectedWeapon);
    console.log('🔍 DEBUG selectedWeapon prop:', selectedWeapon);
  }, [currentSelectedWeapon, localSelectedWeapon, selectedWeapon]);

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
        console.error('Error verificando disponibilidad de grupos:', error);
      }
    };

    verificarDisponibilidad();
  }, [formData.tipoCliente, formData.estadoMilitar, mode, getCodigoTipoCliente, esUniformado, onCancel, tiposClienteLoading]);
  
  // Función para cargar datos adicionales del cliente
  const loadClientData = useCallback(async (clienteId: number) => {
    try {
      console.log('🔄 Cargando datos adicionales del cliente:', clienteId);
      
      // OPTIMIZACIÓN CRÍTICA: NO cargar respuestas aquí
      // Las respuestas se cargan automáticamente por useClientAnswers hook
      // Esto evita cargas duplicadas y procesamiento innecesario
      
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
      
      // Cargar armas asignadas al cliente (solo para mostrar en el formulario)
      const armasCliente = await apiService.getArmasCliente(clienteId);
      console.log('🔫 Armas del cliente cargadas:', armasCliente);
      setLoadedArmas(armasCliente || []);
      
      // OPTIMIZACIÓN: No cargar pagos y contratos aquí, solo cuando se necesiten (no se usan en el formulario)
      // Esto reduce significativamente el tiempo de carga
      setLoadedPagos([]);
      setLoadedContratos([]);
      
      // Si hay armas asignadas, actualizar el precio modificado y selectedWeapon
      if (armasCliente && armasCliente.length > 0) {
        const armaAsignada = armasCliente[0]; // Tomar la primera arma
        console.log('💰 Arma asignada encontrada:', armaAsignada);
        
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
          console.log('📦 Armas en stock del vendedor:', armas);
          setArmasEnStock(armas || []);
        } catch (error) {
          console.error('❌ Error cargando armas en stock:', error);
          setArmasEnStock([]);
        }
      };
      
      cargarArmasEnStock();
    }
  }, [mode, user?.id]);
  
 // Función para asignar un arma del stock al nuevo cliente
  const handleAsignarArmaDelStock = useCallback((armaEnStock: any) => {
    console.log('🔫 Asignando arma del stock al nuevo cliente:', armaEnStock);
    
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
        codigoIssfa: client.codigoIssfa || '', // Para militares
        codigoIsspol: (client as any).codigoIsspol || '', // Para policías (nuevo campo)
        rango: client.rango || '',
        documentos: client.documentos || [],
        respuestas: [] // Inicializar vacío - se cargarán por useClientAnswers cuando detecte el clientId
      });
      
      console.log('✅ Datos del formulario restaurados correctamente');
      console.log('📋 Client ID para cargar respuestas:', client.id);
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
    console.log('ClientForm useEffect triggered:', { client, mode, clientId: client?.id });
    
    if (client && mode !== 'create') {
      console.log('Setting form data from client:', client);
      
      // Solo establecer formData si los catálogos están disponibles
      if (tiposCliente.length > 0 && tiposIdentificacion.length > 0) {
        // Mapear las claves foráneas a nombres descriptivos para los dropdowns
        const mappedClient = { ...client };
        
        // Mapear tipoCliente: debe ser el NOMBRE para que coincida con el select (value={tipo.nombre})
        // Priorizar tipoClienteNombre del backend, luego tipoCliente si es nombre, luego mapear desde código
        if (client.tipoClienteNombre) {
          // El backend ya devuelve el nombre, usar directamente
          mappedClient.tipoCliente = client.tipoClienteNombre;
          console.log('✅ TipoCliente desde tipoClienteNombre:', client.tipoClienteNombre);
        } else if (client.tipoCliente) {
          // Verificar si tipoCliente es nombre o código
          const tipoClientePorNombre = tiposCliente.find(tc => tc.nombre === client.tipoCliente);
          const tipoClientePorCodigo = tiposCliente.find(tc => tc.codigo === client.tipoCliente);
          
          if (tipoClientePorNombre) {
            // Ya es nombre, mantenerlo
            mappedClient.tipoCliente = tipoClientePorNombre.nombre;
            console.log('✅ TipoCliente ya es nombre:', client.tipoCliente);
          } else if (tipoClientePorCodigo) {
            // Es código, convertir a nombre
            mappedClient.tipoCliente = tipoClientePorCodigo.nombre;
            console.log('✅ TipoCliente convertido de código a nombre:', { codigo: client.tipoCliente, nombre: tipoClientePorCodigo.nombre });
          } else {
            // Si no se encuentra, asumir que es nombre (fallback)
            mappedClient.tipoCliente = client.tipoCliente;
            console.log('⚠️ TipoCliente no encontrado en catálogo, usando valor original:', client.tipoCliente);
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
            console.log('✅ TipoIdentificacion ya es código, manteniendo:', client.tipoIdentificacion);
          } else {
            // No se encontró por código, puede ser nombre, intentar buscar por nombre
            const tipoIdentificacionPorNombre = tiposIdentificacion.find(ti => ti.nombre === client.tipoIdentificacion);
            if (tipoIdentificacionPorNombre) {
              // Es nombre, convertir a código
              mappedClient.tipoIdentificacion = tipoIdentificacionPorNombre.codigo;
              console.log('✅ TipoIdentificacion convertida de nombre a código:', { 
                original: client.tipoIdentificacion, 
                codigo: tipoIdentificacionPorNombre.codigo 
              });
            } else {
              // Si no se encuentra, usar el valor original (fallback)
              mappedClient.tipoIdentificacion = client.tipoIdentificacion;
              console.log('⚠️ TipoIdentificacion no encontrada en catálogo, usando valor original:', client.tipoIdentificacion);
            }
          }
        } else if (client.tipoIdentificacionNombre) {
          // Si solo tenemos el nombre del backend, buscar el código correspondiente
          const tipoIdentificacionPorNombre = tiposIdentificacion.find(ti => ti.nombre === client.tipoIdentificacionNombre);
          if (tipoIdentificacionPorNombre) {
            mappedClient.tipoIdentificacion = tipoIdentificacionPorNombre.codigo;
            console.log('✅ TipoIdentificacion convertida de tipoIdentificacionNombre a código:', { 
              nombre: client.tipoIdentificacionNombre, 
              codigo: tipoIdentificacionPorNombre.codigo 
            });
          } else {
            console.log('⚠️ No se encontró tipoIdentificacionNombre en catálogo:', client.tipoIdentificacionNombre);
            mappedClient.tipoIdentificacion = '';
          }
        }
        
        // Mapear código ISSFA si está disponible (para militares)
        if ((client as any).codigoIssfa) {
          (mappedClient as any).codigoIssfa = (client as any).codigoIssfa;
          console.log('✅ Código ISSFA cargado:', (client as any).codigoIssfa);
        }
        
        // Mapear código ISSPOL si está disponible (para policías)
        if ((client as any).codigoIsspol) {
          (mappedClient as any).codigoIsspol = (client as any).codigoIsspol;
          console.log('✅ Código ISSPOL cargado:', (client as any).codigoIsspol);
        }
        
        // Mapear rango si está disponible
        if ((client as any).rango) {
          (mappedClient as any).rango = (client as any).rango;
          console.log('✅ Rango cargado:', (client as any).rango);
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
            console.log('✅ Provincia ya es código, manteniendo:', client.provincia);
          } else if (provinciaPorNombre) {
            // Es nombre, convertir a código
            mappedClient.provincia = provinciaPorNombre.codigo;
            console.log('✅ Provincia convertida de nombre a código:', { 
              original: client.provincia, 
              codigo: provinciaPorNombre.codigo 
            });
          } else {
            // Si no se encuentra, usar el valor original (puede ser código válido que no está en el catálogo)
            mappedClient.provincia = client.provincia;
            console.log('⚠️ Provincia no encontrada en catálogo, usando valor original:', client.provincia);
          }
        } else {
          console.log('⚠️ Cliente no tiene provincia');
        }
        
        // Asegurar que tipoCliente esté establecido (verificación final)
        if (!mappedClient.tipoCliente && client.tipoClienteNombre) {
          mappedClient.tipoCliente = client.tipoClienteNombre;
          console.log('✅ TipoCliente establecido desde tipoClienteNombre (verificación final):', client.tipoClienteNombre);
        }
        
        console.log('🔍 Mapeando cliente:', { 
          original: { 
            tipoCliente: client.tipoCliente, 
            tipoClienteNombre: client.tipoClienteNombre,
            tipoIdentificacion: client.tipoIdentificacion,
            provincia: client.provincia
          },
          mapeado: { 
            tipoCliente: mappedClient.tipoCliente, 
            tipoIdentificacion: mappedClient.tipoIdentificacion,
            provincia: mappedClient.provincia
          }
        });
        
        console.log('Mapped client data:', mappedClient);
        
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
        console.log('Catálogos no disponibles aún, esperando...');
        // Establecer el formData básico del cliente mientras se cargan los catálogos
        // OPTIMIZACIÓN: NO incluir respuestas aquí - se cargarán por useClientAnswers
        setFormData({
          ...client,
          respuestas: [] // Inicializar vacío - se cargarán por useClientAnswers
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

  // Función para mapear tipoCliente descriptivo a código (ahora usando configuración dinámica)
  const mapTipoClienteToCode = (tipoCliente: string | undefined): string => {
    return getCodigoTipoCliente(tipoCliente);
  };

  // Función helper para construir clientDataForBackend (evita duplicación)
  const buildClientDataForBackend = () => {
    return {
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
      estadoMilitar: formData.estadoMilitar && formData.estadoMilitar.trim() !== '' ? formData.estadoMilitar : undefined,
      codigoIssfa: formData.codigoIssfa || '', // Para militares
      codigoIsspol: formData.codigoIsspol || '', // Para policías (nuevo campo)
      rango: formData.rango || '',
      usuarioCreadorId: user?.id // Incluir ID del usuario que crea el cliente
    };
  };

  // Nota: La lógica de guardar datos adicionales (documentos, respuestas, armas) 
  // ahora está manejada por el hook useClientSubmit (handleCreateCliente/handleUpdateCliente)

  // Estado para controlar el proceso de envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const resolveDocumentoId = (key: string, file: File) => {
    const parsedId = parseInt(key);
    if (!Number.isNaN(parsedId)) {
      const docById = requiredDocuments.find(doc => doc.id.toString() === key);
      return { tipoDocumentoId: parsedId, documentNombre: docById?.nombre || key };
    }

    const documentoEncontrado = requiredDocuments.find(doc => doc.nombre === key || doc.id.toString() === key);
    if (documentoEncontrado) {
      return { tipoDocumentoId: documentoEncontrado.id, documentNombre: documentoEncontrado.nombre };
    }

    const numericEntry = Object.entries(uploadedDocuments).find(([k, v]) => {
      const numericId = parseInt(k);
      return !Number.isNaN(numericId) && v === file;
    });

    if (numericEntry) {
      return { tipoDocumentoId: parseInt(numericEntry[0]), documentNombre: key };
    }

    return { tipoDocumentoId: null, documentNombre: key };
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log('⏳ Ya se está procesando una actualización...');
      return;
    }
    
    setIsSubmitting(true);
    console.log('🔄 Iniciando proceso de actualización...');
    
    try {
      if (!validateForm()) {
        alert('Por favor, corrija los errores en el formulario antes de continuar.');
        return;
      }

      // Validar si la cédula ya existe (solo en modo crear)
      if (mode === 'create' && formData.numeroIdentificacion) {
        try {
          const validacion = await apiService.validarIdentificacion(formData.numeroIdentificacion);
          if (validacion.existe) {
            setIsSubmitting(false);
            alert(`⚠️ ${validacion.mensaje}\n\nSi desea ver o editar este cliente, búsquelo en la lista de clientes.`);
            return;
          }
        } catch (validacionError) {
          console.warn('No se pudo validar la identificación, continuando...', validacionError);
        }
      }

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
      
      const clientDataForBackend = buildClientDataForBackend();

      let updatedClient;
      if (mode === 'edit' && client) {
        // OPTIMIZACIÓN: Detectar solo los campos que cambiaron
        // Usar buildClientDataForBackend para obtener los datos con códigos mapeados correctamente
        const clientDataForBackend = buildClientDataForBackend();
        const clienteOriginal = client;
        const cambiosCliente: any = {};
        
        // Mapear el cliente original a formato backend para comparación correcta
        const clienteOriginalBackend = {
          nombres: clienteOriginal.nombres,
          apellidos: clienteOriginal.apellidos,
          numeroIdentificacion: clienteOriginal.numeroIdentificacion,
          tipoIdentificacionCodigo: mapTipoIdentificacionToCode(clienteOriginal.tipoIdentificacion),
          tipoClienteCodigo: mapTipoClienteToCode(clienteOriginal.tipoCliente),
          fechaNacimiento: clienteOriginal.fechaNacimiento,
          direccion: clienteOriginal.direccion,
          provincia: clienteOriginal.provincia,
          canton: clienteOriginal.canton,
          email: clienteOriginal.email,
          telefonoPrincipal: clienteOriginal.telefonoPrincipal,
          telefonoSecundario: clienteOriginal.telefonoSecundario,
          representanteLegal: (clienteOriginal as any).representanteLegal || '',
          ruc: (clienteOriginal as any).ruc || '',
          nombreEmpresa: (clienteOriginal as any).nombreEmpresa || '',
          direccionFiscal: (clienteOriginal as any).direccionFiscal || '',
          telefonoReferencia: (clienteOriginal as any).telefonoReferencia || '',
          correoEmpresa: (clienteOriginal as any).correoEmpresa || '',
          provinciaEmpresa: (clienteOriginal as any).provinciaEmpresa || '',
          cantonEmpresa: (clienteOriginal as any).cantonEmpresa || '',
          estadoMilitar: (clienteOriginal as any).estadoMilitar || undefined,
          codigoIssfa: (clienteOriginal as any).codigoIssfa || '', // Para militares
          codigoIsspol: (clienteOriginal as any).codigoIsspol || '', // Para policías (nuevo campo)
          rango: (clienteOriginal as any).rango || ''
        };
        
        // Comparar campos mapeados correctamente
        Object.keys(clientDataForBackend).forEach(campo => {
          if (campo === 'usuarioCreadorId') return; // No comparar usuarioCreadorId
          
          const valorOriginal = clienteOriginalBackend[campo as keyof typeof clienteOriginalBackend];
          const valorNuevo = clientDataForBackend[campo as keyof typeof clientDataForBackend];
          
          // Comparar valores, manejando undefined y strings vacíos
          const valorOriginalNormalizado = valorOriginal === undefined || valorOriginal === null ? '' : String(valorOriginal);
          const valorNuevoNormalizado = valorNuevo === undefined || valorNuevo === null ? '' : String(valorNuevo);
          
          if (valorNuevoNormalizado !== valorOriginalNormalizado) {
            cambiosCliente[campo] = valorNuevo;
          }
        });
        
        // Siempre incluir el estado si cambió
        if (clientStatus !== clienteOriginal.estado) {
          cambiosCliente.estado = clientStatus;
        }
        
        // Solo enviar cambios si hay algo que actualizar
        const requestDataForBackend: any = {};
        
        if (Object.keys(cambiosCliente).length > 0) {
          requestDataForBackend.cliente = {
            ...cambiosCliente,
            id: client.id // Mantener el ID
          };
        }
        
        // Solo enviar respuestas si hay cambios
        const respuestasActuales = (formData.respuestas || []).filter((r: any) => r.respuesta && r.respuesta.trim() !== '');
        if (respuestasActuales.length > 0) {
          requestDataForBackend.respuestas = respuestasActuales.map((r: any) => ({
            pregunta: r.pregunta,
            respuesta: r.respuesta,
            tipo: r.tipo || 'TEXTO',
            preguntaId: r.questionId || r.preguntaId || r.id || null
          }));
        }
        
        // Incluir arma si existe (igual que en creación) - El backend decide si crear o actualizar
        if (currentSelectedWeapon && !clienteArmaIdDelStock) {
          console.log('🔫 Incluyendo arma en requestData para actualización (PATCH)');
          console.log('💰 DEBUG - precioModificado que se enviará:', precioModificado);
          const precioTotal = precioModificado * cantidad;
          requestDataForBackend.arma = {
            armaId: parseInt(currentSelectedWeapon.id.toString()),
            cantidad: cantidad,
            precioUnitario: precioModificado, // Este es el precio que el vendedor ingresa, NO el precioReferencia
            precioTotal: precioTotal
          };
          console.log('💰 DEBUG - requestDataForBackend.arma completo:', requestDataForBackend.arma);
        }
        
        console.log('⚡ Enviando actualización PARCIAL del cliente (PATCH)...', {
          clienteId: client.id,
          camposModificados: Object.keys(cambiosCliente),
          tieneCambiosCliente: Object.keys(cambiosCliente).length > 0,
          tieneRespuestas: !!requestDataForBackend.respuestas,
          numRespuestas: requestDataForBackend.respuestas?.length || 0,
          tieneArma: !!requestDataForBackend.arma
        });
        
        // Usar PATCH en lugar de PUT para actualización parcial optimizada
        const updateResponse: any = await apiService.patchCliente(parseInt(client.id.toString()), requestDataForBackend);
        
        console.log('📥 Respuesta del backend recibida:', updateResponse);
        
        if (updateResponse && typeof updateResponse === 'object') {
          if ('cliente' in updateResponse && updateResponse.cliente) {
            // El backend retorna el cliente dentro de un objeto
            updatedClient = updateResponse.cliente;
            console.log('✅ Cliente extraído de respuesta:', updatedClient);
          } else if ('id' in updateResponse) {
            // Fallback: si viene directamente el cliente
            updatedClient = updateResponse;
            console.log('✅ Cliente viene directamente en la respuesta');
          } else if ('clienteId' in updateResponse) {
            // Si solo viene el ID, necesitamos obtener el cliente completo
            console.log('⚠️ Solo se recibió clienteId, obteniendo cliente completo...');
            updatedClient = await apiService.getClienteById(updateResponse.clienteId);
          }
        }
        
        if (!updatedClient || (!updatedClient.id && !(updateResponse?.clienteId))) {
          console.error('❌ Error: No se pudo obtener el cliente actualizado de la respuesta:', updateResponse);
          throw new Error('No se recibió el cliente actualizado del servidor');
        }
        
        // En modo edit, solo guardar documentos y arma (las respuestas ya se enviaron en requestDataForBackend)
        console.log('🔄 Guardando datos adicionales para cliente editado (solo documentos y arma)...');
        
        // Manejar documentos y arma de forma independiente sin fallar el proceso completo
        const clienteId = parseInt(updatedClient.id?.toString() || updateResponse?.clienteId?.toString() || client.id.toString());
        let documentErrors: string[] = [];
        
        // 1. Subir documentos nuevos si existen
        if (Object.keys(uploadedDocuments).length > 0) {
          console.log('📄 Subiendo documentos nuevos...');
          // Crear un Set para evitar subir el mismo documento dos veces (si está guardado por ID y por nombre)
          const documentosSubidos = new Set<string>();
          
          for (const [key, file] of Object.entries(uploadedDocuments)) {
            // Obtener el ID real del documento (la clave puede ser ID o nombre)
            const { tipoDocumentoId, documentNombre } = resolveDocumentoId(key, file);
            
            // Validar que tenemos un ID válido
            if (!tipoDocumentoId) {
              console.warn(`⚠️ No se pudo determinar el ID del documento: ${key}`);
              if (requiredDocuments.length > 0) {
                documentErrors.push(`Documento ${documentNombre}`);
              }
              continue;
            }
            
            // Evitar subir el mismo documento dos veces
            if (documentosSubidos.has(tipoDocumentoId.toString())) {
              console.log(`⏭️ Documento ${documentNombre} (ID: ${tipoDocumentoId}) ya fue subido, omitiendo...`);
              continue;
            }
            documentosSubidos.add(tipoDocumentoId.toString());
            
            try {
              // Verificar si el documento ya existe (para reemplazar) o es nuevo (para crear)
              // Buscar por nombre del documento en loadedDocuments
              const documentoExistente = loadedDocuments[documentNombre];
              
              console.log(`🔍 Verificando documento: ${documentNombre}`, {
                documentoExistente,
                loadedDocumentsKeys: Object.keys(loadedDocuments),
                tipoDocumentoId,
                clienteId
              });
              
              if (documentoExistente && documentoExistente.id) {
                // Documento existente: actualizar usando el ID del documento cargado
                console.log(`🔄 Reemplazando documento existente: ${documentNombre} (Documento ID: ${documentoExistente.id}, Tipo ID: ${tipoDocumentoId})`);
                // Obtener usuarioId del contexto o del cliente
                const usuarioId = 1; // TODO: Obtener del contexto de autenticación
                await apiService.actualizarDocumentoCliente(documentoExistente.id, file, undefined, usuarioId);
                console.log(`✅ Documento ${documentNombre} reemplazado exitosamente`);
              } else {
                // Documento nuevo: crear
                console.log(`📄 Creando nuevo documento: ${documentNombre} (Tipo ID: ${tipoDocumentoId})`);
                await apiService.cargarDocumentoCliente(clienteId, tipoDocumentoId, file);
                console.log(`✅ Documento ${documentNombre} (ID: ${tipoDocumentoId}) subido exitosamente`);
              }
            } catch (error: any) {
              console.error(`❌ Error subiendo documento ${documentNombre} (ID: ${tipoDocumentoId}):`, error);
              const statusCode = error?.response?.status || error?.status;
              let errorMsg = error?.response?.data?.message || error?.message || 'Error desconocido';
              
              // Si el error es 400 (Bad Request), probablemente es tamaño de archivo
              if (statusCode === 400 || errorMsg.includes('tamaño') || errorMsg.includes('tamaño máximo')) {
                errorMsg = 'El archivo excede el tamaño máximo permitido (10MB)';
              } else if (statusCode === 500) {
                errorMsg = 'Error del servidor al subir el archivo';
              }
              
              documentErrors.push(`${documentNombre}: ${errorMsg}`);
              // No fallar todo el proceso por un documento
            }
          }
        }
        
        // 2. Asignar arma si existe (solo si no está ya asignada)
        let armaError: string | null = null;
        if (currentSelectedWeapon) {
          console.log('🔫 Verificando asignación de arma...');
          try {
            // Verificar reservas existentes del cliente (incluyendo canceladas para trazabilidad)
            const reservasExistentes = await apiService.getArmasCliente(clienteId);
            
            // Filtrar reservas activas (no canceladas ni completadas)
            const reservasActivas = reservasExistentes?.filter((reserva: any) => 
              reserva.estado !== 'CANCELADA' && reserva.estado !== 'COMPLETADA'
            ) || [];
            
            // Verificar si la misma arma ya está reservada activamente
            const armaYaReservada = reservasActivas.some((reserva: any) => 
              reserva.armaId === parseInt(currentSelectedWeapon.id.toString()) || 
              reserva.arma?.id === parseInt(currentSelectedWeapon.id.toString())
            );
            
            if (armaYaReservada) {
              console.log('ℹ️ El arma ya está asignada/reservada activamente para este cliente, omitiendo...');
              // No hacer nada, el arma ya está asignada
            } else {
              // Si hay reservas activas de otras armas, el backend las cancelará automáticamente
              // para mantener trazabilidad. Solo creamos la nueva reserva.
              const precioTotal = precioModificado * cantidad;
              await apiService.crearReservaArma(
                clienteId,
                parseInt(currentSelectedWeapon.id.toString()),
                cantidad,
                precioModificado,
                precioTotal
              );
              console.log('✅ Nueva arma asignada. Las anteriores serán canceladas automáticamente por el backend para mantener trazabilidad.');
            }
          } catch (error: any) {
            // Extraer el mensaje de error real
            const errorResponse = error?.response?.data;
            const errorMessage = errorResponse?.message || errorResponse?.error || error?.message || '';
            const statusCode = error?.response?.status || error?.status;
            
            console.log('🔍 Error al verificar/asignar arma:', { errorMessage, statusCode, errorResponse });
            
            // Si es un error 404 al obtener reservas, puede que no haya reservas aún (normal)
            if (statusCode === 404 && errorMessage.includes('reserva')) {
              console.log('ℹ️ No hay reservas previas, intentando crear nueva reserva...');
              // Intentar crear la reserva de nuevo (aunque esto podría fallar si ya existe)
              try {
                const precioTotal = precioModificado * cantidad;
                await apiService.crearReservaArma(
                  clienteId,
                  parseInt(currentSelectedWeapon.id.toString()),
                  cantidad,
                  precioModificado,
                  precioTotal
                );
                console.log('✅ Arma asignada exitosamente (segundo intento)');
              } catch (retryError: any) {
                const retryMessage = retryError?.response?.data?.message || retryError?.message || '';
                // Si falla por "ya existe", ignorar
                if (retryMessage.includes('ya está asignada') || 
                    retryMessage.includes('ya existe') || 
                    retryMessage.includes('Ya existe una reserva')) {
                  console.log('ℹ️ El arma ya está asignada (segundo intento), omitiendo...');
                } else {
                  console.warn('⚠️ Error al asignar arma (segundo intento):', retryMessage);
                  armaError = retryMessage || 'Error al asignar arma';
                }
              }
            } else if (errorMessage.includes('ya está asignada') || 
                       errorMessage.includes('ya existe') || 
                       errorMessage.includes('Ya existe una reserva')) {
              console.log('ℹ️ El arma ya está asignada/reservada para este cliente, omitiendo...');
              // No agregar a errores, es normal en modo edit
            } else {
              // Otros errores
              console.warn('⚠️ Error desconocido al asignar arma:', errorMessage || 'Error desconocido');
              armaError = errorMessage || 'Error desconocido';
            }
          }
        }
        
        // Mostrar mensaje de resultado
        if (documentErrors.length > 0 || armaError) {
          const errores = [];
          if (documentErrors.length > 0) {
            errores.push(`documentos: ${documentErrors.join(', ')}`);
          }
          if (armaError) {
            errores.push(`arma: ${armaError}`);
          }
          alert(`⚠️ Cliente actualizado exitosamente, pero hubo problemas con: ${errores.join(' y ')}. Puedes intentar subirlos nuevamente más tarde.`);
          console.warn('⚠️ Cliente actualizado con advertencias:', { documentErrors, armaError });
        } else {
          alert('✅ Cliente actualizado exitosamente. Todos los datos, documentos y arma se guardaron correctamente.');
          console.log('✅ Cliente editado con todos los datos adicionales exitosamente');
          // Recargar documentos actualizados
          if (setLoadedDocuments) {
            const documentos = await apiService.getDocumentosCliente(clienteId);
            const documentosMap: Record<string, any> = {};
            documentos.forEach((doc: any) => {
              if (doc.tipoDocumentoNombre && doc.rutaArchivo && doc.estado === 'CARGADO' && doc.id) {
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
            });
            setLoadedDocuments(documentosMap);
          }
        }
        
        setIsSubmitting(false);
      } else {
        // Crear nuevo cliente con estado y respuestas
        const respuestasParaBackend = (formData.respuestas || [])
          .filter(r => r.questionId && r.respuesta) // Solo respuestas válidas
          .map(r => ({
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
        
        // Si hay arma seleccionada, incluirla en el requestData para que se guarde en la misma transacción
        // PERO: Si viene del stock, NO incluirla aquí (se reasignará después)
        if (currentSelectedWeapon && !clienteArmaIdDelStock) {
          console.log('🔫 Incluyendo arma en requestData para guardado transaccional');
          console.log('💰 DEBUG - precioModificado que se enviará:', precioModificado);
          console.log('💰 DEBUG - currentSelectedWeapon.precioReferencia:', currentSelectedWeapon.precioReferencia);
          const precioTotal = precioModificado * cantidad;
          requestData.arma = {
            armaId: parseInt(currentSelectedWeapon.id.toString()),
            cantidad: cantidad,
            precioUnitario: precioModificado, // Este es el precio que el vendedor ingresa, NO el precioReferencia
            precioTotal: precioTotal
          };
          console.log('💰 DEBUG - requestData.arma completo:', requestData.arma);
        }
        
        console.log('🔍 Enviando datos completos al backend (transaccional):', requestData);
        const response = await apiService.createCliente(requestData);
        
        // Si el arma viene del stock del vendedor, reasignarla después de crear el cliente
        if (clienteArmaIdDelStock && currentSelectedWeapon) {
          const clienteId = (response as any).clienteId || (response as any).id;
          if (clienteId) {
            try {
              console.log('🔄 Reasignando arma del stock al nuevo cliente...');
              await apiService.reasignarArmaACliente(clienteArmaIdDelStock, parseInt(clienteId.toString()));
              console.log('✅ Arma reasignada del stock al nuevo cliente exitosamente.');
              // Limpiar el ID del stock después de reasignar
              setClienteArmaIdDelStock(null);
            } catch (error: any) {
              console.error('❌ Error reasignando arma del stock:', error);
              const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido';
              
              // Si el error es por documentos incompletos, mostrar mensaje claro
              if (errorMessage.includes('documentos obligatorios') || errorMessage.includes('documentos completos')) {
                alert(`⚠️ No se pudo reasignar el arma del stock:\n\n${errorMessage}\n\n` +
                      `Por favor, carga todos los documentos obligatorios del cliente y vuelve a intentar.`);
              } else {
                // Para otros errores, solo loggear (no fallar todo el proceso)
                console.warn('⚠️ El arma del stock no se pudo reasignar, pero el cliente se creó correctamente.');
              }
            }
          }
        }
        
        // El backend ahora maneja TODO en una transacción, incluyendo cliente, respuestas y arma (si está)
        // Los documentos deben subirse después porque son archivos (multipart), pero el cliente ya está creado
        if (response) {
          const clienteId = (response as any).clienteId || (response as any).id;
          console.log('✅ Cliente creado exitosamente con transacción completa. ID:', clienteId);
          
          // Solo después de que el cliente esté creado, subir documentos (si hay)
          // NOTA: Los documentos no pueden estar en la misma transacción porque son archivos multipart
          // pero el cliente ya está creado correctamente con respuestas y arma
          if (Object.keys(uploadedDocuments).length > 0) {
            console.log('📄 Subiendo documentos después de crear cliente...');
            const documentErrors: string[] = [];
            const documentosSubidos = new Set<string>();
            
            for (const [key, file] of Object.entries(uploadedDocuments)) {
              // Obtener el ID real del documento (la clave puede ser ID o nombre)
              const { tipoDocumentoId, documentNombre } = resolveDocumentoId(key, file);
              
              // Validar que tenemos un ID válido
              if (!tipoDocumentoId) {
                console.warn(`⚠️ No se pudo determinar el ID del documento: ${key}`);
                if (requiredDocuments.length > 0) {
                  documentErrors.push(`Documento ${documentNombre}`);
                }
                continue;
              }
              
              // Evitar subir el mismo documento dos veces
              if (documentosSubidos.has(tipoDocumentoId.toString())) {
                console.log(`⏭️ Documento ${documentNombre} ya fue subido, omitiendo...`);
                continue;
              }
              documentosSubidos.add(tipoDocumentoId.toString());
              
              try {
                console.log(`📤 Intentando subir documento: ${documentNombre} (ID: ${tipoDocumentoId}) para cliente ${clienteId}`);
                const resultado = await apiService.cargarDocumentoCliente(
                  parseInt(clienteId.toString()), 
                  tipoDocumentoId, 
                  file
                );
                console.log(`✅ Documento ${documentNombre} (ID: ${tipoDocumentoId}) subido exitosamente:`, resultado);
                
                // Si llegamos aquí, el documento se subió correctamente
                // El backend devuelve 201 (CREATED) con un DTO, así que si no hay excepción, fue exitoso
                // No necesitamos verificar resultado.success porque el backend devuelve un DTO directamente
              } catch (docError: any) {
                console.error(`❌ Error subiendo documento ${documentNombre} (ID: ${tipoDocumentoId}):`, docError);
                
                // Verificar si el error es realmente un error o si el documento se guardó
                // Si el status es 201 (CREATED) o 200 (OK), el documento probablemente se guardó
                const statusCode = docError?.status || docError?.response?.status;
                if (statusCode === 201 || statusCode === 200) {
                  console.log(`✅ El documento se guardó correctamente (status ${statusCode}), pero hubo un problema parseando la respuesta`);
                  // No agregar a errores si el documento se guardó (status 201/200 = éxito)
                  // El documento está en la BD aunque haya habido un problema con la respuesta
                } else {
                  // Solo agregar a errores si realmente hubo un error (status != 200/201)
                  console.error(`❌ Detalles del error:`, {
                    status: statusCode,
                    statusText: docError?.response?.statusText,
                    data: docError?.responseData || docError?.response?.data,
                    message: docError?.message
                  });
                  
                  // Construir mensaje de error más descriptivo
                  let errorMsg = 'Error desconocido';
                  if (docError?.responseData?.message) {
                    errorMsg = docError.responseData.message;
                  } else if (docError?.response?.data?.message) {
                    errorMsg = docError.response.data.message;
                  } else if (statusCode === 400) {
                    errorMsg = 'Solicitud inválida (posiblemente archivo muy grande o formato no permitido)';
                  } else if (statusCode === 404) {
                    errorMsg = 'Cliente o tipo de documento no encontrado';
                  } else if (statusCode === 500) {
                    errorMsg = 'Error interno del servidor';
                  } else if (docError?.message) {
                    errorMsg = docError.message;
                  }
                  
                  documentErrors.push(`${documentNombre}: ${errorMsg}`);
                }
              }
            }
            
            if (requiredDocuments.length > 0) {
              try {
                const documentosActualizados = await apiService.getDocumentosCliente(parseInt(clienteId.toString()));
                const documentosMap: Record<string, any> = {};
                if (Array.isArray(documentosActualizados)) {
                  documentosActualizados.forEach(doc => {
                    if (doc.tipoDocumentoNombre && doc.rutaArchivo && doc.estado === 'CARGADO' && doc.id) {
                      documentosMap[doc.tipoDocumentoNombre] = doc;
                    }
                  });
                }

                const documentosFaltantes = requiredDocuments.filter(doc => {
                  const porNombre = documentosMap[doc.nombre];
                  const porUploaded = uploadedDocuments[doc.nombre] || uploadedDocuments[doc.id?.toString?.() || ''];
                  return !porNombre && !porUploaded;
                });

                if (documentosFaltantes.length > 0) {
                  const nombres = documentosFaltantes.map(doc => doc.nombre).join(', ');
                  alert(`⚠️ Cliente creado exitosamente, pero faltan documentos por subir: ${nombres}. Puedes subirlos más tarde.`);
                } else {
                  console.log('✅ Documentos subidos correctamente. No hay faltantes.');
                }
              } catch (verificarError) {
                console.error('❌ Error verificando documentos después de la carga:', verificarError);
                // Evitar falso positivo si la verificación falla pero los documentos fueron subidos
              }
            } else if (documentErrors.length > 0) {
              console.warn('⚠️ Hubo errores reportados al subir documentos, pero no hay documentos requeridos definidos.', documentErrors);
            } else {
              console.log('✅ Todos los documentos subidos exitosamente');
            }
          }
          
          // Si llegamos aquí, todo está completo
          alert('✅ Cliente creado exitosamente con todos los datos.');
          updatedClient = response as any;
        }
      }
      
      // Verificar que updatedClient esté definido antes de continuar
      if (!updatedClient) {
        setIsSubmitting(false);
        console.error('❌ Error: updatedClient no está definido');
        alert('❌ Error: No se pudo obtener el cliente actualizado. Por favor, intente nuevamente.');
        return;
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
        // Actualizar clientFormData con el cliente recién creado (con su ID) antes de navegar
        if (onConfirmData && updatedClient) {
          const clientDataWithId = {
            ...formData,
            ...updatedClient,
            id: updatedClient.id.toString() // Asegurar que el ID esté como string
          };
          onConfirmData(clientDataWithId);
        } else {
          onNavigateToWeaponSelection?.();
        }
      } else {
        // Si no está listo, solo guardar
        onSave(updatedClient as any);
      }
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('❌ Error al guardar cliente:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Error desconocido';
      const statusCode = error?.response?.status || error?.status;
      
      let userMessage = '❌ Error al guardar el cliente. Por favor, intente nuevamente.';
      
      if (statusCode === 400) {
        userMessage = `❌ Error de validación: ${errorMessage}`;
      } else if (statusCode === 403) {
        userMessage = `Error de permisos: ${errorMessage}`;
      } else if (statusCode === 404) {
        userMessage = `Recurso no encontrado: ${errorMessage}`;
      } else if (statusCode === 500) {
        userMessage = `Error del servidor: ${errorMessage}`;
      } else if (errorMessage && errorMessage !== 'Error desconocido') {
        userMessage = `Error: ${errorMessage}`;
      }
      
      alert(userMessage);
      
      // NO cerrar el formulario en caso de error - permitir al usuario corregir y reintentar
      // NO llamar onCancel() aquí para que el usuario pueda ver los errores y corregir
      return;
    }
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

    const isUniformadoValidacion = isUniformadoByType || isMilitaryType || isPoliceType;
    // Para uniformados, validar que tengan estado militar
    if (isUniformadoValidacion) {
      if (!formData.estadoMilitar) return false;
      if (!formData.rango || !formData.rango.trim()) return false;
      
      // Validar código ISSFA para militares activos y pasivos
      if (isMilitaryType && (formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO')) {
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
      
      // Validar código ISSPOL para policías activos y pasivos
      if (isPoliceType && (formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO')) {
        if (!formData.codigoIsspol || formData.codigoIsspol.trim() === '') {
          // No mostrar alert, solo validar con borde rojo
          return false;
        }
        
        // Validar que tenga exactamente 10 dígitos (solo borde rojo, sin alert)
        if (formData.codigoIsspol.length !== 10) {
          return false;
        }
        
        // Validar que sea solo números (solo borde rojo, sin alert)
        if (!/^\d{10}$/.test(formData.codigoIsspol)) {
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

  // Validación de edad (edad, edadValida, mensajeErrorEdad ahora están en ClientPersonalDataSection)
  const edadValida = formData.fechaNacimiento ? validarEdadMinima(formData.fechaNacimiento) : false;

  // OPTIMIZACIÓN: Logs de debug solo en modo desarrollo y solo cuando cambian valores relevantes
  // Removidos logs del render que se ejecutaban en cada keystroke
  // Si necesitas debug, usar React DevTools Profiler en lugar de console.log en render
  
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