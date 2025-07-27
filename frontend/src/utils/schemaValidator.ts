import { Schemas } from '../schemas';

// ===== VALIDADOR DE JSON SCHEMAS =====

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Función simple de validación de tipos
const validateType = (value: any, expectedType: string): boolean => {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'integer':
      return Number.isInteger(value);
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
const validateArray = (value: any[], minItems?: number, maxItems?: number): boolean => {
  if (minItems !== undefined && value.length < minItems) return false;
  if (maxItems !== undefined && value.length > maxItems) return false;
  return true;
};

// Validar propiedades requeridas
const validateRequired = (data: any, required: string[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `El campo '${field}' es obligatorio`,
        value: data[field]
      });
    }
  }
  
  return errors;
};

// Validar propiedades adicionales
const validateAdditionalProperties = (data: any, additionalProperties: boolean): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!additionalProperties) {
    // Obtener todas las propiedades del schema
    const schemaProperties = Object.keys(data);
    const allowedProperties = Object.keys(data);
    
    for (const prop of schemaProperties) {
      if (!allowedProperties.includes(prop)) {
        errors.push({
          field: prop,
          message: `Propiedad '${prop}' no está permitida`,
          value: data[prop]
        });
      }
    }
  }
  
  return errors;
};

// Validar propiedades individuales
const validateProperties = (data: any, properties: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  for (const [field, value] of Object.entries(data)) {
    if (properties[field]) {
      const fieldSchema = properties[field];
      const fieldErrors = validateValue(value, fieldSchema, field);
      errors.push(...fieldErrors);
    }
  }
  
  return errors;
};

// Validar valor individual
const validateValue = (value: any, schema: any, fieldPath: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validar tipo
  if (schema.type && !validateType(value, schema.type)) {
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
    if (schema.pattern && !validatePattern(value, schema.pattern)) {
      errors.push({
        field: fieldPath,
        message: `El valor no coincide con el patrón requerido: ${schema.pattern}`,
        value
      });
    }
    
    // Validar longitud
    if (!validateStringLength(value, schema.minLength, schema.maxLength)) {
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
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        field: fieldPath,
        message: `Valor debe ser uno de: ${schema.enum.join(', ')}`,
        value
      });
    }
  }
  
  // Validar número
  if (schema.type === 'number' && typeof value === 'number') {
    if (!validateNumberRange(value, schema.minimum, schema.maximum, schema.multipleOf)) {
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
  if (schema.type === 'integer' && Number.isInteger(value)) {
    if (!validateNumberRange(value, schema.minimum, schema.maximum)) {
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
  
  // Validar array
  if (schema.type === 'array' && Array.isArray(value)) {
    if (!validateArray(value, schema.minItems, schema.maxItems)) {
      const arrayMsg = [];
      if (schema.minItems !== undefined) arrayMsg.push(`mínimo ${schema.minItems} elementos`);
      if (schema.maxItems !== undefined) arrayMsg.push(`máximo ${schema.maxItems} elementos`);
      errors.push({
        field: fieldPath,
        message: `Array inválido: ${arrayMsg.join(', ')}`,
        value
      });
    }
    
    // Validar items del array
    if (schema.items && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const itemErrors = validateValue(value[i], schema.items, `${fieldPath}[${i}]`);
        errors.push(...itemErrors);
      }
    }
  }
  
  // Validar objeto
  if (schema.type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (schema.properties) {
      const propErrors = validateProperties(value, schema.properties);
      errors.push(...propErrors);
    }
    
    if (schema.required) {
      const requiredErrors = validateRequired(value, schema.required);
      errors.push(...requiredErrors);
    }
  }
  
  return errors;
};

// Validar condiciones (allOf, anyOf, oneOf, if/then/else)
const validateConditions = (data: any, schema: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validar allOf
  if (schema.allOf) {
    for (const condition of schema.allOf) {
      const conditionErrors = validateSchema(data, condition);
      errors.push(...conditionErrors);
    }
  }
  
  // Validar if/then/else
  if (schema.if && schema.then) {
    const ifErrors = validateSchema(data, schema.if);
    if (ifErrors.length === 0) {
      // Si la condición if es válida, validar then
      const thenErrors = validateSchema(data, schema.then);
      errors.push(...thenErrors);
    } else if (schema.else) {
      // Si la condición if no es válida, validar else
      const elseErrors = validateSchema(data, schema.else);
      errors.push(...elseErrors);
    }
  }
  
  return errors;
};

// Función principal de validación
export const validateSchema = (data: any, schema: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validar propiedades requeridas
  if (schema.required) {
    const requiredErrors = validateRequired(data, schema.required);
    errors.push(...requiredErrors);
  }
  
  // Validar propiedades
  if (schema.properties) {
    const propErrors = validateProperties(data, schema.properties);
    errors.push(...propErrors);
  }
  
  // Validar propiedades adicionales
  if (schema.additionalProperties === false) {
    const additionalErrors = validateAdditionalProperties(data, schema.additionalProperties);
    errors.push(...additionalErrors);
  }
  
  // Validar condiciones
  const conditionErrors = validateConditions(data, schema);
  errors.push(...conditionErrors);
  
  return errors;
};

// Función principal para validar usando los schemas predefinidos
export const validate = (data: any, schemaName: keyof typeof Schemas): ValidationResult => {
  const schema = Schemas[schemaName];
  
  if (!schema) {
    return {
      isValid: false,
      errors: [{
        field: 'schema',
        message: `Schema '${schemaName}' no encontrado`
      }]
    };
  }
  
  const errors = validateSchema(data, schema);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Función para validar formularios específicos
export const validateClientForm = (formData: any): ValidationResult => {
  return validate(formData, 'ClientForm');
};

export const validateLoginRequest = (data: any): ValidationResult => {
  return validate(data, 'LoginRequest');
};

export const validateCreateClientRequest = (data: any): ValidationResult => {
  return validate(data, 'CreateClientRequest');
};

export const validateUpdateClientRequest = (data: any): ValidationResult => {
  return validate(data, 'UpdateClientRequest');
};

export const validateAssignWeaponRequest = (data: any): ValidationResult => {
  return validate(data, 'AssignWeaponRequest');
};

// Función para obtener mensajes de error formateados
export const getFormattedErrors = (validationResult: ValidationResult): string[] => {
  return validationResult.errors.map(error => {
    if (error.value !== undefined) {
      return `${error.field}: ${error.message} (valor: ${error.value})`;
    }
    return `${error.field}: ${error.message}`;
  });
};

// Función para validar antes de enviar al backend
export const validateBeforeSubmit = (data: any, schemaName: keyof typeof Schemas): ValidationResult => {
  const result = validate(data, schemaName);
  
  if (!result.isValid) {
    console.warn('Validación fallida antes de enviar al backend:', {
      schema: schemaName,
      data,
      errors: result.errors
    });
  }
  
  return result;
};

// Función para limpiar datos según el schema
export const cleanDataForSchema = (data: any, schemaName: keyof typeof Schemas): any => {
  const schema = Schemas[schemaName];
  
  if (!schema || !schema.properties) {
    return data;
  }
  
  const cleanedData: any = {};
  const allowedProperties = Object.keys(schema.properties);
  
  for (const prop of allowedProperties) {
    if (data[prop] !== undefined) {
      cleanedData[prop] = data[prop];
    }
  }
  
  return cleanedData;
}; 