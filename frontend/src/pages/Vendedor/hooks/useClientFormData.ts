import { useState, useCallback } from 'react';
import { mapTipoIdentificacionToCode, getMaxLengthIdentificacion } from '../../../utils/typeMappers';
import type { Client } from '../types';

// Tipo local para respuestas del formulario
export interface RespuestaFormulario {
  id: string;
  pregunta: string;
  respuesta: string;
  tipo: string;
  questionId?: number;
}

// Tipo extendido para el formulario que incluye respuestas del formulario
export interface ClientFormData extends Omit<Client, 'respuestas'> {
  respuestas: RespuestaFormulario[];
  codigoIssfa?: string; // Para militares
  codigoIsspol?: string; // Para policías (nuevo campo)
  rango?: string;
}

const initialFormData: ClientFormData = {
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
  codigoIssfa: '', // Para militares
  codigoIsspol: '', // Para policías (nuevo campo)
  rango: '',
  documentos: [],
  respuestas: []
};

/**
 * Hook para manejar el estado y lógica del formulario de cliente
 * Extraído de ClientForm para mejorar mantenibilidad
 */
export const useClientFormData = () => {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [showMilitaryWarning, setShowMilitaryWarning] = useState(false);
  const [clienteBloqueado, setClienteBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState<string>('');

  // Transformaciones de valor
  const toUpperCase = (value: string) => {
    return value.toUpperCase();
  };

  // Función para manejar cambios en los campos del formulario
  const handleInputChange = useCallback((field: keyof ClientFormData, value: string) => {
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
        const tipoIdentificacionCodigo = mapTipoIdentificacionToCode(formData.tipoIdentificacion);
        const maxLength = getMaxLengthIdentificacion(tipoIdentificacionCodigo);
        numericValue = numericValue.slice(0, maxLength);
      }
      
      // Para RUC, limitar a 13 dígitos
      if (field === 'ruc') {
        numericValue = numericValue.slice(0, 13);
      }
      
      // Para códigos ISSFA e ISSPOL, limitar a 10 dígitos
      if (field === 'codigoIssfa' || field === 'codigoIsspol') {
        numericValue = numericValue.slice(0, 10);
      }
      
      processedValue = numericValue;
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  return {
    formData,
    setFormData,
    handleInputChange,
    resetFormData,
    showMilitaryWarning,
    setShowMilitaryWarning,
    clienteBloqueado,
    setClienteBloqueado,
    motivoBloqueo,
    setMotivoBloqueo
  };
};
