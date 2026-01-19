# Feature 16 Enero

## Cambios completados

- Arma sin cliente se asigna a grupo de tipo CUPO (flujo civil).
- Email de verificación con un solo botón: "Validar o corregir datos personales".
- Copia al vendedor al generar documentos/solicitud de compra (adjunta PDF).
- Recibo con formato `RC-{INICIALES_LICENCIA}-{AÑO}-000100` (secuencia desde 100).
- Iniciales de importador calculadas desde el nombre de la licencia (API: `GET /api/licencia/{id}/iniciales`).
- Corrección de descarga/generación de recibo cuando no se encuentra el archivo exacto.
- Armas: agregado campo `color` en backend, frontend y SQL maestro.

## Pendientes de la lista original

- Error/demora en generación de contrato (validar plantilla/cuerpo).
- Error al definir grupo con clientes ya cargados (Jefe de Ventas).
- Control de importaciones (cuadro de checks) en Finanzas y Jefe de Ventas.
