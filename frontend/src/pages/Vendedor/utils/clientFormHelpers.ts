import { getMaxLengthIdentificacion } from '../../../utils/typeMappers';
import type { ClientFormData } from '../hooks/useClientFormData';

/**
 * Funciones helper compartidas para el formulario de cliente
 * Extraídas de ClientForm.tsx para evitar duplicación de código
 */

export const getNombreTipoIdentificacion = (codigo: string, tiposIdentificacion: Array<{codigo: string, nombre: string}>): string => {
  const tipo = tiposIdentificacion.find(t => t.codigo === codigo);
  return tipo ? tipo.nombre : codigo;
};

export const getMaxLength = (formData: ClientFormData): number => {
  return getMaxLengthIdentificacion(formData.tipoIdentificacion);
};

export const validateFormData = (formData: ClientFormData, validateIdentificacion: (id: string, tipo: string) => boolean, validateEmail: (email: string) => boolean, validateTelefono: (tel: string) => boolean): boolean => {
  // Validaciones básicas de campos obligatorios
  if (!formData.tipoCliente || !formData.tipoIdentificacion || !formData.numeroIdentificacion || 
      !formData.nombres || !formData.apellidos || !formData.email || !formData.telefonoPrincipal || 
      !formData.direccion || !formData.provincia || !formData.canton || !formData.fechaNacimiento) {
    return false;
  }

  // Validar identificación
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

  // Validaciones específicas para empresa
  if (formData.tipoCliente === 'Compañía de Seguridad') {
    if (!formData.representanteLegal || !formData.ruc || !formData.nombreEmpresa || 
        !formData.direccionFiscal || !formData.telefonoReferencia || !formData.correoEmpresa || 
        !formData.provinciaEmpresa || !formData.cantonEmpresa) {
      return false;
    }

    // Validar RUC
    if (!validateIdentificacion(formData.ruc, 'RUC')) {
      return false;
    }

    // Validar teléfono de referencia
    if (!validateTelefono(formData.telefonoReferencia)) {
      return false;
    }

    // Validar correo empresa
    if (!validateEmail(formData.correoEmpresa)) {
      return false;
    }
  }

  return true;
};
