// ===== VALIDACIONES DE IDENTIFICACIÓN =====

/**
 * Valida una cédula ecuatoriana
 * - Debe tener 10 dígitos
 * - Los primeros 2 dígitos deben representar una provincia válida (01-24)
 * - El tercer dígito debe ser menor a 6 (para personas naturales)
 * - El décimo dígito es un dígito verificador calculado con algoritmo módulo 10
 */
export const validateCedula = (cedula: string): boolean => {
  // Validar longitud
  if (!cedula || cedula.length !== 10) return false;
  
  // Verificar que todos sean números
  if (!/^\d{10}$/.test(cedula)) return false;
  
  const digits = cedula.split('').map(Number);
  
  // Validar código de provincia (primeros 2 dígitos: 01-24)
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;
  
  // Validar tercer dígito (debe ser menor a 6 para personas naturales)
  if (digits[2] >= 6) return false;
  
  // Algoritmo de validación de cédula ecuatoriana (módulo 10)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    // Los dígitos en posiciones pares (0, 2, 4, 6, 8) se multiplican por 2
    if (i % 2 === 0) {
      digit *= 2;
      // Si el resultado es mayor a 9, se resta 9
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  // Calcular dígito verificador
  const checkDigit = (10 - (sum % 10)) % 10;
  
  // Comparar con el décimo dígito
  return checkDigit === digits[9];
};

/**
 * Valida un RUC (Registro Único de Contribuyentes) ecuatoriano
 * Tipos de RUC:
 * - Persona Natural: 10 dígitos de cédula + "001" (13 dígitos total)
 * - Sociedad Privada: tercer dígito = 9, algoritmo módulo 11
 * - Sociedad Pública: tercer dígito = 6, algoritmo módulo 11
 */
export const validateRUC = (ruc: string): boolean => {
  // Validar longitud
  if (!ruc || ruc.length !== 13) return false;
  
  // Verificar que todos sean números
  if (!/^\d{13}$/.test(ruc)) return false;
  
  const digits = ruc.split('').map(Number);
  
  // Validar código de provincia (primeros 2 dígitos: 01-24)
  const provincia = parseInt(ruc.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;
  
  // Validar según el tercer dígito (tipo de contribuyente)
  const thirdDigit = digits[2];
  
  // RUC de Persona Natural (tercer dígito < 6, termina en 001)
  if (thirdDigit < 6) {
    // Validar que termine en 001
    if (ruc.substring(10) !== '001') return false;
    
    // Validar cédula (primeros 10 dígitos)
    const cedula = ruc.substring(0, 10);
    return validateCedula(cedula);
  }
  
  // RUC de Sociedad Pública (tercer dígito = 6)
  else if (thirdDigit === 6) {
    // Validar que termine en 0001
    if (ruc.substring(9) !== '0001') return false;
    
    // Algoritmo módulo 11 para sociedades públicas
    const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * coefficients[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;
    
    return checkDigit === digits[8];
  }
  
  // RUC de Sociedad Privada (tercer dígito = 9)
  else if (thirdDigit === 9) {
    // Validar que termine en 001
    if (ruc.substring(10) !== '001') return false;
    
    // Algoritmo módulo 11 para sociedades privadas
    const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * coefficients[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;
    
    return checkDigit === digits[9];
  }
  
  // Tercer dígito no válido
  return false;
};

/**
 * Valida identificación según el tipo
 * Usa algoritmos oficiales de Ecuador para cédula y RUC
 */
export const validateIdentificacion = (identificacion: string, tipo: string): boolean => {
  // Limpiar espacios
  const cleaned = identificacion?.trim() || '';
  
  switch (tipo) {
    case 'CED': // Código de Cédula (de tipo_identificacion)
      return validateCedula(cleaned);
    case 'RUC': // Código de RUC (de tipo_identificacion)
      return validateRUC(cleaned);
    case 'PAS': // Código de Pasaporte (de tipo_identificacion)
      return cleaned.length >= 6 && cleaned.length <= 20;
    default:
      return cleaned.length > 0;
  }
};

// ===== VALIDACIONES DE TELÉFONO =====

export const validateTelefono = (telefono: string): boolean => {
  if (!telefono) return false;
  
  // Remover espacios y caracteres especiales
  const cleanTelefono = telefono.replace(/[\s\-()]/g, '');
  
  // Verificar que sea solo números y tenga 10 dígitos
  return /^\d{10}$/.test(cleanTelefono);
};

export const formatTelefono = (telefono: string): string => {
  if (!telefono) return '';
  
  // Remover espacios y caracteres especiales
  const cleanTelefono = telefono.replace(/[\s\-()]/g, '');
  
  // Formatear como (XXX) XXX-XXXX
  if (cleanTelefono.length === 10) {
    return `(${cleanTelefono.substring(0, 3)}) ${cleanTelefono.substring(3, 6)}-${cleanTelefono.substring(6)}`;
  }
  
  return cleanTelefono;
};

// ===== VALIDACIONES DE EMAIL =====

export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ===== VALIDACIONES DE PRECIO =====

export const validatePrice = (price: string): boolean => {
  if (!price) return false;
  
  // Permitir números, punto y coma decimal
  const cleanPrice = price.replace(/[^0-9.,]/g, '');
  
  // Convertir coma a punto
  const normalizedPrice = cleanPrice.replace(',', '.');
  
  // Verificar que sea un número válido
  const numPrice = parseFloat(normalizedPrice);
  return !isNaN(numPrice) && numPrice >= 0;
};

export const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

export const parsePrice = (priceString: string): number => {
  if (!priceString) return 0;
  
  // Remover caracteres no numéricos excepto punto y coma
  const cleanPrice = priceString.replace(/[^0-9.,]/g, '');
  
  // Convertir coma a punto
  const normalizedPrice = cleanPrice.replace(',', '.');
  
  const numPrice = parseFloat(normalizedPrice);
  return isNaN(numPrice) ? 0 : numPrice;
};

// ===== VALIDACIONES DE CANTIDAD =====

export const validateQuantity = (quantity: string): boolean => {
  if (!quantity) return false;
  
  const numQuantity = parseInt(quantity);
  return !isNaN(numQuantity) && numQuantity > 0 && numQuantity <= 999;
};

// ===== VALIDACIONES DE DIRECCIÓN =====

export const validateDireccion = (direccion: string): boolean => {
  if (!direccion) return false;
  
  // Mínimo 10 caracteres, máximo 500
  return direccion.length >= 10 && direccion.length <= 500;
};

// ===== VALIDACIONES DE NOMBRES =====

export const validateNombre = (nombre: string): boolean => {
  if (!nombre) return false;
  
  // Solo letras, espacios y algunos caracteres especiales
  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return nombreRegex.test(nombre) && nombre.length >= 2 && nombre.length <= 100;
};

export const formatNombre = (nombre: string): string => {
  if (!nombre) return '';
  
  // Convertir a mayúsculas y limpiar espacios extra
  return nombre.toUpperCase().trim().replace(/\s+/g, ' ');
};

// ===== VALIDACIONES DE CAMPOS OBLIGATORIOS =====

export const validateRequired = (value: string): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

// ===== VALIDACIONES DE LONGITUD =====

export const validateLength = (value: string, min: number, max: number): boolean => {
  if (!value) return false;
  return value.length >= min && value.length <= max;
};

// ===== VALIDACIONES DE SELECCIÓN =====

export const validateSelection = (value: string): boolean => {
  return value !== null && value !== undefined && value !== '';
};

// ===== VALIDACIONES COMPUESTAS =====

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateClientForm = (formData: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  
  // Validar tipo de cliente
  if (!validateSelection(formData.tipoCliente as string)) {
    errors.push('Tipo de cliente es obligatorio');
  }
  
  // Validar tipo de identificación
  if (!validateSelection(formData.tipoIdentificacion as string)) {
    errors.push('Tipo de identificación es obligatorio');
  }
  
  // Validar identificación
  if (!validateIdentificacion(formData.cedula as string, formData.tipoIdentificacion as string)) {
    errors.push('Número de identificación no es válido');
  }
  
  // Validar nombres
  if (!validateNombre(formData.nombres as string)) {
    errors.push('Nombres no son válidos');
  }
  
  // Validar apellidos
  if (!validateNombre(formData.apellidos as string)) {
    errors.push('Apellidos no son válidos');
  }
  
  // Validar email
  if (!validateEmail(formData.email as string)) {
    errors.push('Email no es válido');
  }
  
  // Validar provincia
  if (!validateSelection(formData.provincia as string)) {
    errors.push('Provincia es obligatoria');
  }
  
  // Validar cantón
  if (!validateSelection(formData.canton as string)) {
    errors.push('Cantón es obligatorio');
  }
  
  // Validar dirección
  if (!validateDireccion(formData.direccion as string)) {
    errors.push('Dirección debe tener entre 10 y 500 caracteres');
  }
  
  // Validar teléfono principal
  if (!validateTelefono(formData.telefonoPrincipal as string)) {
    errors.push('Teléfono principal no es válido');
  }
  
  // Validaciones específicas por tipo de cliente
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

// ===== UTILIDADES DE LIMPIEZA =====

export const cleanNumericInput = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

export const cleanAlphabeticInput = (value: string): string => {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
};

export const cleanEmailInput = (value: string): string => {
  return value.toLowerCase().trim();
};

// ===== CONSTANTES DE VALIDACIÓN =====

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