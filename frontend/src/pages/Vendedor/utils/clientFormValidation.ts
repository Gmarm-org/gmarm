import { validateIdentificacion, validateTelefono, validateEmail } from '../../../utils/validations';

interface FormDataForValidation {
  tipoCliente: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  direccion: string;
  provincia: string;
  canton: string;
  fechaNacimiento: string;
  estadoMilitar?: string;
  rango?: string;
  codigoIssfa?: string;
  codigoIsspol?: string;
  representanteLegal?: string;
  ruc?: string;
  nombreEmpresa?: string;
  direccionFiscal?: string;
  telefonoReferencia?: string;
  correoEmpresa?: string;
  provinciaEmpresa?: string;
  cantonEmpresa?: string;
}

interface ValidateFormOptions {
  isMilitaryType: boolean;
  isPoliceType: boolean;
}

export function validateClientForm(formData: FormDataForValidation, options: ValidateFormOptions): boolean {
  const { isMilitaryType, isPoliceType } = options;

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

    if (!validateIdentificacion(formData.ruc, 'RUC')) {
      return false;
    }
    if (!validateTelefono(formData.telefonoReferencia)) {
      return false;
    }
    if (!validateEmail(formData.correoEmpresa)) {
      return false;
    }
  }

  const isUniformadoValidacion = isUniformadoByType || isMilitaryType || isPoliceType;
  if (isUniformadoValidacion) {
    if (!formData.estadoMilitar) return false;
    if (!formData.rango || !formData.rango.trim()) return false;

    // Validar código ISSFA para militares activos y pasivos
    if (isMilitaryType && (formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO')) {
      if (!formData.codigoIssfa || formData.codigoIssfa.trim() === '') {
        return false;
      }
      if (!/^\d{10}$/.test(formData.codigoIssfa)) {
        return false;
      }
    }

    // Validar código ISSPOL para policías activos y pasivos
    if (isPoliceType && (formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO')) {
      if (!formData.codigoIsspol || formData.codigoIsspol.trim() === '') {
        return false;
      }
      if (!/^\d{10}$/.test(formData.codigoIsspol)) {
        return false;
      }
    }
  }

  return true;
}

export function canContinueWithWeapons(
  formData: FormDataForValidation,
  options: ValidateFormOptions,
  clienteBloqueado: boolean,
  edadValida: boolean
): boolean {
  if (!validateClientForm(formData, options)) {
    return false;
  }
  if (clienteBloqueado) {
    return false;
  }
  if (!edadValida) {
    return false;
  }
  return true;
}
