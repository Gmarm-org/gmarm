import { useState, useCallback } from 'react';
import { validate } from '../utils/schemaValidator';
import type { ValidationResult, ValidationError } from '../utils/schemaValidator';

interface UseFormValidationOptions {
  schemaName: keyof typeof import('../schemas').Schemas;
  initialData?: Record<string, unknown>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormValidationReturn {
  data: Record<string, unknown>;
  errors: ValidationError[];
  isValid: boolean;
  setFieldValue: (field: string, value: unknown) => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  validateField: (field: string) => void;
  validateForm: () => ValidationResult;
  resetForm: (newData?: Record<string, unknown>) => void;
  getFieldError: (field: string) => string | undefined;
  hasErrors: boolean;
}

export const useFormValidation = (options: UseFormValidationOptions): UseFormValidationReturn => {
  const { schemaName, initialData = {}, validateOnChange = false } = options;
  
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);

  // Función para validar un campo específico
  const validateField = useCallback((field: string) => {
    const validation = validate(data, schemaName);
    const fieldErrors = validation.errors.filter(error => error.field === field);
    
    setErrors((prev: ValidationError[]) => {
      const otherErrors = prev.filter(error => error.field !== field);
      return [...otherErrors, ...fieldErrors];
    });
    
    setIsValid(validation.isValid);
  }, [data, schemaName]);

  // Función para validar todo el formulario
  const validateForm = useCallback((): ValidationResult => {
    const validation = validate(data, schemaName);
    setErrors(validation.errors);
    setIsValid(validation.isValid);
    return validation;
  }, [data, schemaName]);

  // Función para establecer el valor de un campo
  const setFieldValue = useCallback((field: string, value: unknown) => {
    setData((prev: Record<string, unknown>) => {
      const newData = { ...prev, [field]: value };
      
      // Validar en tiempo real si está habilitado
      if (validateOnChange) {
        setTimeout(() => validateField(field), 0);
      }
      
      return newData;
    });
  }, [validateOnChange, validateField]);

  // Función para establecer un error manual en un campo
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => {
      const otherErrors = prev.filter(e => e.field !== field);
      return [...otherErrors, { field, message: error }];
    });
    setIsValid(false);
  }, []);

  // Función para limpiar el error de un campo
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
    
    // Revalidar si no hay más errores
    if (errors.length === 1) {
      setIsValid(true);
    }
  }, [errors.length]);

  // Función para obtener el error de un campo específico
  const getFieldError = useCallback((field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  }, [errors]);

  // Función para resetear el formulario
  const resetForm = useCallback((newData?: Record<string, unknown>) => {
    setData(newData || initialData);
    setErrors([]);
    setIsValid(true);
  }, [initialData]);



  return {
    data,
    errors,
    isValid,
    setFieldValue,
    setFieldError,
    clearFieldError,
    validateField,
    validateForm,
    resetForm,
    getFieldError,
    hasErrors: errors.length > 0
  };
};

// Hook específico para formularios de cliente
export const useClientFormValidation = (initialData?: Record<string, unknown>) => {
  return useFormValidation({
    schemaName: 'ClientForm',
    initialData,
    validateOnChange: true,
    validateOnBlur: true
  });
};

// Hook específico para formularios de login
export const useLoginFormValidation = () => {
  return useFormValidation({
    schemaName: 'LoginRequest',
    validateOnChange: false,
    validateOnBlur: true
  });
};

// Hook específico para asignación de armas
export const useWeaponAssignmentValidation = () => {
  return useFormValidation({
    schemaName: 'AssignWeaponRequest',
    validateOnChange: true,
    validateOnBlur: true
  });
};

// Hook para validación en tiempo real con debounce
export const useDebouncedValidation = (
  schemaName: keyof typeof import('../schemas').Schemas,
  delay: number = 300
) => {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const debouncedValidate = useCallback((newData: Record<string, unknown>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      const validation = validate(newData, schemaName);
      setErrors(validation.errors);
      setIsValid(validation.isValid);
    }, delay);

    setTimeoutId(newTimeoutId);
  }, [schemaName, delay, timeoutId]);

  const setFieldValue = useCallback((field: string, value: unknown) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    debouncedValidate(newData);
  }, [data, debouncedValidate]);

  const validateForm = useCallback((): ValidationResult => {
    const validation = validate(data, schemaName);
    setErrors(validation.errors);
    setIsValid(validation.isValid);
    return validation;
  }, [data, schemaName]);

  const resetForm = useCallback((newData?: Record<string, unknown>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setData(newData || {});
    setErrors([]);
    setIsValid(true);
  }, [timeoutId]);

  return {
    data,
    errors,
    isValid,
    setFieldValue,
    validateForm,
    resetForm,
    hasErrors: errors.length > 0
  };
};

// Hook para validación de múltiples pasos (wizard)
export const useMultiStepValidation = (
  schemas: Array<keyof typeof import('../schemas').Schemas>
) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Record<string, unknown>[]>(schemas.map(() => ({})));
  const [stepErrors, setStepErrors] = useState<ValidationError[][]>(schemas.map(() => []));
  const [stepValid, setStepValid] = useState<boolean[]>(schemas.map(() => true));

  const validateStep = useCallback((stepIndex: number): ValidationResult => {
    const schemaName = schemas[stepIndex];
    const stepValidation = validate(stepData[stepIndex], schemaName);
    
    setStepErrors(prev => {
      const newErrors = [...prev];
      newErrors[stepIndex] = stepValidation.errors;
      return newErrors;
    });
    
    setStepValid(prev => {
      const newValid = [...prev];
      newValid[stepIndex] = stepValidation.isValid;
      return newValid;
    });
    
    return stepValidation;
  }, [schemas, stepData]);

  const setStepFieldValue = useCallback((stepIndex: number, field: string, value: unknown) => {
    setStepData(prev => {
      const newData = [...prev];
      newData[stepIndex] = { ...newData[stepIndex], [field]: value };
      return newData;
    });
  }, []);

  const nextStep = useCallback((): boolean => {
    const currentValidation = validateStep(currentStep);
    if (currentValidation.isValid && currentStep < schemas.length - 1) {
      setCurrentStep(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentStep, validateStep, schemas.length]);

  const prevStep = useCallback((): boolean => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number): boolean => {
    if (stepIndex >= 0 && stepIndex < schemas.length) {
      setCurrentStep(stepIndex);
      return true;
    }
    return false;
  }, [schemas.length]);

  const validateAllSteps = useCallback((): ValidationResult => {
    const allErrors: ValidationError[] = [];
    let allValid = true;
    
    for (let i = 0; i < schemas.length; i++) {
      const validation = validateStep(i);
      allErrors.push(...validation.errors);
      if (!validation.isValid) {
        allValid = false;
      }
    }
    
    return {
      isValid: allValid,
      errors: allErrors
    };
  }, [schemas, validateStep]);

  const getAllData = useCallback((): Record<string, unknown> => {
    return stepData.reduce((acc, data) => {
      return { ...acc, ...data };
    }, {});
  }, [stepData]);

  return {
    currentStep,
    stepData,
    stepErrors,
    stepValid,
    setStepFieldValue,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    validateAllSteps,
    getAllData,
    totalSteps: schemas.length,
    canGoNext: stepValid[currentStep],
    canGoPrev: currentStep > 0,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === schemas.length - 1
  };
}; 