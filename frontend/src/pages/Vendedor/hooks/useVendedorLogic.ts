import { useState, useEffect, useRef, useCallback } from 'react';
import type { Client } from '../types';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useTiposClienteConfig } from '../../../contexts/TiposClienteContext';

export const useVendedorLogic = () => {
  // Ref para evitar re-montajes
  const hasInitializedRef = useRef(false);
  
  // Obtener usuario autenticado
  const { user } = useAuth();

  // Hook para configuración dinámica de tipos de cliente
  const { getCodigoTipoCliente } = useTiposClienteConfig();

  // Estados para mapeo de provincias
  const [provinciasCompletas, setProvinciasCompletas] = useState<Array<{codigo: string, nombre: string}>>([]);

  // Cargar provincias completas al inicializar
  useEffect(() => {
    const cargarProvinciasCompletas = async () => {
      try {
        const provincias = await apiService.getProvinciasCompletas();
        setProvinciasCompletas(provincias);
      } catch (error) {
        console.error('Error cargando provincias completas:', error);
      }
    };
    cargarProvinciasCompletas();
  }, []);

  // Funciones de mapeo usando datos de la API
  const mapearProvinciaACodigo = (nombreProvincia: string): string => {
    console.log('🔍 Mapeando provincia:', nombreProvincia);
    console.log('🔍 Provincias disponibles:', provinciasCompletas);
    const provincia = provinciasCompletas.find(p => p.nombre === nombreProvincia);
    const codigo = provincia ? provincia.codigo : nombreProvincia;
    console.log('🔍 Código de provincia resultante:', codigo);
    return codigo;
  };

  const mapearCodigoANombreProvincia = (codigoProvincia: string): string => {
    const provincia = provinciasCompletas.find(p => p.codigo === codigoProvincia);
    return provincia ? provincia.nombre : codigoProvincia;
  };
  
  // Estados
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFormMode, setClientFormMode] = useState<'create' | 'edit' | 'view'>('create');
  // @ts-ignore

  const [clients, setClients] = useState<Client[]>([]);
  const [availableWeapons, setAvailableWeapons] = useState<any[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<any | null>(null);
  const [precioModificado, setPrecioModificado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: any; precio: number; cantidad: number }>>({});
  const [weaponPrices, setWeaponPrices] = useState<Record<number, number>>({});
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [weaponsLoading, setWeaponsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [clientesBloqueados, setClientesBloqueados] = useState<Record<string, { bloqueado: boolean; motivo: string }>>({});
  const [clientFormData, setClientFormData] = useState<any>(null); // Para almacenar datos del formulario cuando se crea un cliente
  
  // Estados de paginación
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalClients, setTotalClients] = useState<number>(0);
  const pageSize = 20; // 20 clientes por página

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
        return 'Faltan documentos'; // Fallback más lógico que "Sin estado"
    }
  }, []);

  // useEffect principal
  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    loadClients();
    loadWeapons();
  }, []);

  // Monitorear cambios en availableWeapons
  useEffect(() => {
    if (availableWeapons.length > 0) {
      // availableWeapons actualizado
    }
  }, [availableWeapons]);

  // useEffect de inicialización
  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Componente no inicializado, saltando inicialización
      return;
    }
    
    // Inicializar solo cuando tenemos armas disponibles
    if (availableWeapons.length > 0 && !isInitialized) {
      setIsInitialized(true);
      // Pantalla inicializada
    }
  }, [availableWeapons, isInitialized]);

  const loadClients = useCallback(async (page: number = currentPageNumber) => {
    try {
      setClientsLoading(true);
      const response = await apiService.getClientes(page, pageSize);
      const clientsData = (response.content || []) as any;
      setClients(clientsData);
      
      // Actualizar estados de paginación
      setTotalPages(response.totalPages || 0);
      setTotalClients(response.totalElements || 0);
      setCurrentPageNumber(page);
      
      // Cargar armas para cada cliente
      const weaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number }> = {};
      
      for (const client of clientsData) {
        try {
          const armasResponse = await apiService.getArmasCliente(client.id);
          if (armasResponse && armasResponse.length > 0) {
            const arma = armasResponse[0]; // Tomar la primera arma
            weaponAssignments[client.id] = {
              weapon: {
                id: arma.armaId,
                nombre: arma.armaNombre,
                calibre: arma.armaModelo || 'N/A',
                codigo: arma.armaCodigo,
                urlImagen: arma.armaImagen,
                precioReferencia: parseFloat(arma.precioUnitario) || 0
              },
              precio: parseFloat(arma.precioUnitario) || 0,
              cantidad: parseInt(arma.cantidad) || 1
            };
          }
        } catch (error) {
          console.warn(`No se pudieron cargar armas para cliente ${client.id}:`, error);
        }
      }
      
      setClientWeaponAssignments(weaponAssignments);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const loadWeapons = useCallback(async () => {
    try {
      setWeaponsLoading(true);
      // Cargando armas desde API
      
      const armas = await apiService.getArmas();
      
      // Armas cargadas desde API
      // Validando respuesta de armas
      
      if (Array.isArray(armas)) {
        // Procesando armas recibidas
        
        // Validando estructura de armas
        
        const armasSinNombre = armas.filter(arma => !arma.nombre);
        if (armasSinNombre.length > 0) {
          console.error('🔫 Vendedor - ❌ ARMAS SIN NOMBRE ENCONTRADAS:', armasSinNombre);
        } else {
          // Todas las armas tienen nombre válido
        }
        
        const armasSinId = armas.filter(arma => !arma.id);
        if (armasSinId.length > 0) {
          console.error('🔫 Vendedor - ❌ ARMAS SIN ID ENCONTRADAS:', armasSinId);
        } else {
          // Todas las armas tienen ID válido
        }
        
        setAvailableWeapons(armas);
        
      } else {
        console.error('🔫 Vendedor - ❌ RESPUESTA NO ES ARRAY:', armas);
        console.error('🔫 Vendedor - Tipo de respuesta:', typeof armas);
        console.error('🔫 Vendedor - Estructura completa:', JSON.stringify(armas, null, 2));
      }
      
    } catch (error) {
      console.error('❌ Error al cargar armas:', error);
      console.error('❌ Error completo:', error);
      // Usando armas mock como fallback
    } finally {
      setWeaponsLoading(false);
      // Carga de armas completada
    }
  }, []);

  const handleCreateClient = useCallback(() => {
    // Cambiar a la página del formulario de cliente
    setCurrentPage('clientForm');
    setClientFormMode('create');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, []);

  const handleAssignWeaponWithoutClient = useCallback(() => {
    setCurrentPage('weaponSelection');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, []);

  const handleClientSaved = useCallback(async (client: Client) => {
    console.log('🔄 Cliente guardado callback ejecutado:', client);
    
    // Limpiar filtro inmediatamente
    setClientFilter(null);
    
    // Limpiar selecciones
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
    
    // Cambiar al dashboard PRIMERO
    setCurrentPage('dashboard');
    setClientFormMode('create');
    
    // Luego recargar en segundo plano
    console.log('📥 Recargando lista de clientes en segundo plano...');
    loadClients().then(() => {
      console.log('✅ Lista de clientes actualizada');
    }).catch((error) => {
      console.error('❌ Error recargando clientes:', error);
    });
  }, [loadClients]);

  const handleClienteBloqueado = useCallback((clientId: string, bloqueado: boolean, motivo: string) => {
    if (bloqueado) {
      setClientesBloqueados(prev => ({
        ...prev,
        [clientId]: { bloqueado, motivo }
      }));
      
      if (currentPage !== 'clientForm') {
        setCurrentPage('dashboard');
        setSelectedClient(null);
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
      }
    } else {
      setClientesBloqueados(prev => {
        const newBlockedClients = { ...prev };
        delete newBlockedClients[clientId];
        return newBlockedClients;
      });
    }
  }, [currentPage]);

  const handleCloseForm = useCallback(() => {
    setCurrentPage('dashboard');
    setClientFormMode('create');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, []);

  const handleWeaponSelected = useCallback((weapon: any | null) => {
    if (weapon) {
      console.log('🔫 Arma seleccionada:', weapon);
      console.log('💰 Precio de referencia:', weapon.precioReferencia);
      console.log('💰 Precio actual en estado:', precioModificado);
      
      // Si es la misma arma que ya está seleccionada, no cambiar nada
      if (selectedWeapon && selectedWeapon.id === weapon.id) {
        console.log('✅ Misma arma ya seleccionada, manteniendo precio actual:', precioModificado);
        return;
      }
      
      // Verificar si ya hay un precio modificado para esta arma
      let precioAUsar = weapon.precioReferencia || 0;
      
      // Primero verificar si hay un precio específico para esta arma en weaponPrices
      if (weaponPrices[weapon.id]) {
        precioAUsar = weaponPrices[weapon.id];
        console.log('💰 Usando precio específico de weaponPrices:', precioAUsar);
      }
      // Luego verificar si hay una asignación existente para este cliente
      else if (selectedClient && clientWeaponAssignments[selectedClient.id]) {
        const asignacionExistente = clientWeaponAssignments[selectedClient.id];
        if (asignacionExistente.weapon.id === weapon.id) {
          precioAUsar = asignacionExistente.precio;
          console.log('💰 Usando precio modificado existente:', precioAUsar);
        }
      }
      
      setSelectedWeapon(weapon);
      setPrecioModificado(precioAUsar);
      setCantidad(1);
      
      console.log('✅ Estado actualizado - precioModificado:', precioAUsar);
      
      if (selectedClient) {
        setClientWeaponAssignments(prev => ({
          ...prev,
          [selectedClient.id]: {
            weapon: weapon,
            precio: precioAUsar,
            cantidad: 1
          }
        }));
      }
    } else {
      setSelectedWeapon(null);
      setPrecioModificado(0);
      setCantidad(1);
      
      if (selectedClient) {
        setClientWeaponAssignments(prev => {
          const newAssignments = { ...prev };
          delete newAssignments[selectedClient.id];
          return newAssignments;
        });
      }
    }
  }, [selectedClient, clientWeaponAssignments, selectedWeapon, precioModificado, weaponPrices]);

  const handlePriceChange = useCallback((weaponId: number, newPrice: number) => {
    console.log('🔧 handlePriceChange llamado:', { weaponId, newPrice, selectedClient: selectedClient?.id, selectedWeapon: selectedWeapon?.id });
    
    // Actualizar el precio para la arma específica
    setWeaponPrices(prev => ({
      ...prev,
      [weaponId]: newPrice
    }));
    console.log('✅ Precio actualizado para arma:', weaponId, 'a', newPrice);
    
    // Si es la arma actualmente seleccionada, actualizar el estado global
    if (selectedWeapon && selectedWeapon.id === weaponId) {
      setPrecioModificado(newPrice);
      console.log('✅ Precio global actualizado para arma seleccionada');
    }
    
    // Actualizar la asignación del cliente si existe
    if (selectedClient) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon || { id: weaponId }, // Usar arma seleccionada o crear referencia
          precio: newPrice,
          cantidad: cantidad
        }
      }));
      console.log('✅ Asignación de cliente actualizada');
    }
    
    console.log('✅ Precio actualizado exitosamente para arma:', weaponId);
  }, [selectedClient, selectedWeapon, cantidad]);

  const handleQuantityChange = useCallback((weaponId: number, newQuantity: number) => {
    // Solo cambiar la cantidad si es para el cliente actualmente seleccionado
    if (selectedClient && selectedWeapon && selectedWeapon.id === weaponId) {
      setCantidad(newQuantity);
      
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon,
          precio: precioModificado,
          cantidad: newQuantity
        }
      }));
    }
  }, [selectedClient, selectedWeapon, precioModificado]);

  const handleFinishProcess = useCallback(() => {
    if (selectedClient && selectedWeapon) {
      setClientWeaponAssignments(prev => ({
        ...prev,
        [selectedClient.id]: {
          weapon: selectedWeapon,
          precio: precioModificado,
          cantidad: cantidad
        }
      }));
    }
    
    setCurrentPage('dashboard');
    setSelectedClient(null);
    setSelectedWeapon(null);
    setPrecioModificado(0);
    setCantidad(1);
  }, [selectedClient, selectedWeapon, precioModificado, cantidad]);

  // Función para manejar cuando se confirman los datos del cliente
  const handleClientDataConfirm = useCallback((formData: any) => {
    console.log('👤 Datos del cliente confirmados:', formData);
    console.log('📄 Documentos subidos:', formData.uploadedDocuments);
    
    // Mapear tipoIdentificacion a código
    const mapTipoIdentificacionToCode = (tipoIdentificacion: string | undefined): string => {
      if (!tipoIdentificacion) return 'CED';
      switch (tipoIdentificacion) {
        case 'Cédula':
        case 'Cédula de Identidad':
        case 'CEDULA':
          return 'CED';
        case 'RUC':
          return 'RUC';
        case 'Pasaporte':
          return 'PAS';
        default:
          return 'CED';
      }
    };
    
    // Mapear respuestas para incluir preguntaId - CORREGIDO: usar questionId del frontend
    const respuestasMapeadas = formData.respuestas?.map((respuesta: any) => {
      // El frontend usa questionId, el backend espera preguntaId
      const preguntaId = respuesta.questionId || respuesta.preguntaId || respuesta.id || null;
      return {
        ...respuesta,
        preguntaId: preguntaId
      };
    }) || [];

    // Crear objeto con códigos mapeados usando configuración dinámica
    const clientDataMapeado = {
      ...formData,
      tipoIdentificacionCodigo: mapTipoIdentificacionToCode(formData.tipoIdentificacion),
      tipoClienteCodigo: getCodigoTipoCliente(formData.tipoCliente),
      provincia: mapearProvinciaACodigo(formData.provincia),
      canton: formData.canton, // El cantón se guarda como nombre
      direccion: formData.direccion, // Asegurar que la dirección se incluya
      telefonoSecundario: formData.telefonoSecundario, // Asegurar que el teléfono secundario se incluya
      respuestas: respuestasMapeadas
    };
    
    console.log('👤 Datos mapeados para backend:', clientDataMapeado);
    console.log('👤 Datos originales del formulario:', formData);
    console.log('👤 Provincia original:', formData.provincia);
    console.log('👤 Provincia mapeada:', clientDataMapeado.provincia);
    console.log('👤 Cantón:', clientDataMapeado.canton);
    console.log('👤 Dirección:', clientDataMapeado.direccion);
    console.log('👤 Teléfono secundario:', clientDataMapeado.telefonoSecundario);
    console.log('👤 Estableciendo clientFormData con datos mapeados');
    setClientFormData(clientDataMapeado);
    setCurrentPage('weaponSelection');
    console.log('👤 Navegando a weaponSelection');
  }, []);

  // Función para manejar cuando se confirma la selección de arma
  const handleWeaponSelectionConfirm = useCallback(() => {
    console.log('🔫 Selección de arma confirmada, navegando a forma de pago');
    console.log('🔫 clientFormData actual:', clientFormData);
    console.log('🔫 selectedClient actual:', selectedClient);
    
    // Si no hay clientFormData pero hay selectedClient, usar selectedClient
    if (!clientFormData && selectedClient) {
      console.log('🔫 Usando selectedClient como clientFormData');
      setClientFormData(selectedClient);
    }
    
    // Si no hay ninguno de los dos, mostrar error
    if (!clientFormData && !selectedClient) {
      console.error('❌ No hay datos del cliente disponibles para continuar');
      alert('❌ Error: No hay datos del cliente. Por favor, completa el proceso desde el inicio.');
      return;
    }
    
    setCurrentPage('paymentForm');
  }, [clientFormData, selectedClient]);

  // Nueva función para manejar la finalización del proceso de pago
  const handlePaymentComplete = useCallback(async (paymentData: any) => {
    try {
      console.log('💰 Procesando pago completado:', paymentData);
      console.log('💰 clientFormData:', clientFormData);
      console.log('💰 selectedWeapon:', selectedWeapon);
      console.log('💰 precioModificado:', precioModificado);
      
      // VALIDACIÓN INICIAL: Verificar que tenemos todos los datos necesarios
      if (!clientFormData) {
        throw new Error('No hay datos del cliente para procesar');
      }
      
      // VALIDACIÓN CRÍTICA: Verificar que el usuario esté autenticado
      if (!user?.id) {
        throw new Error('Usuario no autenticado. No se puede crear el cliente sin un vendedor válido.');
      }
      if (!selectedWeapon) {
        throw new Error('No hay arma seleccionada');
      }
      if (!paymentData) {
        throw new Error('No hay datos de pago');
      }
      
      // Crear objeto completo para enviar al backend
      console.log('💰 Preparando datos completos para el backend...');
      
      // Limpiar el ID vacío del cliente si existe
      const clienteDataToSend = { ...clientFormData };
      delete clienteDataToSend.id;
      
      // Preparar datos de pago
      const pagoData = {
        clienteId: null, // Se llenará en el backend
        montoTotal: paymentData.total || Math.round((precioModificado * cantidad * 1.15) * 100) / 100, // Con IVA
        tipoPago: paymentData.tipoPago || 'CONTADO',
        numeroCuotas: paymentData.numeroCuotas || 1,
        montoCuota: paymentData.montoPorCuota || Math.round((precioModificado * cantidad * 1.15) * 100) / 100,
        montoPagado: 0,
        montoPendiente: paymentData.total || Math.round((precioModificado * cantidad * 1.15) * 100) / 100
      };
      
      // Preparar datos de arma
      const armaData = selectedWeapon ? {
        armaId: selectedWeapon.id,
        cantidad: cantidad,
        precioUnitario: precioModificado
      } : null;
      
      // Preparar datos de documentos del usuario (si existen)
      const documentosUsuario = clientFormData.uploadedDocuments || {};
      console.log('📄 Documentos del usuario en handlePaymentComplete:', documentosUsuario);
      console.log('📄 clientFormData completo:', clientFormData);
      
      // Preparar cuotas si es pago a crédito
      const cuotasData = [];
      if (paymentData.tipoPago === 'CUOTAS' && paymentData.cuotas && paymentData.cuotas.length > 0) {
        console.log('💰 Preparando cuotas para envío al backend...');
        for (const cuota of paymentData.cuotas) {
          cuotasData.push({
            numeroCuota: cuota.numeroCuota,
            fechaVencimiento: cuota.fecha,
            monto: cuota.monto,
            estado: 'PENDIENTE'
          });
        }
        console.log('💰 Cuotas preparadas:', cuotasData);
      }
      
      // Crear objeto estructurado según ClienteCompletoCreateDTO
      const requestData = {
        cliente: {
          nombres: clienteDataToSend.nombres,
          apellidos: clienteDataToSend.apellidos,
          numeroIdentificacion: clienteDataToSend.numeroIdentificacion,
          tipoIdentificacionCodigo: clienteDataToSend.tipoIdentificacionCodigo,
          tipoClienteCodigo: clienteDataToSend.tipoClienteCodigo,
          fechaNacimiento: clienteDataToSend.fechaNacimiento,
          direccion: clienteDataToSend.direccion,
          provincia: mapearProvinciaACodigo(clienteDataToSend.provincia),
          canton: clienteDataToSend.canton, // El cantón se guarda como nombre
          email: clienteDataToSend.email,
          telefonoPrincipal: clienteDataToSend.telefonoPrincipal,
          telefonoSecundario: clienteDataToSend.telefonoSecundario,
          representanteLegal: clienteDataToSend.representanteLegal,
          ruc: clienteDataToSend.ruc,
          nombreEmpresa: clienteDataToSend.nombreEmpresa,
          direccionFiscal: clienteDataToSend.direccionFiscal,
          telefonoReferencia: clienteDataToSend.telefonoReferencia,
          correoEmpresa: clienteDataToSend.correoEmpresa,
          provinciaEmpresa: mapearProvinciaACodigo(clienteDataToSend.provinciaEmpresa),
          cantonEmpresa: clienteDataToSend.cantonEmpresa,
          estadoMilitar: clienteDataToSend.estadoMilitar,
          codigoIssfa: clienteDataToSend.codigoIssfa,
          rango: clienteDataToSend.rango,
          usuarioCreadorId: user?.id
        },
        pago: {
          clienteId: null, // Se llenará en el backend
          montoTotal: pagoData.montoTotal,
          tipoPago: pagoData.tipoPago,
          numeroCuotas: pagoData.numeroCuotas,
          montoCuota: pagoData.montoCuota,
          montoPagado: pagoData.montoPagado,
          montoPendiente: pagoData.montoPendiente
        },
        arma: armaData ? {
          armaId: armaData.armaId,
          cantidad: armaData.cantidad,
          precioUnitario: armaData.precioUnitario
        } : null,
        respuestas: (clientFormData.respuestas || []).map((respuesta: any) => ({
          ...respuesta,
          preguntaId: respuesta.questionId || respuesta.preguntaId || respuesta.id
        })),
        cuotas: cuotasData,
        documentos: documentosUsuario
      };
      
      // UNA SOLA LLAMADA AL BACKEND - Usar endpoint de crear cliente que ya funciona
      const resultado = await apiService.createCliente(requestData as any);
      console.log('💰 Proceso completado exitosamente:', resultado);
      
      // SUBIR DOCUMENTOS POR SEPARADO (si existen)
      if (documentosUsuario && Object.keys(documentosUsuario).length > 0) {
        console.log('📄 Subiendo documentos por separado...');
        const clienteId = (resultado as any).clienteId || resultado.id;
        
        for (const [tipoDocumentoId, file] of Object.entries(documentosUsuario)) {
          try {
            console.log(`📄 Subiendo documento tipo ${tipoDocumentoId} para cliente ${clienteId}`);
            const docResult = await apiService.cargarDocumentoCliente(
              clienteId, 
              parseInt(tipoDocumentoId), 
              file as File
            );
            console.log(`✅ Documento ${tipoDocumentoId} subido exitosamente:`, docResult);
          } catch (error) {
            console.error(`❌ Error subiendo documento ${tipoDocumentoId}:`, error);
          }
        }
      }
      

      
      // Mostrar mensaje de éxito
      alert('🎉 ¡Proceso completado exitosamente! Cliente, arma, plan de pago creados y contrato enviado por email.');
      
      // Recargar lista de clientes en la primera página para mostrar el nuevo cliente
      await loadClients(0);
      
      // Volver al dashboard
      setCurrentPage('dashboard');
      setSelectedClient(null);
      setSelectedWeapon(null);
      setPrecioModificado(0);
      setCantidad(1);
      setClientFormData(null);
      
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al crear el cliente: ${errorMessage}. El proceso se ha detenido y no se han guardado datos parciales.`);
      
      // NO limpiar el estado para que el usuario pueda intentar nuevamente
      // setCurrentPage('dashboard');
      // setSelectedClient(null);
      // setSelectedWeapon(null);
      // setPrecioModificado(0);
      // setCantidad(1);
      // setClientFormData(null);
    }
  }, [clientFormData, selectedWeapon, precioModificado, cantidad]);

  const handleViewClient = useCallback(async (client: Client) => {
    try {
      console.log('🔄 Obteniendo datos completos del cliente para visualización:', client.id);
      // Obtener datos completos del cliente desde el backend
      const clienteCompleto = await apiService.getCliente(parseInt(client.id));
      console.log('✅ Cliente completo obtenido para visualización:', clienteCompleto);
      
      // Convertir códigos a nombres para mostrar en el frontend
      const clienteParaMostrar = {
        ...clienteCompleto,
        provincia: mapearCodigoANombreProvincia((clienteCompleto as any).provincia || ''),
        canton: (clienteCompleto as any).canton || '' // Por ahora el cantón se guarda como nombre
      };
      
      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('view');
      
      const assignment = clientWeaponAssignments[client.id];
      if (assignment) {
        setSelectedWeapon(assignment.weapon);
        setPrecioModificado(assignment.precio);
        setCantidad(assignment.cantidad);
      } else {
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
      }
      
      setCurrentPage('clientForm');
    } catch (error) {
      console.error('❌ Error obteniendo cliente completo para visualización:', error);
      // Fallback: usar el cliente de la lista local y convertir códigos a nombres
      const clienteParaMostrar = {
        ...client,
        provincia: mapearCodigoANombreProvincia(client.provincia || ''),
        canton: client.canton || ''
      };
      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('view');
      
      const assignment = clientWeaponAssignments[client.id];
      if (assignment) {
        setSelectedWeapon(assignment.weapon);
        setPrecioModificado(assignment.precio);
        setCantidad(assignment.cantidad);
      } else {
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
      }
      
      setCurrentPage('clientForm');
    }
  }, [clientWeaponAssignments]);

  const handleEditClient = useCallback(async (client: Client) => {
    try {
      console.log('🔄 Obteniendo datos completos del cliente para edición:', client.id);
      // Obtener datos completos del cliente desde el backend
      const clienteCompleto = await apiService.getCliente(parseInt(client.id));
      console.log('✅ Cliente completo obtenido para edición:', clienteCompleto);
      
      // Convertir códigos a nombres para mostrar en el frontend
      const clienteParaMostrar = {
        ...clienteCompleto,
        provincia: mapearCodigoANombreProvincia((clienteCompleto as any).provincia || ''),
        canton: (clienteCompleto as any).canton || '' // Por ahora el cantón se guarda como nombre
      };
      
      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('edit');
      
      const assignment = clientWeaponAssignments[client.id];
      if (assignment) {
        setSelectedWeapon(assignment.weapon);
        setPrecioModificado(assignment.precio);
        setCantidad(assignment.cantidad);
      } else {
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
      }
      
      setCurrentPage('clientForm');
    } catch (error) {
      console.error('❌ Error obteniendo cliente completo para edición:', error);
      // Fallback: usar el cliente de la lista local y convertir códigos a nombres
      const clienteParaMostrar = {
        ...client,
        provincia: mapearCodigoANombreProvincia(client.provincia || ''),
        canton: client.canton || ''
      };
      setSelectedClient(clienteParaMostrar as any);
      setClientFormMode('edit');
      
      const assignment = clientWeaponAssignments[client.id];
      if (assignment) {
        setSelectedWeapon(assignment.weapon);
        setPrecioModificado(assignment.precio);
        setCantidad(assignment.cantidad);
      } else {
        setSelectedWeapon(null);
        setPrecioModificado(0);
        setCantidad(1);
      }
      
      setCurrentPage('clientForm');
    }
  }, [clientWeaponAssignments]);

  const handleFilterByType = useCallback((tipoCliente: string) => {
    if (clientFilter === tipoCliente) {
      setClientFilter(null);
    } else {
      setClientFilter(tipoCliente);
    }
  }, [clientFilter]);

  const clearFilter = useCallback(() => {
    setClientFilter(null);
  }, []);

  const getFilteredClients = useCallback(() => {
    if (!clientFilter) return clients;
    
    return clients.filter(client => {
      // Usar las mismas banderas que getClientCountByType
      if (clientFilter === 'Cupo Civil') {
        // Es civil si es civil O si es militar pero está pasivo
        return client.tipoClienteEsCivil || 
               (client.tipoClienteEsMilitar && client.estadoMilitar === 'PASIVO');
      } else if (clientFilter === 'Extracupo Uniformado') {
        // Es uniformado si es militar activo O policía activo
        return (client.tipoClienteEsMilitar && client.estadoMilitar === 'ACTIVO') ||
               (client.tipoClienteEsPolicia && client.estadoMilitar === 'ACTIVO');
      } else if (clientFilter === 'Extracupo Empresa') {
        return client.tipoClienteEsEmpresa;
      } else if (clientFilter === 'Cupo Deportista') {
        return client.tipoClienteEsDeportista;
      }
      
      // Fallback: usar tipoProcesoNombre si está disponible
      const tipoProceso = client.tipoProcesoNombre || client.tipoCliente;
      return tipoProceso === clientFilter;
    });
  }, [clientFilter, clients]);

  const getWeaponForClient = useCallback((clientId: string) => {
    return clientWeaponAssignments[clientId];
  }, [clientWeaponAssignments]);

  const handlePriceChangeWrapper = useCallback((price: number) => {
    if (selectedWeapon) {
      handlePriceChange(selectedWeapon.id, price);
    }
  }, [selectedWeapon, handlePriceChange]);

  const handleQuantityChangeWrapper = useCallback((quantity: number) => {
    if (selectedWeapon) {
      handleQuantityChange(selectedWeapon.id, quantity);
    }
  }, [selectedWeapon, handleQuantityChange]);

  const handleNavigateToWeaponSelection = useCallback(() => {
    setCurrentPage('weaponSelection');
  }, []);



  const getClientCountByType = useCallback((tipo: string) => {
    return clients.filter(client => {
      // Usar las banderas del tipo de cliente para clasificar correctamente
      if (tipo === 'Cupo Civil') {
        // Es civil si es civil O si es militar pero está pasivo
        return client.tipoClienteEsCivil || 
               (client.tipoClienteEsMilitar && client.estadoMilitar === 'PASIVO');
      } else if (tipo === 'Extracupo Uniformado') {
        // Es uniformado si es militar activo O policía activo
        return (client.tipoClienteEsMilitar && client.estadoMilitar === 'ACTIVO') ||
               (client.tipoClienteEsPolicia && client.estadoMilitar === 'ACTIVO');
      } else if (tipo === 'Extracupo Empresa') {
        return client.tipoClienteEsEmpresa;
      } else if (tipo === 'Cupo Deportista') {
        return client.tipoClienteEsDeportista;
      }
      
      // Fallback: usar tipoProcesoNombre si está disponible
      const tipoProceso = client.tipoProcesoNombre || client.tipoCliente;
      return tipoProceso === tipo;
    }).length;
  }, [clients]);

  // Funciones de paginación
  const handleNextPage = useCallback(() => {
    if (currentPageNumber < totalPages - 1) {
      loadClients(currentPageNumber + 1);
    }
  }, [currentPageNumber, totalPages, loadClients]);

  const handlePrevPage = useCallback(() => {
    if (currentPageNumber > 0) {
      loadClients(currentPageNumber - 1);
    }
  }, [currentPageNumber, loadClients]);

  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < totalPages) {
      loadClients(page);
    }
  }, [totalPages, loadClients]);

  const isLoading = clientsLoading || weaponsLoading || !isInitialized;

  return {
    // Estados
    currentPage,
    selectedClient,
    clientFormMode,
    clients,
    availableWeapons,
    selectedWeapon,
    precioModificado,
    cantidad,
    clientWeaponAssignments,
    weaponPrices,
    clientFilter,
    clientsLoading,
    weaponsLoading,
    isInitialized,
    clientesBloqueados,
    isLoading,
    
    // Paginación
    currentPageNumber,
    totalPages,
    totalClients,
    pageSize,
    
    // Funciones
    setCurrentPage,
    setSelectedClient,
    setClientFormMode,
    setSelectedWeapon,
    setPrecioModificado,
    setCantidad,
    setClientWeaponAssignments,
    setClientesBloqueados,
    
    getClientStatus,
    getStatusColor,
    getStatusText,
    handleCreateClient,
    handleAssignWeaponWithoutClient,
    handleClientSaved,
    handleClienteBloqueado,
    handleCloseForm,
    handleWeaponSelected,
    handlePriceChange,
    handleQuantityChange,
    handleFinishProcess,
    handlePaymentComplete,
    handleClientDataConfirm,
    handleWeaponSelectionConfirm,
    clientFormData,
    handleViewClient,
    handleEditClient,
    handleFilterByType,
    clearFilter,
    getFilteredClients,
    getWeaponForClient,
    handlePriceChangeWrapper,
    handleQuantityChangeWrapper,
    handleNavigateToWeaponSelection,

    getClientCountByType,
    
    // Funciones de paginación
    handleNextPage,
    handlePrevPage,
    goToPage,
    loadClients,
  };
};
