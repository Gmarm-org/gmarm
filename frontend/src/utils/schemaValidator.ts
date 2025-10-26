import { Schemas } from '../schemas';

// ===== VALIDADOR DE JSON SCHEMAS =====

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Función simple de validación de tipos
const validateType = (value: unknown, expectedType: string): boolean => {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'integer':
      return Number.isInteger(value as number);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
};

// Validar formato de email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar formato de fecha
const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

// Validar formato de fecha-hora
const validateDateTime = (dateTime: string): boolean => {
  const dateObj = new Date(dateTime);
  return !isNaN(dateObj.getTime());
};

// Validar UUID
const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validar patrón regex
const validatePattern = (value: string, pattern: string): boolean => {
  try {
    const regex = new RegExp(pattern);
    return regex.test(value);
  } catch {
    return false;
  }
};

// Validar longitud de string
const validateStringLength = (value: string, minLength?: number, maxLength?: number): boolean => {
  if (minLength !== undefined && value.length < minLength) return false;
  if (maxLength !== undefined && value.length > maxLength) return false;
  return true;
};

// Validar rango de números
const validateNumberRange = (value: number, minimum?: number, maximum?: number, multipleOf?: number): boolean => {
  if (minimum !== undefined && value < minimum) return false;
  if (maximum !== undefined && value > maximum) return false;
  if (multipleOf !== undefined && value % multipleOf !== 0) return false;
  return true;
};

// Validar array
const validateArray = (value: unknown[], minItems?: number, maxItems?: number): boolean => {
  if (minItems !== undefined && value.length < minItems) return false;
  if (maxItems !== undefined && value.length > maxItems) return false;
  return true;
};

// Validar propiedades requeridas
const validateRequired = (data: Record<string, unknown>, required: string[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `El campo ${field} es requerido`,
        value: data[field]
      });
    }
  }
  
  return errors;
};

// Validar propiedades adicionales
const validateAdditionalProperties = (data: Record<string, unknown>, additionalProperties: boolean): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!additionalProperties) {
    // Si no se permiten propiedades adicionales, verificar que todas las propiedades estén definidas
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Aquí podrías agregar lógica para verificar si la propiedad está permitida
      }
    }
  }
  
  return errors;
};

// Validar propiedades específicas
const validateProperties = (data: Record<string, unknown>, properties: Record<string, unknown>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  for (const [field, value] of Object.entries(data)) {
    if (properties[field]) {
      const fieldErrors = validateValue(value, properties[field] as Record<string, unknown>, field);
      errors.push(...fieldErrors);
    }
  }
  
  return errors;
};

// Validar valor individual
const validateValue = (value: unknown, schema: Record<string, unknown>, fieldPath: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Si el valor es null o undefined y no es requerido, está bien
  if (value === null || value === undefined) {
    return errors;
  }
  
  // Validar tipo
  if (schema.type && !validateType(value, schema.type as string)) {
    errors.push({
      field: fieldPath,
      message: `El campo debe ser de tipo '${schema.type}'`,
      value
    });
    return errors; // Si el tipo no coincide, no continuar
  }
  
  // Validar string
  if (schema.type === 'string' && typeof value === 'string') {
    // Validar formato
    if (schema.format === 'email' && !validateEmail(value)) {
      errors.push({
        field: fieldPath,
        message: 'Formato de email inválido',
        value
      });
    }
    
    if (schema.format === 'date' && !validateDate(value)) {
      errors.push({
        field: fieldPath,
        message: 'Formato de fecha inválido (YYYY-MM-DD)',
        value
      });
    }
    
    if (schema.format === 'date-time' && !validateDateTime(value)) {
      errors.push({
        field: fieldPath,
        message: 'Formato de fecha-hora inválido',
        value
      });
    }
    
    if (schema.format === 'uuid' && !validateUUID(value)) {
      errors.push({
        field: fieldPath,
        message: 'Formato de UUID inválido',
        value
      });
    }
    
    // Validar patrón
    if (schema.pattern && !validatePattern(value, schema.pattern as string)) {
      errors.push({
        field: fieldPath,
        message: `El valor no coincide con el patrón requerido: ${schema.pattern}`,
        value
      });
    }
    
    // Validar longitud
    if (!validateStringLength(value, schema.minLength as number, schema.maxLength as number)) {
      const lengthMsg = [];
      if (schema.minLength) lengthMsg.push(`mínimo ${schema.minLength} caracteres`);
      if (schema.maxLength) lengthMsg.push(`máximo ${schema.maxLength} caracteres`);
      errors.push({
        field: fieldPath,
        message: `Longitud inválida: ${lengthMsg.join(', ')}`,
        value
      });
    }
    
    // Validar enum
    if (schema.enum && !(schema.enum as unknown[]).includes(value)) {
      errors.push({
        field: fieldPath,
        message: `Valor debe ser uno de: ${(schema.enum as unknown[]).join(', ')}`,
        value
      });
    }
  }
  
  // Validar número
  if (schema.type === 'number' && typeof value === 'number') {
    if (!validateNumberRange(value, schema.minimum as number, schema.maximum as number, schema.multipleOf as number)) {
      const rangeMsg = [];
      if (schema.minimum !== undefined) rangeMsg.push(`mínimo ${schema.minimum}`);
      if (schema.maximum !== undefined) rangeMsg.push(`máximo ${schema.maximum}`);
      if (schema.multipleOf !== undefined) rangeMsg.push(`múltiplo de ${schema.multipleOf}`);
      errors.push({
        field: fieldPath,
        message: `Rango inválido: ${rangeMsg.join(', ')}`,
        value
      });
    }
  }
  
  // Validar entero
  if (schema.type === 'integer' && Number.isInteger(value as number)) {
    if (!validateNumberRange(value as number, schema.minimum as number, schema.maximum as number)) {
      const rangeMsg = [];
      if (schema.minimum !== undefined) rangeMsg.push(`mínimo ${schema.minimum}`);
      if (schema.maximum !== undefined) rangeMsg.push(`máximo ${schema.maximum}`);
      errors.push({
        field: fieldPath,
        message: `Rango inválido: ${rangeMsg.join(', ')}`,
        value
      });
    }
  }
  
  // Validar boolean
  if (schema.type === 'boolean' && typeof value === 'boolean') {
    // No hay validaciones adicionales para boolean
  }
  
  // Validar array
  if (schema.type === 'array' && Array.isArray(value)) {
    if (!validateArray(value, schema.minItems as number, schema.maxItems as number)) {
      const arrayMsg = [];
      if (schema.minItems) arrayMsg.push(`mínimo ${schema.minItems} elementos`);
      if (schema.maxItems) arrayMsg.push(`máximo ${schema.maxItems} elementos`);
      errors.push({
        field: fieldPath,
        message: `Array inválido: ${arrayMsg.join(', ')}`,
        value
      });
    }
    
    // Validar elementos del array
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        const elementErrors = validateValue(value[i], schema.items as Record<string, unknown>, `${fieldPath}[${i}]`);
        errors.push(...elementErrors);
      }
    }
  }
  
  // Validar object
  if (schema.type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const objValue = value as Record<string, unknown>;
    
    // Validar propiedades requeridas
    if (schema.required && Array.isArray(schema.required)) {
      const requiredErrors = validateRequired(objValue, schema.required as string[]);
      errors.push(...requiredErrors);
    }
    
    // Validar propiedades específicas
    if (schema.properties) {
      const propertyErrors = validateProperties(objValue, schema.properties as Record<string, unknown>);
      errors.push(...propertyErrors);
    }
    
    // Validar propiedades adicionales
    if (schema.additionalProperties !== undefined) {
      const additionalErrors = validateAdditionalProperties(objValue, schema.additionalProperties as boolean);
      errors.push(...additionalErrors);
    }
  }
  
  return errors;
};

// Validar condiciones (if/then/else)
const validateConditions = (): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Implementar validación de condiciones si es necesario
  // Por ahora, retornar array vacío
  
  return errors;
};

// Función principal de validación de schema
export const validateSchema = (data: Record<string, unknown>, schema: Record<string, unknown>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validar propiedades requeridas
  if (schema.required && Array.isArray(schema.required)) {
    const requiredErrors = validateRequired(data, schema.required as string[]);
    errors.push(...requiredErrors);
  }
  
  // Validar propiedades específicas
  if (schema.properties) {
    const propertyErrors = validateProperties(data, schema.properties as Record<string, unknown>);
    errors.push(...propertyErrors);
  }
  
  // Validar condiciones
  const conditionErrors = validateConditions();
  errors.push(...conditionErrors);
  
  return errors;
};

// Función principal de validación
export const validate = (data: Record<string, unknown>, schemaName: keyof typeof Schemas): ValidationResult => {
  const schema = Schemas[schemaName];
  const errors = validateSchema(data, schema);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Funciones específicas de validación
export const validateClientForm = (formData: Record<string, unknown>): ValidationResult => {
  return validate(formData, 'ClientForm');
};

export const validateLoginRequest = (data: Record<string, unknown>): ValidationResult => {
  return validate(data, 'LoginRequest');
};

export const validateCreateClientRequest = (data: Record<string, unknown>): ValidationResult => {
  return validate(data, 'CreateClientRequest');
};

export const validateUpdateClientRequest = (data: Record<string, unknown>): ValidationResult => {
  return validate(data, 'UpdateClientRequest');
};

export const validateAssignWeaponRequest = (data: Record<string, unknown>): ValidationResult => {
  return validate(data, 'AssignWeaponRequest');
};

// Función para obtener errores formateados
export const getFormattedErrors = (validationResult: ValidationResult): string[] => {
  return validationResult.errors.map(error => `${error.field}: ${error.message}`);
};

// Función para validar antes de enviar
export const validateBeforeSubmit = (data: Record<string, unknown>, schemaName: keyof typeof Schemas): ValidationResult => {
  return validate(data, schemaName);
};

// Función para limpiar datos para el schema
export const cleanDataForSchema = (data: Record<string, unknown>, schemaName: keyof typeof Schemas): Record<string, unknown> => {
  const schema = Schemas[schemaName];
  const cleanedData: Record<string, unknown> = {};
  
  // Solo incluir propiedades que están en el schema
  if (schema.properties) {
    const properties = schema.properties as Record<string, unknown>;
    for (const [key, value] of Object.entries(data)) {
      if (properties[key] !== undefined) {
        cleanedData[key] = value;
      }
    }
  }
  
  return cleanedData;
}; 