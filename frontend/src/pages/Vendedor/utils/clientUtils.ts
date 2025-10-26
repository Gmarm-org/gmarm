import type { Client } from '../types';

// Función para convertir texto a mayúsculas
export const toUpperCase = (text: string) => text.toUpperCase();

// Función para validar que solo sean números
export const validateNumbersOnly = (text: string) => text.replace(/[^0-9]/g, '');

// Función para validar cédula (10 dígitos)
export const validateCedula = (text: string) => {
  const numbersOnly = text.replace(/[^0-9]/g, '');
  return numbersOnly.slice(0, 10);
};

// Función para validar RUC (13 dígitos)
export const validateRUC = (text: string) => {
  const numbersOnly = text.replace(/[^0-9]/g, '');
  return numbersOnly.slice(0, 13);
};

// Función para validar teléfono (máximo 10 dígitos)
export const validateTelefono = (text: string) => {
  const numbersOnly = text.replace(/[^0-9]/g, '');
  return numbersOnly.slice(0, 10);
};

// Función para obtener el tipo de cliente efectivo (considerando estado de uniformado)
export const getEffectiveClientType = (tipoCliente: string, estadoUniformado: 'Activo' | 'Pasivo') => {
  if (tipoCliente === 'Uniformado' && estadoUniformado === 'Pasivo') {
    return 'Civil';
  }
  return tipoCliente;
};

// Identificar si un cliente es 'Cupo Civil'
export const isCupoCivil = (client: Client) => client.nombres.startsWith('Cupo Civil');

// Hardcoded documents/questions by tipoCliente
export const docsByTipo: Record<string, string[]> = {
  Civil: ['Cédula', 'Antecedentes Penales'],
  'Compañía de Seguridad': ['RUC', 'Permiso de funcionamiento', 'Representante legal'],
  Uniformado: ['Cédula', 'Credencial policial'],
  Deportista: ['Cédula', 'Credencial club', 'Permiso deportivo']
};

export const preguntasByTipo: Record<string, string[]> = {
  Civil: ['¿Ha tenido antecedentes?', '¿Motivo de compra?'],
  'Compañía de Seguridad': ['¿Tipo de empresa?', '¿Cantidad de armas requeridas?'],
  Uniformado: ['¿Rango?', '¿Unidad?'],
  Deportista: ['¿Disciplina?', '¿Participa en competencias?']
};

// Client type labels and order
export const clientTypeLabels: Record<string, string> = {
  Civil: 'Civiles',
  'Compañía de Seguridad': 'Compañías de seguridad',
  Uniformado: 'Uniformados',
  Deportista: 'Deportistas'
};

export const clientTypeOrder = ['Civil', 'Compañía de Seguridad', 'Uniformado', 'Deportista']; 