package com.armasimportacion.enums;

public enum EstadoClienteGrupo {
    PENDIENTE,      // Asignación provisional - cliente creado pero no ha confirmado datos
    CONFIRMADO,     // Cliente confirmó sus datos (email verificado) - asignación definitiva
    APROBADO,
    RECHAZADO,
    EN_PROCESO,
    COMPLETADO,
    CANCELADO
} 
