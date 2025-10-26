// ===== VALIDACIONES DE IDENTIFICACIÓN =====

export const validateCedula = (cedula: string): boolean => {
  if (!cedula || cedula.length !== 10) return false;
  
  // Validación de cédula ecuatoriana
  const digits = cedula.split('').map(Number);
  
  // Verificar que todos sean números
  if (digits.some(isNaN)) return false;
  
  // Algoritmo de validación de cédula ecuatoriana
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

export const validateRUC = (ruc: string): boolean => {
  if (!ruc || ruc.length !== 13) return false;
  
  // Verificar que todos sean números
  if (!/^\d{13}$/.test(ruc)) return false;
  
  // Validar tipo de contribuyente (tercer dígito)
  const thirdDigit = parseInt(ruc[2]);
  if (![6, 9].includes(thirdDigit)) return false;
  
  // Validar cédula/RUC base (primeros 10 dígitos)
  const base = ruc.substring(0, 10);
  if (!validateCedula(base)) return false;
  
  return true;
};

export const validateIdentificacion = (identificacion: string, tipo: string): boolean => {
  switch (tipo) {
    case 'Cédula':
      return validateCedula(identificacion);
    case 'RUC':
      return validateRUC(identificacion);
    default:
      return identificacion.length > 0;
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