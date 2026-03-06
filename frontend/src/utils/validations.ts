/**
 * Valida una cédula ecuatoriana.
 * Provincia válida (01-24), tercer dígito < 6 (persona natural),
 * dígito verificador con algoritmo módulo 10.
 */
export const validateCedula = (cedula: string): boolean => {
  if (!cedula || cedula.length !== 10) return false;
  if (!/^\d{10}$/.test(cedula)) return false;

  const digits = cedula.split('').map(Number);

  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;

  if (digits[2] >= 6) return false;

  // Algoritmo módulo 10: posiciones pares * 2, si > 9 restar 9
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
};

/**
 * Valida un RUC ecuatoriano (13 dígitos).
 * Persona Natural (3er dígito < 6): cédula + "001".
 * Sociedad Pública (3er dígito = 6): módulo 11, termina en "0001".
 * Sociedad Privada (3er dígito = 9): módulo 11, termina en "001".
 */
export const validateRUC = (ruc: string): boolean => {
  if (!ruc || ruc.length !== 13) return false;
  if (!/^\d{13}$/.test(ruc)) return false;

  const digits = ruc.split('').map(Number);

  const provincia = parseInt(ruc.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;

  const thirdDigit = digits[2];

  // Persona Natural
  if (thirdDigit < 6) {
    if (ruc.substring(10) !== '001') return false;
    const cedula = ruc.substring(0, 10);
    return validateCedula(cedula);
  }

  // Sociedad Pública — módulo 11, coeficientes [3,2,7,6,5,4,3,2], check en posición 8
  else if (thirdDigit === 6) {
    if (ruc.substring(9) !== '0001') return false;

    const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += digits[i] * coefficients[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;

    return checkDigit === digits[8];
  }

  // Sociedad Privada — módulo 11, coeficientes [4,3,2,7,6,5,4,3,2], check en posición 9
  else if (thirdDigit === 9) {
    if (ruc.substring(10) !== '001') return false;

    const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += digits[i] * coefficients[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;

    return checkDigit === digits[9];
  }

  return false;
};

export const validateIdentificacion = (identificacion: string, tipo: string): boolean => {
  const cleaned = identificacion?.trim() || '';

  switch (tipo) {
    case 'CED':
      return validateCedula(cleaned);
    case 'RUC':
      return validateRUC(cleaned);
    case 'PAS':
      return cleaned.length >= 6 && cleaned.length <= 20;
    default:
      return cleaned.length > 0;
  }
};

export const validateTelefono = (telefono: string): boolean => {
  if (!telefono) return false;
  const cleanTelefono = telefono.replace(/[\s\-()]/g, '');
  return /^\d{10}$/.test(cleanTelefono);
};

export const formatTelefono = (telefono: string): string => {
  if (!telefono) return '';
  const cleanTelefono = telefono.replace(/[\s\-()]/g, '');
  if (cleanTelefono.length === 10) {
    return `(${cleanTelefono.substring(0, 3)}) ${cleanTelefono.substring(3, 6)}-${cleanTelefono.substring(6)}`;
  }
  
  return cleanTelefono;
};

export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePrice = (price: string): boolean => {
  if (!price) return false;
  const cleanPrice = price.replace(/[^0-9.,]/g, '');
  const normalizedPrice = cleanPrice.replace(',', '.');
  const numPrice = parseFloat(normalizedPrice);
  return !isNaN(numPrice) && numPrice >= 0;
};

export const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

export const parsePrice = (priceString: string): number => {
  if (!priceString) return 0;
  const cleanPrice = priceString.replace(/[^0-9.,]/g, '');
  const normalizedPrice = cleanPrice.replace(',', '.');
  const numPrice = parseFloat(normalizedPrice);
  return isNaN(numPrice) ? 0 : numPrice;
};

export const validateQuantity = (quantity: string): boolean => {
  if (!quantity) return false;
  
  const numQuantity = parseInt(quantity);
  return !isNaN(numQuantity) && numQuantity > 0 && numQuantity <= 999;
};

export const validateDireccion = (direccion: string): boolean => {
  if (!direccion) return false;
  return direccion.length >= 10 && direccion.length <= 500;
};

export const validateNombre = (nombre: string): boolean => {
  if (!nombre) return false;
  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return nombreRegex.test(nombre) && nombre.length >= 2 && nombre.length <= 100;
};

export const formatNombre = (nombre: string): string => {
  if (!nombre) return '';
  return nombre.toUpperCase().trim().replace(/\s+/g, ' ');
};

export const validateRequired = (value: string): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

export const validateLength = (value: string, min: number, max: number): boolean => {
  if (!value) return false;
  return value.length >= min && value.length <= max;
};

export const validateSelection = (value: string): boolean => {
  return value !== null && value !== undefined && value !== '';
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateClientForm = (formData: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];

  if (!validateSelection(formData.tipoCliente as string)) {
    errors.push('Tipo de cliente es obligatorio');
  }

  if (!validateSelection(formData.tipoIdentificacion as string)) {
    errors.push('Tipo de identificación es obligatorio');
  }

  if (!validateIdentificacion(formData.cedula as string, formData.tipoIdentificacion as string)) {
    errors.push('Número de identificación no es válido');
  }

  if (!validateNombre(formData.nombres as string)) {
    errors.push('Nombres no son válidos');
  }

  if (!validateNombre(formData.apellidos as string)) {
    errors.push('Apellidos no son válidos');
  }

  if (!validateEmail(formData.email as string)) {
    errors.push('Email no es válido');
  }

  if (!validateSelection(formData.provincia as string)) {
    errors.push('Provincia es obligatoria');
  }

  if (!validateSelection(formData.canton as string)) {
    errors.push('Cantón es obligatorio');
  }

  if (!validateDireccion(formData.direccion as string)) {
    errors.push('Dirección debe tener entre 10 y 500 caracteres');
  }

  if (!validateTelefono(formData.telefonoPrincipal as string)) {
    errors.push('Teléfono principal no es válido');
  }

  if (formData.tipoCliente === 'Uniformado') {
    if (!validateSelection(formData.estadoUniformado as string)) {
      errors.push('Estado militar es obligatorio para uniformados');
    }
  }
  
  if (formData.tipoCliente === 'Compañía de Seguridad') {
    if (!validateRUC(formData.ruc as string)) {
      errors.push('RUC no es válido');
    }
    if (!validateEmail(formData.correoElectronico as string)) {
      errors.push('Correo electrónico de la empresa no es válido');
    }
    if (!validateSelection(formData.provinciaCompania as string)) {
      errors.push('Provincia de la empresa es obligatoria');
    }
    if (!validateSelection(formData.cantonCompania as string)) {
      errors.push('Cantón de la empresa es obligatorio');
    }
    if (!validateDireccion(formData.direccionFiscal as string)) {
      errors.push('Dirección fiscal debe tener entre 10 y 500 caracteres');
    }
    if (!validateTelefono(formData.telefonoReferencia as string)) {
      errors.push('Teléfono de referencia no es válido');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const cleanNumericInput = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

export const cleanAlphabeticInput = (value: string): string => {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
};

export const cleanEmailInput = (value: string): string => {
  return value.toLowerCase().trim();
};

export const VALIDATION_LIMITS = {
  CEDULA_LENGTH: 10,
  RUC_LENGTH: 13,
  TELEFONO_LENGTH: 10,
  NOMBRE_MIN_LENGTH: 2,
  NOMBRE_MAX_LENGTH: 100,
  DIRECCION_MIN_LENGTH: 10,
  DIRECCION_MAX_LENGTH: 500,
  EMAIL_MAX_LENGTH: 255,
  PRECIO_MAX_DECIMALS: 2,
  CANTIDAD_MAX: 999
} as const; 