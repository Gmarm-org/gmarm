-- V7: Agregar índices para mejorar rendimiento de queries batch y paginación

-- Índice compuesto para búsqueda de grupos activos por cliente (usado en enrichDTOs batch)
CREATE INDEX IF NOT EXISTS idx_cliente_grupo_importacion_cliente_estado
    ON cliente_grupo_importacion(cliente_id, estado);

-- Índice para búsqueda de grupo por importación (usado en listados de grupos)
CREATE INDEX IF NOT EXISTS idx_cliente_grupo_importacion_grupo
    ON cliente_grupo_importacion(grupo_importacion_id);

-- Índice compuesto para armas por cliente y estado (usado en batch de armas asignadas)
CREATE INDEX IF NOT EXISTS idx_cliente_arma_cliente_estado
    ON cliente_arma(cliente_id, estado);

-- Índice para documentos por cliente y estado (usado en verificarDocumentosCompletos)
CREATE INDEX IF NOT EXISTS idx_documento_cliente_cliente_estado
    ON documento_cliente(cliente_id, estado);

-- Índice compuesto para pagos por cliente (usado en batch de estados de pago)
-- Ya existe idx_pago_cliente, pero agregamos compuesto con montos para covering index
CREATE INDEX IF NOT EXISTS idx_pago_cliente_montos
    ON pago(cliente_id, monto_pagado, monto_pendiente);

-- Índice para cuotas por estado y vencimiento (usado en cuotas vencidas)
CREATE INDEX IF NOT EXISTS idx_cuota_pago_estado_vencimiento
    ON cuota_pago(estado, fecha_vencimiento);

-- Índice para notificaciones por usuario destinatario y estado (usado en panel de notificaciones)
CREATE INDEX IF NOT EXISTS idx_notificacion_destinatario_estado
    ON notificacion(usuario_destinatario_id, estado);
