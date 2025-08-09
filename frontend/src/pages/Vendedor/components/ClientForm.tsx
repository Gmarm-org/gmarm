import React, { useState, useEffect } from 'react';
import { mockApiService } from '../../../services/mockApiService';
import { ecuadorProvinces } from '../../../data/ecuadorLocations';
import { calcularEdad, validarEdadMinima, obtenerMensajeErrorEdad } from '../../../utils/ageValidation';
import type { Client } from '../types';
import type { Weapon } from '../types';

interface ClientFormProps {
  mode: 'create' | 'edit' | 'view';
  client?: Client | null;
  onSave: (client: Client) => void;
  onCancel: () => void;
  selectedWeapon?: Weapon | null;
  precioModificado?: number;
  cantidad?: number;
  onPriceChange?: (price: number) => void;
  onQuantityChange?: (quantity: number) => void;
  onNavigateToWeaponSelection?: () => void;
  onClienteBloqueado?: (clientId: string, bloqueado: boolean, motivo: string) => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  mode, 
  client, 
  onSave, 
  onCancel,
  selectedWeapon,
  precioModificado = 0,
  cantidad = 1,
  onPriceChange,
  onQuantityChange,
  onNavigateToWeaponSelection,
  onClienteBloqueado
}) => {

  const [formData, setFormData] = useState<Client>({
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

  const [availableCantons, setAvailableCantons] = useState<string[]>([]);
  const [availableCantonsEmpresa, setAvailableCantonsEmpresa] = useState<string[]>([]);
  const [clientQuestions, setClientQuestions] = useState<any[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({});
  const [documentStatus, setDocumentStatus] = useState<'pending' | 'complete' | 'incomplete'>('pending');
  const [showMilitaryWarning, setShowMilitaryWarning] = useState(false);
  const [clienteBloqueado, setClienteBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState<string>('');

  // Determinar si es empresa
  const isEmpresa = formData.tipoCliente === 'Compañía de Seguridad';
  const isUniformado = formData.tipoCliente === 'Uniformado';

  // Cargar preguntas y documentos cuando cambie el tipo de cliente
  useEffect(() => {
    const loadQuestionsAndDocuments = async () => {
      try {
        const questions = await mockApiService.getClientQuestions(formData.tipoCliente, formData.estadoMilitar);
        const documents = await mockApiService.getDocumentsByClientType(formData.tipoCliente, formData.estadoMilitar);
        
        setClientQuestions(questions);
        setRequiredDocuments(documents);
      } catch (error) {
        console.error('Error cargando preguntas y documentos:', error);
      }
    };

    if (formData.tipoCliente) {
      loadQuestionsAndDocuments();
    }
  }, [formData.tipoCliente, formData.estadoMilitar]);

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
        uploadedDocuments[doc.nombre]
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
  }, [uploadedDocuments, requiredDocuments]);

  // Función para convertir a mayúsculas
  const toUpperCase = (value: string) => {
    return value.toUpperCase();
  };

  // Validación de cédula/RUC
  const validateIdentification = (value: string, type: string) => {
    if (!value) return '';
    
    if (type === 'Cédula') {
      if (value.length !== 10) {
        return 'La cédula debe tener exactamente 10 dígitos';
      }
    } else if (type === 'RUC') {
      if (value.length !== 13) {
        return 'El RUC debe tener exactamente 13 dígitos';
      }
    }
    
    return '';
  };

  // Validación de nombres (solo letras y espacios)
  const validateName = (value: string) => {
    if (!value) return '';
    
    const nameRegex = /^[A-ZÁÉÍÓÚÑ\s]+$/;
    if (!nameRegex.test(value)) {
      return 'Solo se permiten letras y espacios';
    }
    
    return '';
  };

  // Función para validar teléfono
  const validatePhone = (value: string) => {
    return /^\d{0,10}$/.test(value);
  };

  // Función para manejar carga de documentos
  const handleDocumentUpload = (documentName: string, file: File) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentName]: file
    }));
  };

  // Función para obtener el estado de color de documentos
  const getDocumentStatusColor = () => {
    switch (documentStatus) {
      case 'complete': return 'bg-green-100 border-green-500 text-green-700';
      case 'incomplete': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'pending': return 'bg-gray-100 border-gray-500 text-gray-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
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
  const getAnswerForQuestion = (question: string) => {
    const respuesta = formData.respuestas?.find(r => r.pregunta === question);
    const result = respuesta?.respuesta || '';
    console.log('getAnswerForQuestion:', { 
      question, 
      result, 
      allRespuestas: formData.respuestas,
      foundRespuesta: respuesta,
      formDataLength: formData.respuestas?.length || 0,
      formDataKeys: formData.respuestas ? Object.keys(formData.respuestas) : []
    });
    return result;
  };

  // Función para manejar cambio de respuesta
  const handleAnswerChange = (question: string, answer: string) => {
    console.log('handleAnswerChange called:', { question, answer, currentRespuestas: formData.respuestas });
    
    // Use a more direct approach to avoid potential race conditions
    setFormData(prev => {
      const currentRespuestas = prev.respuestas || [];
      const existingIndex = currentRespuestas.findIndex(r => r.pregunta === question);
      
      console.log('setFormData - existingIndex:', existingIndex, 'for question:', question);
      
      let newRespuestas;
      if (existingIndex >= 0) {
        // Update existing answer
        newRespuestas = [...currentRespuestas];
        newRespuestas[existingIndex] = { ...newRespuestas[existingIndex], respuesta: answer };
        console.log('Updated existing answer at index:', existingIndex, 'with answer:', answer);
      } else {
        // Add new answer
        newRespuestas = [...currentRespuestas, { 
          id: Date.now().toString(), 
          pregunta: question, 
          respuesta: answer, 
          tipo: 'TEXTO' 
        }];
        console.log('Added new answer for question:', question, 'with answer:', answer);
      }
      
      console.log('New respuestas array:', newRespuestas);
      
      const updatedFormData = { ...prev, respuestas: newRespuestas };
      console.log('setFormData returning updated formData with respuestas:', updatedFormData.respuestas);
      return updatedFormData;
    });
  };

  const tiposCliente = [
    { id: 1, nombre: 'Civil', codigo: 'CIVIL' },
    { id: 2, nombre: 'Uniformado', codigo: 'UNIFORMADO' },
    { id: 3, nombre: 'Compañía de Seguridad', codigo: 'COMPANIA_SEGURIDAD' },
    { id: 4, nombre: 'Deportista', codigo: 'DEPORTISTA' }
  ];

  const tiposIdentificacion = [
    { id: 1, nombre: 'Cédula', codigo: 'CEDULA' },
    { id: 2, nombre: 'RUC', codigo: 'RUC' }
  ];

  useEffect(() => {
    if (client && mode !== 'create') {
      setFormData(client);
      
      // Reset bloqueo state first
      setClienteBloqueado(false);
      setMotivoBloqueo('');
      
      // Validar respuestas existentes para verificar si está bloqueado (sin notificar al padre al cargar)
      if (client.respuestas) {
        const violenciaRespuesta = client.respuestas.find(r => r.pregunta.includes('denuncias de violencia'));
        if (violenciaRespuesta?.respuesta === 'SI') {
          setClienteBloqueado(true);
          setMotivoBloqueo('Denuncias de violencia de género o intrafamiliar');
        }
      }
    } else if (mode === 'create') {
      // Reset form data for create mode
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
  }, [client?.id, mode]); // Use client.id instead of client to avoid unnecessary re-renders

  // Monitor formData.respuestas changes for debugging
  useEffect(() => {
    console.log('formData.respuestas changed:', formData.respuestas);
  }, [formData.respuestas]);

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
        if (respuesta.pregunta.includes('denuncias de violencia')) {
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
    if (formData.provincia) {
      const cantons = ecuadorProvinces.find(p => p.nombre === formData.provincia)?.cantones || [];
      setAvailableCantons(cantons.map(c => c.nombre));
    }
  }, [formData.provincia]);

  useEffect(() => {
    if (formData.provinciaEmpresa) {
      const cantons = ecuadorProvinces.find(p => p.nombre === formData.provinciaEmpresa)?.cantones || [];
      setAvailableCantonsEmpresa(cantons.map(c => c.nombre));
    }
  }, [formData.provinciaEmpresa]);

  // Función para manejar cambios en los campos del formulario
  const handleInputChange = (field: keyof Client, value: string) => {
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
      
      processedValue = numericValue;
    }
    // Para campos de dropdown (tipoCliente, tipoIdentificacion, provincia, canton, etc.) no aplicar procesamiento

    // Validar campos específicos
    if (field === 'numeroIdentificacion') {
      validateIdentification(processedValue, formData.tipoIdentificacion);
    } else if (['nombres', 'apellidos', 'representanteLegal'].includes(field)) {
      validateName(processedValue);
    } else if (['telefonoPrincipal', 'telefonoSecundario', 'telefonoReferencia'].includes(field)) {
      validatePhone(processedValue);
    }

    // Actualizar el formulario con el valor procesado (mayúsculas/minúsculas)
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
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
      let clientStatus: 'FALTAN_DOCUMENTOS' | 'BLOQUEADO' | 'LISTO_IMPORTACION' = 'FALTAN_DOCUMENTOS';
      
      if (clienteBloqueado) {
        clientStatus = 'BLOQUEADO';
      } else if (documentStatus === 'complete') {
        clientStatus = 'LISTO_IMPORTACION';
      }

      let updatedClient;
      if (mode === 'edit' && client) {
        // Actualizar cliente existente - incluir el ID original y el estado
        const clientData = {
          ...formData,
          id: client.id, // Mantener el ID original
          estado: clientStatus
        };
        updatedClient = await mockApiService.updateCliente(client.id, clientData as any);
      } else {
        // Crear nuevo cliente con estado
        const clientData = {
          ...formData,
          estado: clientStatus
        };
        updatedClient = await mockApiService.createCliente(clientData as any);
      }
      
      // Notificar al componente padre sobre el estado de bloqueo
      if (clienteBloqueado) {
        onClienteBloqueado?.(updatedClient.id, true, motivoBloqueo);
      } else if (client && (client as any).estado === 'BLOQUEADO' && !clienteBloqueado) {
        // Si el cliente estaba bloqueado pero ya no lo está, notificar el desbloqueo
        onClienteBloqueado?.(updatedClient.id, false, '');
      }
      
      onSave(updatedClient as any);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente. Por favor, intente nuevamente.');
    }
  };

  const getMaxLength = () => {
    switch (formData.tipoIdentificacion) {
      case 'Cédula': return 10;
      case 'RUC': return 13;
      case 'Pasaporte': return 20;
      default: return 20;
    }
  };

  const validateForm = () => {
    if (!formData.tipoCliente || !formData.tipoIdentificacion || !formData.numeroIdentificacion || 
        !formData.nombres || !formData.apellidos || !formData.email || !formData.telefonoPrincipal || 
        !formData.direccion || !formData.provincia || !formData.canton || !formData.fechaNacimiento) {
      return false;
    }

    const isEmpresa = formData.tipoCliente === 'Compañía de Seguridad';
    const isUniformado = formData.tipoCliente === 'Uniformado';

    if (isEmpresa) {
      if (!formData.representanteLegal?.trim()) return false;
      if (!formData.ruc?.trim()) return false;
      if (!formData.nombreEmpresa?.trim()) return false;
      if (!formData.direccionFiscal?.trim()) return false;
      if (!formData.telefonoReferencia?.trim()) return false;
      if (!formData.correoEmpresa?.trim()) return false;
      if (!formData.provinciaEmpresa) return false;
      if (!formData.cantonEmpresa) return false;
    }

    if (isUniformado && !formData.estadoMilitar) return false;

    return true;
  };

  // Función para validar si puede continuar con el proceso de armas
  const canContinueWithWeapons = () => {
    return validateForm() && !clienteBloqueado;
  };

  const edad = calcularEdad(formData.fechaNacimiento);
  const edadValida = validarEdadMinima(formData.fechaNacimiento);
  const mensajeErrorEdad = obtenerMensajeErrorEdad(formData.fechaNacimiento);



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
                        {formData.tipoIdentificacion || 'No especificado'}
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
                          <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                        placeholder={`Ingrese ${formData.tipoIdentificacion.toLowerCase()}`}
                      />
                    )}
                  </div>

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
                        {formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toLocaleDateString('es-ES') : 'No especificado'}
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      />
                    )}
                    {formData.fechaNacimiento && (
                      <div className={`mt-2 p-3 rounded-lg text-sm ${edadValida ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        <span className="font-medium">Edad: {edad} años</span>
                        {!edadValida && <p className="mt-1">{mensajeErrorEdad}</p>}
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                        placeholder="0999999999 (opcional)"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Provincia *</label>
                    {mode === 'view' ? (
                      <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                        {formData.provincia || 'No especificado'}
                      </div>
                    ) : (
                      <select
                        value={formData.provincia}
                        onChange={(e) => handleInputChange('provincia', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="">Seleccionar provincia</option>
                        {ecuadorProvinces.map(provincia => (
                          <option key={provincia.nombre} value={provincia.nombre}>{provincia.nombre}</option>
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
                        {availableCantons.map(canton => (
                          <option key={canton} value={canton}>{canton}</option>
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

                  {isUniformado && (
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                          placeholder="correo@empresa.com"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Provincia de la Empresa *</label>
                      {mode === 'view' ? (
                        <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                          {formData.provinciaEmpresa || 'No especificado'}
                        </div>
                      ) : (
                        <select
                          value={formData.provinciaEmpresa}
                          onChange={(e) => handleInputChange('provinciaEmpresa', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                        >
                          <option value="">Seleccionar provincia</option>
                          {ecuadorProvinces.map(provincia => (
                            <option key={provincia.nombre} value={provincia.nombre}>{provincia.nombre}</option>
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
                          {availableCantonsEmpresa.map(canton => (
                            <option key={canton} value={canton}>{canton}</option>
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
                          document.link 
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
                              {document.link && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                  </svg>
                                  Con Link
                                </span>
                              )}
                              {document.obligatorio && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Obligatorio
                                </span>
                              )}
                              {uploadedDocuments[document.nombre] && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Subido
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {document.link && (
                          <div className="mb-3">
                            <a 
                              href={document.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                              Abrir enlace para descargar
                            </a>
                          </div>
                        )}
                        
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
                        currentValue: getAnswerForQuestion(question.pregunta),
                        isViolenceQuestion: question.pregunta.includes('denuncias de violencia')
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
                              {question.tipo_respuesta === 'SI_NO' && (
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
                          question.tipo_respuesta === 'SI_NO' ? (
                            <div>
                              <select
                                key={`${question.id}-${getAnswerForQuestion(question.pregunta)}`}
                                value={getAnswerForQuestion(question.pregunta)}
                                onChange={(e) => {
                                  console.log('Dropdown onChange triggered:', { 
                                    question: question.pregunta, 
                                    newValue: e.target.value,
                                    currentValue: getAnswerForQuestion(question.pregunta)
                                  });
                                  handleAnswerChange(question.pregunta, e.target.value);
                                }}
                                required={question.obligatoria}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                              >
                                <option value="">Seleccionar respuesta</option>
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                              </select>

                            </div>
                          ) : (
                            <textarea
                              value={getAnswerForQuestion(question.pregunta)}
                              onChange={(e) => handleAnswerChange(question.pregunta, e.target.value)}
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
                </div>
              )}

              {/* Sección de Arma Asignada */}
              {(mode === 'view' || mode === 'edit') && selectedWeapon && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-red-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Arma Asignada</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Arma</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Modelo:</span>
                          <span className="text-gray-900">{selectedWeapon.modelo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Calibre:</span>
                          <span className="text-gray-900">{selectedWeapon.calibre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Capacidad:</span>
                          <span className="text-gray-900">{selectedWeapon.capacidad}</span>
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
                            disabled={mode === 'view'}
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
                            disabled={mode === 'view'}
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
                              <span className="font-medium text-gray-700">IVA (15%):</span>
                              <span className="text-green-600 font-semibold">${(precioModificado * cantidad * 0.15).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t pt-2">
                              <span>Total:</span>
                              <span className="text-green-600">${(precioModificado * cantidad * 1.15).toFixed(2)}</span>
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

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
                      // Cambiar a modo edit
                      const event = new Event('edit-mode');
                      window.dispatchEvent(event);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
                  >
                    Editar Cliente
                  </button>
                )}
                
                {mode !== 'view' && (
                  <>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      disabled={!validateForm()}
                    >
                      {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                    </button>
                    
                    {/* Botón para continuar con selección de armas (solo si no está bloqueado) */}
                    {!clienteBloqueado && (
                      <button
                        type="button"
                        onClick={() => onNavigateToWeaponSelection?.()}
                        disabled={!canContinueWithWeapons()}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        Continuar con Selección de Armas
                      </button>
                    )}
                    
                    {/* Botón para guardar cliente bloqueado */}
                    {clienteBloqueado && (
                      <button
                        type="button"
                        onClick={() => onSave(formData)}
                        disabled={!validateForm()}
                        className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        Guardar Cliente Bloqueado
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