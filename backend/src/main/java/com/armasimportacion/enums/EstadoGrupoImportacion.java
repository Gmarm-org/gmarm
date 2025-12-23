package com.armasimportacion.enums;

public enum EstadoGrupoImportacion {
    BORRADOR,
    EN_PREPARACION,
    EN_PROCESO_ASIGNACION_CLIENTES, // Estado cuando aún se pueden agregar clientes
    SOLICITAR_PROFORMA_FABRICA, // Después de definir pedido
    EN_PROCESO_OPERACIONES, // Mientras operaciones carga documentos
    NOTIFICAR_AGENTE_ADUANERO, // Estado para Finanzas/Jefe de Ventas
    EN_ESPERA_DOCUMENTOS_CLIENTE, // Esperando documentos por cliente
    COMPLETADO,
    CANCELADO,
    SUSPENDIDO
} 
