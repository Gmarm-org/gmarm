/**
 * Utilidades de formateo para la aplicación
 */

/**
 * Formatea el nombre completo como "APELLIDOS NOMBRES"
 *
 * @param nombres - Nombres del cliente
 * @param apellidos - Apellidos del cliente
 * @param uppercase - Si debe convertir a mayúsculas (default: false)
 * @returns Nombre formateado como "APELLIDOS NOMBRES"
 *
 * @example
 * ```ts
 * formatNombreCompleto('Juan Carlos', 'Pérez García')
 * // => "Pérez García Juan Carlos"
 *
 * formatNombreCompleto('Juan Carlos', 'Pérez García', true)
 * // => "PÉREZ GARCÍA JUAN CARLOS"
 * ```
 */
export function formatNombreCompleto(
  nombres: string | undefined | null,
  apellidos: string | undefined | null,
  uppercase: boolean = false
): string {
  const apellidosStr = apellidos?.trim() || '';
  const nombresStr = nombres?.trim() || '';

  if (!apellidosStr && !nombresStr) {
    return 'Sin nombre';
  }

  const nombreCompleto = apellidosStr && nombresStr
    ? `${apellidosStr} ${nombresStr}`
    : apellidosStr || nombresStr;

  return uppercase ? nombreCompleto.toUpperCase() : nombreCompleto;
}

/**
 * Formatea un monto de dinero
 *
 * @param monto - Monto a formatear
 * @param moneda - Símbolo de moneda (default: '$')
 * @param decimales - Número de decimales (default: 2)
 * @returns Monto formateado
 *
 * @example
 * ```ts
 * formatMonto(1234.56)
 * // => "$1,234.56"
 * ```
 */
export function formatMonto(
  monto: number | undefined | null,
  moneda: string = '$',
  decimales: number = 2
): string {
  if (monto === undefined || monto === null) {
    return `${moneda}0.00`;
  }

  return `${moneda}${monto.toFixed(decimales).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Formatea una fecha en formato local ecuatoriano
 *
 * @param fecha - Fecha a formatear (string, Date, o number)
 * @param opciones - Opciones de formato
 * @returns Fecha formateada
 *
 * @example
 * ```ts
 * formatFecha('2026-02-12')
 * // => "12/02/2026"
 *
 * formatFecha('2026-02-12', { formato: 'largo' })
 * // => "12 de febrero de 2026"
 * ```
 */
export function formatFecha(
  fecha: string | Date | number | undefined | null,
  opciones?: { formato?: 'corto' | 'largo' }
): string {
  if (!fecha) {
    return '-';
  }

  const fechaObj = typeof fecha === 'string' || typeof fecha === 'number'
    ? new Date(fecha)
    : fecha;

  if (isNaN(fechaObj.getTime())) {
    return '-';
  }

  if (opciones?.formato === 'largo') {
    return fechaObj.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  return fechaObj.toLocaleDateString('es-EC');
}

/**
 * Formatea un número de cédula o RUC
 *
 * @param numero - Número a formatear
 * @returns Número formateado con guiones
 *
 * @example
 * ```ts
 * formatCedula('1234567890')
 * // => "123-456-7890"
 * ```
 */
export function formatCedula(numero: string | undefined | null): string {
  if (!numero) {
    return '-';
  }

  const limpio = numero.replace(/\D/g, '');

  if (limpio.length === 10) {
    // Cédula: 123-456-7890
    return `${limpio.slice(0, 3)}-${limpio.slice(3, 6)}-${limpio.slice(6)}`;
  } else if (limpio.length === 13) {
    // RUC: 1234567890-001
    return `${limpio.slice(0, 10)}-${limpio.slice(10)}`;
  }

  return numero;
}

/**
 * Formatea un número de teléfono ecuatoriano
 *
 * @param telefono - Número de teléfono
 * @returns Teléfono formateado
 *
 * @example
 * ```ts
 * formatTelefono('0987654321')
 * // => "098-765-4321"
 * ```
 */
export function formatTelefono(telefono: string | undefined | null): string {
  if (!telefono) {
    return '-';
  }

  const limpio = telefono.replace(/\D/g, '');

  if (limpio.length === 10) {
    // Formato: 098-765-4321
    return `${limpio.slice(0, 3)}-${limpio.slice(3, 6)}-${limpio.slice(6)}`;
  }

  return telefono;
}
