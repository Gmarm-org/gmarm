import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string | ReactNode;
  render: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface ActionButton<T> {
  label: string | ReactNode;
  onClick: (item: T) => void;
  className?: string;
  show?: (item: T) => boolean; // Condición para mostrar el botón
}

interface StickyTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: ActionButton<T>[];
  getRowKey: (item: T) => string | number;
  emptyMessage?: string;
  className?: string;
}

/**
 * Componente de tabla reutilizable con columna de acciones sticky
 *
 * Características:
 * - Columna de acciones siempre visible (sticky a la derecha)
 * - Responsive con scroll horizontal
 * - Configuración flexible de columnas y acciones
 * - Estilos consistentes en toda la aplicación
 *
 * @example
 * ```tsx
 * <StickyTable
 *   data={clientes}
 *   columns={[
 *     { key: 'nombre', header: 'Nombre', render: (c) => c.nombre },
 *     { key: 'email', header: 'Email', render: (c) => c.email }
 *   ]}
 *   actions={[
 *     { label: 'Editar', onClick: (c) => handleEdit(c) },
 *     { label: 'Eliminar', onClick: (c) => handleDelete(c), show: (c) => c.estado === 'activo' }
 *   ]}
 *   getRowKey={(c) => c.id}
 * />
 * ```
 */
export function StickyTable<T>({
  data,
  columns,
  actions = [],
  getRowKey,
  emptyMessage = 'No hay datos para mostrar',
  className = ''
}: StickyTableProps<T>) {

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {/* Header */}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}

            {/* Columna de Acciones - Sticky a la derecha */}
            {actions.length > 0 && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">
                Acciones
              </th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={getRowKey(item)} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm ${column.className || ''}`}
                  >
                    {column.render(item)}
                  </td>
                ))}

                {/* Columna de Acciones - Sticky */}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">
                    <div className="flex flex-col gap-1">
                      {actions.map((action, index) => {
                        // Si tiene condición show, verificarla
                        if (action.show && !action.show(item)) {
                          return null;
                        }

                        return (
                          <button
                            key={index}
                            onClick={() => action.onClick(item)}
                            className={`text-left font-medium transition-colors ${
                              action.className || 'text-blue-600 hover:text-blue-900'
                            }`}
                          >
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
