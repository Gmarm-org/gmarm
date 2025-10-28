// ========================================
// VALIDACIÓN DE EDAD PARA COMPRA DE ARMAS
// ========================================

/**
 * Calcula la edad basada en la fecha de nacimiento
 * @param fechaNacimiento - Fecha de nacimiento en formato ISO string
 * @returns Edad en años, o null si la fecha es inválida
 */
export const calcularEdad = (fechaNacimiento: string): number | null => {
  if (!fechaNacimiento) return null;
  
  const fechaNac = new Date(fechaNacimiento);
  const fechaActual = new Date();
  
  // Validar que la fecha sea válida
  if (isNaN(fechaNac.getTime())) {
    return null;
  }
  
  // Validar que no sea una fecha futura
  if (fechaNac > fechaActual) {
    return null;
  }
  
  // Validar que no sea antes de 1900
  if (fechaNac.getFullYear() < 1900) {
    return null;
  }
  
  let edad = fechaActual.getFullYear() - fechaNac.getFullYear();
  const mesActual = fechaActual.getMonth();
  const mesNac = fechaNac.getMonth();
  
  // Si no ha cumplido años este año, restar 1
  if (mesActual < mesNac || (mesActual === mesNac && fechaActual.getDate() < fechaNac.getDate())) {
    edad--;
  }
  
  return edad;
};

/**
 * Valida si el cliente tiene la edad mínima para comprar armas
 * @param fechaNacimiento - Fecha de nacimiento del cliente
 * @param edadMinima - Edad mínima requerida (por defecto 25)
 * @returns true si cumple la edad mínima, false en caso contrario
 */
export const validarEdadMinima = (fechaNacimiento: string, edadMinima: number = 25): boolean => {
  const edad = calcularEdad(fechaNacimiento);
  if (edad === null) return false;
  return edad >= edadMinima;
};

/**
 * Obtiene el mensaje de error para clientes menores de edad
 * @param fechaNacimiento - Fecha de nacimiento del cliente
 * @param edadMinima - Edad mínima requerida (por defecto 25)
 * @returns Mensaje de error o null si cumple la edad
 */
export const obtenerMensajeErrorEdad = (fechaNacimiento: string, edadMinima: number = 25): string | null => {
  const edad = calcularEdad(fechaNacimiento);
  
  if (edad === null) {
    return 'Fecha de nacimiento inválida';
  }
  
  if (!validarEdadMinima(fechaNacimiento, edadMinima)) {
    const añosFaltantes = edadMinima - edad;
    
    if (añosFaltantes === 1) {
      return `El cliente debe tener al menos ${edadMinima} años para comprar armas. Le falta 1 año.`;
    } else {
      return `El cliente debe tener al menos ${edadMinima} años para comprar armas. Le faltan ${añosFaltantes} años.`;
    }
  }
  
  return null;
};

/**
 * Valida la fecha de nacimiento (no puede ser en el futuro)
 * @param fechaNacimiento - Fecha de nacimiento a validar
 * @returns true si la fecha es válida, false en caso contrario
 */
export const validarFechaNacimiento = (fechaNacimiento: string): boolean => {
  const fechaNac = new Date(fechaNacimiento);
  const fechaActual = new Date();
  
  // La fecha de nacimiento no puede ser en el futuro
  return fechaNac <= fechaActual;
};

/**
 * Obtiene información completa de validación de edad
 * @param fechaNacimiento - Fecha de nacimiento del cliente
 * @param edadMinima - Edad mínima requerida (por defecto 25)
 * @returns Objeto con información de validación
 */
export const obtenerInfoValidacionEdad = (fechaNacimiento: string, edadMinima: number = 25) => {
  const edad = calcularEdad(fechaNacimiento);
  const cumpleEdad = validarEdadMinima(fechaNacimiento, edadMinima);
  const mensajeError = obtenerMensajeErrorEdad(fechaNacimiento, edadMinima);
  const fechaValida = validarFechaNacimiento(fechaNacimiento);
  
  return {
    edad,
    cumpleEdad,
    mensajeError,
    fechaValida,
    edadMinima
  };
}; 