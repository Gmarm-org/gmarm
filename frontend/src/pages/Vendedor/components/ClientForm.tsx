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
  onNavigateToWeaponSelection
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableCantons, setAvailableCantons] = useState<string[]>([]);
  const [availableCantonsEmpresa, setAvailableCantonsEmpresa] = useState<string[]>([]);

  const tiposCliente = [
    { id: 1, nombre: 'Civil', codigo: 'CIVIL' },
    { id: 2, nombre: 'Uniformado', codigo: 'UNIFORMADO' },
    { id: 3, nombre: 'Compañía de Seguridad', codigo: 'COMPANIA_SEGURIDAD' },
    { id: 4, nombre: 'Deportista', codigo: 'DEPORTISTA' }
  ];

  const tiposIdentificacion = [
    { id: 1, nombre: 'Cédula', codigo: 'CEDULA' },
    { id: 2, nombre: 'RUC', codigo: 'RUC' },
    { id: 3, nombre: 'Pasaporte', codigo: 'PASAPORTE' }
  ];

  useEffect(() => {
    if (client && mode !== 'create') {
      setFormData(client);
    }
  }, [client, mode]);

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

  const handleInputChange = (field: keyof Client, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const newClient = await mockApiService.createCliente(formData);
      onSave(newClient);
    } catch (error: any) {
      setError(error.message || 'Error al guardar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const getRequiredDocuments = () => {
    switch (formData.tipoCliente) {
      case 'Civil':
        return ['Cédula de Identidad', 'Certificado de Antecedentes Penales', 'Certificado de Capacitación'];
      case 'Uniformado':
        return ['Cédula de Identidad', 'Certificado de Antecedentes Penales', 'Certificado de Capacitación', 'Certificado de Servicio Militar'];
      case 'Compañía de Seguridad':
        return ['RUC', 'Certificado de Antecedentes Penales', 'Certificado de Capacitación', 'Permiso de Funcionamiento'];
      case 'Deportista':
        return ['Cédula de Identidad', 'Certificado de Antecedentes Penales', 'Certificado de Capacitación', 'Certificado Médico Deportivo'];
      default:
        return [];
    }
  };

  const getSecurityQuestions = () => {
    switch (formData.tipoCliente) {
      case 'Civil':
        return [
          { id: 1, pregunta: '¿Ha tenido algún antecedente penal?', requerida: true },
          { id: 2, pregunta: '¿Ha recibido capacitación en el uso de armas?', requerida: true },
          { id: 3, pregunta: '¿Cuál es el motivo principal para adquirir un arma?', requerida: true }
        ];
      case 'Uniformado':
        return [
          { id: 1, pregunta: '¿Ha tenido algún antecedente penal?', requerida: true },
          { id: 2, pregunta: '¿Ha recibido capacitación en el uso de armas?', requerida: true },
          { id: 3, pregunta: '¿Cuál es el motivo principal para adquirir un arma?', requerida: true },
          { id: 4, pregunta: '¿Está actualmente en servicio activo?', requerida: true }
        ];
      case 'Compañía de Seguridad':
        return [
          { id: 1, pregunta: '¿La empresa tiene permiso de funcionamiento vigente?', requerida: true },
          { id: 2, pregunta: '¿Todos los empleados han recibido capacitación?', requerida: true },
          { id: 3, pregunta: '¿Cuál es el propósito principal de las armas?', requerida: true }
        ];
      case 'Deportista':
        return [
          { id: 1, pregunta: '¿Ha tenido algún antecedente penal?', requerida: true },
          { id: 2, pregunta: '¿Ha recibido capacitación en el uso de armas?', requerida: true },
          { id: 3, pregunta: '¿Cuál es el deporte que practica?', requerida: true },
          { id: 4, pregunta: '¿Tiene certificado médico deportivo vigente?', requerida: true }
        ];
      default:
        return [];
    }
  };

  const getAnswerForQuestion = (question: string) => {
    const respuesta = formData.respuestas?.find(r => r.pregunta === question);
    return respuesta?.respuesta || '';
  };

  const handleAnswerChange = (question: string, answer: string) => {
    const existingIndex = formData.respuestas?.findIndex(r => r.pregunta === question) || -1;
    const newRespuestas = [...(formData.respuestas || [])];
    
    if (existingIndex >= 0) {
      newRespuestas[existingIndex] = { ...newRespuestas[existingIndex], respuesta: answer };
    } else {
      newRespuestas.push({ id: Date.now().toString(), pregunta: question, respuesta: answer, tipo: 'TEXTO' });
    }
    
    setFormData(prev => ({ ...prev, respuestas: newRespuestas }));
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

  const isEmpresa = formData.tipoCliente === 'Compañía de Seguridad';
  const isUniformado = formData.tipoCliente === 'Uniformado';
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
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">Error: {error}</p>
                  </div>
                </div>
              </div>
            )}

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
                        placeholder="Ingrese los nombres"
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

                  <div className="md:col-span-2">
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

              {/* Documentos Requeridos */}
              {formData.tipoCliente && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Documentos Requeridos</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getRequiredDocuments().map((documentName, index) => (
                      <div key={index} className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{documentName}</h3>
                            <p className="text-sm text-gray-500">Documento requerido</p>
                          </div>
                          <input
                            type="file"
                            disabled={mode === 'view'}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preguntas de Seguridad */}
              {formData.tipoCliente && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="bg-orange-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Preguntas de Seguridad</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {getSecurityQuestions().map((question) => (
                      <div key={question.id} className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          {question.pregunta}
                          {question.requerida && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {mode === 'view' ? (
                          <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium min-h-[100px] flex items-start">
                            {getAnswerForQuestion(question.pregunta) || 'No especificado'}
                          </div>
                        ) : (
                          <textarea
                            value={getAnswerForQuestion(question.pregunta)}
                            onChange={(e) => handleAnswerChange(question.pregunta, e.target.value)}
                            required={question.requerida}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 resize-vertical min-h-[100px]"
                            placeholder="Ingrese su respuesta"
                            rows={3}
                          />
                        )}
                      </div>
                    ))}
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
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                
                {mode !== 'view' && (
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    disabled={isLoading || !validateForm()}
                  >
                    {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                  </button>
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