import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface TipoCliente {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
}

interface TipoIdentificacion {
  id: number;
  nombre: string;
  codigo: string;
}

interface TipoProceso {
  id: number;
  nombre: string;
  codigo: string;
}

interface PreguntaCliente {
  id: number;
  pregunta: string;
  obligatoria: boolean;
  tipoProcesoId: number;
}

interface DocumentoObligatorio {
  id: number;
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  tipoProcesoId: number;
}

interface ClienteFormData {
  nombres: string;
  apellidos: string;
  numeroIdentificacion: string;
  tipoIdentificacionCodigo: string;
  tipoClienteCodigo: string;
  fechaNacimiento: string;
  direccion: string;
  provincia: string;
  canton: string;
  email: string;
  telefonoPrincipal: string;
  telefonoSecundario: string;
  representanteLegal: string;
  ruc: string;
  nombreEmpresa: string;
  direccionFiscal: string;
  telefonoReferencia: string;
  correoEmpresa: string;
  provinciaEmpresa: string;
  cantonEmpresa: string;
  estadoMilitar: string;
}

const ClienteForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados para datos del formulario
  const [formData, setFormData] = useState<ClienteFormData>({
    nombres: '',
    apellidos: '',
    numeroIdentificacion: '',
    tipoIdentificacionCodigo: '',
    tipoClienteCodigo: '',
    fechaNacimiento: '',
    direccion: '',
    provincia: '',
    canton: '',
    email: '',
    telefonoPrincipal: '',
    telefonoSecundario: '',
    representanteLegal: '',
    ruc: '',
    nombreEmpresa: '',
    direccionFiscal: '',
    telefonoReferencia: '',
    correoEmpresa: '',
    provinciaEmpresa: '',
    cantonEmpresa: '',
    estadoMilitar: ''
  });

  // Estados para datos de referencia
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
  const [tiposIdentificacion, setTiposIdentificacion] = useState<TipoIdentificacion[]>([]);
  const [tiposProceso, setTiposProceso] = useState<TipoProceso[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaCliente[]>([]);
  const [documentosObligatorios, setDocumentosObligatorios] = useState<DocumentoObligatorio[]>([]);
  
  // Estados para el proceso
  const [tipoProcesoSeleccionado, setTipoProcesoSeleccionado] = useState<number | null>(null);
  const [documentos, setDocumentos] = useState<{ [key: number]: File }>({});
  const [respuestas, setRespuestas] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(4);

  // Cargar datos de referencia al montar el componente
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Cargar preguntas y documentos cuando cambie el tipo de proceso
  useEffect(() => {
    if (tipoProcesoSeleccionado) {
      loadPreguntasAndDocumentos();
    }
  }, [tipoProcesoSeleccionado]);

  const loadReferenceData = async () => {
    try {
      const [tiposClienteRes, tiposIdentificacionRes, tiposProcesoRes] = await Promise.all([
        apiService.getTiposCliente(),
        apiService.getTiposIdentificacion(),
        apiService.getTiposCliente() // Using tiposCliente as fallback for now
      ]);

      setTiposCliente(tiposClienteRes);
      setTiposIdentificacion(tiposIdentificacionRes);
      setTiposProceso(tiposProcesoRes);
    } catch (error) {
      console.error('Error cargando datos de referencia:', error);
      setError('Error cargando datos de referencia');
    }
  };

  const loadPreguntasAndDocumentos = async () => {
    if (!tipoProcesoSeleccionado) return;
    
    try {
      const [preguntasRes, documentosRes] = await Promise.all([
        apiService.getPreguntasCliente(tipoProcesoSeleccionado),
        apiService.getDocumentosRequeridos(tipoProcesoSeleccionado)
      ]);

      setPreguntas(preguntasRes);
      setDocumentosObligatorios(documentosRes);
    } catch (error) {
      console.error('Error cargando preguntas y documentos:', error);
    }
  };

  const handleInputChange = (field: keyof ClienteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = (documentoId: number, file: File) => {
    setDocumentos(prev => ({ ...prev, [documentoId]: file }));
  };

  const handleRespuestaChange = (preguntaId: number, respuesta: string) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: respuesta }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Información básica
        return !!(formData.nombres && formData.apellidos && formData.numeroIdentificacion && 
                 formData.tipoIdentificacionCodigo && formData.tipoClienteCodigo && formData.email);
      
      case 2: // Información adicional
        return !!(formData.direccion && formData.provincia && formData.canton && 
                 formData.telefonoPrincipal);
      
      case 3: // Documentos y preguntas
        if (!tipoProcesoSeleccionado) return false;
        
        // Verificar documentos obligatorios
        const documentosFaltantes = documentosObligatorios
          .filter(doc => doc.obligatorio)
          .filter(doc => !documentos[doc.id]);
        
        if (documentosFaltantes.length > 0) return false;
        
        // Verificar preguntas obligatorias
        const preguntasFaltantes = preguntas
          .filter(preg => preg.obligatoria)
          .filter(preg => !respuestas[preg.id]);
        
        return preguntasFaltantes.length === 0;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Crear el cliente
      const clienteData = {
        ...formData,
        tipoIdentificacionCodigo: formData.tipoIdentificacionCodigo,
        tipoClienteCodigo: formData.tipoClienteCodigo
      };

      const cliente = await apiService.createCliente(clienteData);

      // 2. Subir documentos
      for (const [documentoId, file] of Object.entries(documentos)) {
        const formDataDoc = new FormData();
        formDataDoc.append('clienteId', cliente.id.toString());
        formDataDoc.append('tipoDocumentoId', documentoId.toString());
        formDataDoc.append('archivo', file);
        formDataDoc.append('usuarioId', user?.id?.toString() || '1');

        await apiService.cargarDocumentoCliente(cliente.id, parseInt(documentoId), file);
      }

      // 3. Guardar respuestas a preguntas
      for (const [preguntaId, respuesta] of Object.entries(respuestas)) {
        await apiService.guardarRespuestaCliente(
          cliente.id,
          parseInt(preguntaId),
          respuesta,
          user?.id || 1
        );
      }

      // 4. Enviar email de confirmación
      // TODO: Implement email confirmation endpoint
      console.log('Email confirmation would be sent for client:', cliente.id);

      // 5. Redirigir al dashboard
      navigate('/vendedor');
      
    } catch (error) {
      console.error('Error creando cliente:', error);
      setError('Error creando el cliente. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              i + 1 < currentStep
                ? 'bg-green-500 text-white'
                : i + 1 === currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {i + 1 < currentStep ? '✓' : i + 1}
          </div>
        ))}
      </div>
      <div className="text-center mt-2 text-sm text-gray-600">
        Paso {currentStep} de {totalSteps}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Básica del Cliente</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombres *</label>
          <input
            type="text"
            value={formData.nombres}
            onChange={(e) => handleInputChange('nombres', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
          <input
            type="text"
            value={formData.apellidos}
            onChange={(e) => handleInputChange('apellidos', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Número de Identificación *</label>
          <input
            type="text"
            value={formData.numeroIdentificacion}
            onChange={(e) => handleInputChange('numeroIdentificacion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Identificación *</label>
          <select
            value={formData.tipoIdentificacionCodigo}
            onChange={(e) => handleInputChange('tipoIdentificacionCodigo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar...</option>
            {tiposIdentificacion.map(tipo => (
              <option key={tipo.id} value={tipo.codigo}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cliente *</label>
          <select
            value={formData.tipoClienteCodigo}
            onChange={(e) => handleInputChange('tipoClienteCodigo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar...</option>
            {tiposCliente.map(tipo => (
              <option key={tipo.id} value={tipo.codigo}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Adicional</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
          <input
            type="text"
            value={formData.direccion}
            onChange={(e) => handleInputChange('direccion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
          <input
            type="text"
            value={formData.provincia}
            onChange={(e) => handleInputChange('provincia', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cantón *</label>
          <input
            type="text"
            value={formData.canton}
            onChange={(e) => handleInputChange('canton', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Principal *</label>
          <input
            type="tel"
            value={formData.telefonoPrincipal}
            onChange={(e) => handleInputChange('telefonoPrincipal', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Secundario</label>
          <input
            type="tel"
            value={formData.telefonoSecundario}
            onChange={(e) => handleInputChange('telefonoSecundario', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
          <input
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Campos específicos según tipo de cliente */}
      {formData.tipoClienteCodigo === 'EMP' && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-700 mb-4">Información de Empresa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RUC</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => handleInputChange('ruc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Empresa</label>
              <input
                type="text"
                value={formData.nombreEmpresa}
                onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Representante Legal</label>
              <input
                type="text"
                value={formData.representanteLegal}
                onChange={(e) => handleInputChange('representanteLegal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {(formData.tipoClienteCodigo === 'MIL' || formData.tipoClienteCodigo === 'NAV' || 
        formData.tipoClienteCodigo === 'AER' || formData.tipoClienteCodigo === 'POL') && (
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-700 mb-4">Información Militar</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado Militar</label>
              <select
                value={formData.estadoMilitar}
                onChange={(e) => handleInputChange('estadoMilitar', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                <option value="ACTIVO">Activo</option>
                <option value="PASIVO">Pasivo</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Proceso y Documentos</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Proceso *</label>
        <select
          value={tipoProcesoSeleccionado || ''}
          onChange={(e) => setTipoProcesoSeleccionado(parseInt(e.target.value) || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Seleccionar tipo de proceso...</option>
          {tiposProceso.map(tipo => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
      </div>

      {tipoProcesoSeleccionado && (
        <>
          {/* Documentos Obligatorios */}
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-700 mb-4">Documentos Obligatorios</h4>
            <div className="space-y-4">
              {documentosObligatorios.map(documento => (
                <div key={documento.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-800">{documento.nombre}</h5>
                      <p className="text-sm text-gray-600">{documento.descripcion}</p>
                      {documento.obligatorio && (
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-1">
                          Obligatorio
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleDocumentUpload(documento.id, file);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </div>
                  {documentos[documento.id] && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ {documentos[documento.id].name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preguntas Obligatorias */}
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-700 mb-4">Preguntas Obligatorias</h4>
            <div className="space-y-4">
              {preguntas.map(pregunta => (
                <div key={pregunta.id} className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {pregunta.pregunta}
                    {pregunta.obligatoria && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    value={respuestas[pregunta.id] || ''}
                    onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Escribe tu respuesta aquí..."
                    required={pregunta.obligatoria}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Revisión Final</h3>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-800 mb-4">Resumen del Cliente</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Nombres:</span> {formData.nombres}
          </div>
          <div>
            <span className="font-medium">Apellidos:</span> {formData.apellidos}
          </div>
          <div>
            <span className="font-medium">Identificación:</span> {formData.numeroIdentificacion}
          </div>
          <div>
            <span className="font-medium">Email:</span> {formData.email}
          </div>
          <div>
            <span className="font-medium">Teléfono:</span> {formData.telefonoPrincipal}
          </div>
          <div>
            <span className="font-medium">Dirección:</span> {formData.direccion}
          </div>
        </div>

        <div className="mt-6">
          <h5 className="font-medium text-gray-800 mb-2">Documentos Cargados:</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            {Object.entries(documentos).map(([id, file]) => (
              <li key={id}>✓ {file.name}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h5 className="font-medium text-gray-800 mb-2">Preguntas Respondidas:</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            {Object.entries(respuestas).map(([id, respuesta]) => (
              <li key={id}>✓ {respuesta.substring(0, 50)}...</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Al confirmar, se creará el cliente, se enviará un email de confirmación con el contrato para firmar, 
              y se iniciará el proceso de importación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Cliente</h1>
              <p className="mt-2 text-gray-600">
                Completa la información del cliente para iniciar el proceso de importación
              </p>
            </div>
            <button
              onClick={() => navigate('/vendedor')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {renderStepIndicator()}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <div className="flex space-x-3">
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creando Cliente...' : 'Crear Cliente y Enviar Contrato'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteForm;
