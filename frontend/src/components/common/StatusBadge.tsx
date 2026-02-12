import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'cyan' | 'orange' | 'gray';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  cyan: 'bg-cyan-100 text-cyan-800',
  orange: 'bg-orange-100 text-orange-800',
  gray: 'bg-gray-100 text-gray-800',
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Badge de estado reutilizable.
 *
 * Para estados activo/inactivo:
 *   <StatusBadge label={activo ? 'Activo' : 'Inactivo'} variant={activo ? 'success' : 'danger'} />
 *
 * Para estados de pago:
 *   <StatusBadge label="PAGO_COMPLETO" variant="success" />
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'gray', className = '' }) => {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variantStyles[variant]} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;

/**
 * Helper: devuelve el variant correcto para un boolean activo/inactivo
 */
export function estadoVariant(activo: boolean): BadgeVariant {
  return activo ? 'success' : 'danger';
}

/**
 * Helper: devuelve el variant correcto para estados de pago
 */
export function estadoPagoVariant(estado: string): BadgeVariant {
  switch (estado) {
    case 'PAGO_COMPLETO': return 'success';
    case 'ABONADO': return 'warning';
    case 'IMPAGO': return 'danger';
    default: return 'gray';
  }
}

/**
 * Helper: devuelve el variant correcto para tipos de cliente
 */
export function tipoClienteVariant(tipo: string): BadgeVariant {
  switch (tipo) {
    case 'Cupo Civil': return 'info';
    case 'Extracupo Uniformado': return 'orange';
    case 'Extracupo Empresa': return 'success';
    case 'Cupo Deportista': return 'danger';
    default: return 'gray';
  }
}

/**
 * Helper: devuelve el variant y label para categorías de armas
 */
export function categoriaArmaVariant(categoria: string): BadgeVariant {
  switch (categoria) {
    case 'PISTOLA': return 'info';
    case 'ESCOPETA': return 'success';
    case 'RIFLE': return 'purple';
    default: return 'gray';
  }
}

/**
 * Helper: devuelve el variant para estados de operaciones
 */
export function estadoOperacionVariant(estado: string): BadgeVariant {
  switch (estado) {
    case 'SOLICITAR_PROFORMA_FABRICA': return 'warning';
    case 'EN_PROCESO_OPERACIONES': return 'info';
    case 'NOTIFICAR_AGENTE_ADUANERO': return 'purple';
    case 'EN_ESPERA_DOCUMENTOS_CLIENTE': return 'orange';
    case 'COMPLETADO': return 'success';
    default: return 'gray';
  }
}

/**
 * Helper: labels legibles para estados de operaciones
 */
export function estadoOperacionLabel(estado: string): string {
  const labels: Record<string, string> = {
    'SOLICITAR_PROFORMA_FABRICA': 'Solicitar Proforma',
    'EN_PROCESO_OPERACIONES': 'En Proceso',
    'NOTIFICAR_AGENTE_ADUANERO': 'Notificar Agente',
    'EN_ESPERA_DOCUMENTOS_CLIENTE': 'Esperando Documentos',
    'COMPLETADO': 'Completado',
  };
  return labels[estado] || estado;
}
