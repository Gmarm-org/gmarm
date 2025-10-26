// ========================================
// VALIDACIÓN DE EDAD PARA COMPRA DE ARMAS
// ========================================

/**
 * Calcula la edad basada en la fecha de nacimiento
 * @param fechaNacimiento - Fecha de nacimiento en formato ISO string
 * @returns Edad en años
 */
export const calcularEdad = (fechaNacimiento: string): number => {
  const fechaNac = new Date(fechaNacimiento);
  const fechaActual = new Date();
  
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
  return edad >= edadMinima;
};

/**
 * Obtiene el mensaje de error para clientes menores de edad
 * @param fechaNacimiento - Fecha de nacimiento del cliente
 * @param edadMinima - Edad mínima requerida (por defecto 25)
 * @returns Mensaje de error o null si cumple la edad
 */
export const obtenerMensajeErrorEdad = (fechaNacimiento: string, edadMinima: number = 25): string | null => {
  if (!validarEdadMinima(fechaNacimiento, edadMinima)) {
    const edad = calcularEdad(fechaNacimiento);
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