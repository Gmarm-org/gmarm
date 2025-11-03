/**
 * Utilidades para formateo seguro de fechas
 * Evita mostrar "Invalid Date" o "31/12/1969" cuando las fechas son null/undefined/invalid
 */

/**
 * Valida si una fecha es válida
 */
export const isValidDate = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Formatea una fecha de forma segura
 * @param date - Fecha a formatear (Date, string, null, undefined)
 * @param fallback - Texto a mostrar si la fecha es inválida (default: 'No disponible')
 * @param locale - Locale para formateo (default: 'es-EC')
 * @returns Fecha formateada o texto de fallback
 */
export const formatDate = (
  date: Date | string | null | undefined,
  fallback: string = 'No disponible',
  locale: string = 'es-EC'
): string => {
  if (!isValidDate(date)) {
    return fallback;
  }
  
  try {
    return new Date(date!).toLocaleDateString(locale);
  } catch (error) {
    console.warn('Error formateando fecha:', error);
    return fallback;
  }
};

/**
 * Formatea una fecha con hora de forma segura
 * @param date - Fecha a formatear (Date, string, null, undefined)
 * @param fallback - Texto a mostrar si la fecha es inválida (default: 'No disponible')
 * @param locale - Locale para formateo (default: 'es-EC')
 * @returns Fecha y hora formateadas o texto de fallback
 */
export const formatDateTime = (
  date: Date | string | null | undefined,
  fallback: string = 'No disponible',
  locale: string = 'es-EC'
): string => {
  if (!isValidDate(date)) {
    return fallback;
  }
  
  try {
    return new Date(date!).toLocaleString(locale);
  } catch (error) {
    console.warn('Error formateando fecha y hora:', error);
    return fallback;
  }
};

/**
 * Formatea una fecha de forma relativa (hace 2 días, hace 1 hora, etc.)
 * @param date - Fecha a formatear
 * @param fallback - Texto a mostrar si la fecha es inválida (default: 'Nunca')
 * @returns Fecha relativa o texto de fallback
 */
export const formatRelativeDate = (
  date: Date | string | null | undefined,
  fallback: string = 'Nunca'
): string => {
  if (!isValidDate(date)) {
    return fallback;
  }
  
  try {
    const now = new Date();
    const then = new Date(date!);
    const diffMs = now.getTime() - then.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
    return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  } catch (error) {
    console.warn('Error formateando fecha relativa:', error);
    return fallback;
  }
};

