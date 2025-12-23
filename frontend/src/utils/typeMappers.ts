/**
 * Utilidades para mapear tipos de identificación y otros códigos
 * Evita duplicación de código en múltiples componentes
 */

/**
 * Mapea un tipo de identificación descriptivo a su código
 * @param tipoIdentificacion - Tipo de identificación descriptivo (ej: "Cédula", "RUC", "Pasaporte")
 * @returns Código del tipo de identificación (CED, RUC, PAS)
 */
export const mapTipoIdentificacionToCode = (tipoIdentificacion: string | undefined): string => {
  if (!tipoIdentificacion) return 'CED'; // Por defecto Cédula
  
  switch (tipoIdentificacion) {
    case 'Cédula':
    case 'Cédula de Identidad':
    case 'CEDULA':
      return 'CED';
    case 'RUC':
      return 'RUC';
    case 'Pasaporte':
      return 'PAS';
    default:
      return 'CED'; // Por defecto Cédula
  }
};

/**
 * Obtiene la longitud máxima permitida para un número de identificación según su tipo
 * @param tipoIdentificacionCodigo - Código del tipo de identificación (CED, RUC, PAS)
 * @returns Longitud máxima permitida
 */
export const getMaxLengthIdentificacion = (tipoIdentificacionCodigo: string | undefined): number => {
  if (!tipoIdentificacionCodigo) return 10; // Por defecto Cédula
  
  switch (tipoIdentificacionCodigo) {
    case 'CED':
      return 10; // Código de Cédula
    case 'RUC':
      return 13; // Código de RUC
    case 'PAS':
      return 20; // Código de Pasaporte
    default:
      return 10; // Por defecto Cédula
  }
};

