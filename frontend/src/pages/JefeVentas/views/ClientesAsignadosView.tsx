import React from 'react';
import { TableHeaderWithFilters } from '../../../components/TableHeaderWithFilters';
import { formatNombreCompleto } from '../../../utils/formatUtils';
import type { SortConfig } from '../../../hooks/useTableFilters';
import type { ClienteConVendedor } from '../types';

interface WeaponAssignment {
  weapon: any;
  precio: number;
  cantidad: number;
  numeroSerie?: string;
  estado?: string;
}

interface ClientesAsignadosViewProps {
  clientesAsignadosFiltrados: ClienteConVendedor[];
  loadingClientes: boolean;
  sortConfig: SortConfig<ClienteConVendedor>;
  onSort: (key: keyof ClienteConVendedor) => void;
  filters: Partial<Record<keyof ClienteConVendedor, string>>;
  setFilter: (key: keyof ClienteConVendedor, value: string) => void;
  clearFilters: () => void;
  clientWeaponAssignments: Record<string, WeaponAssignment>;
  autorizaciones: Record<string, any[]>;
  onRefresh: () => void;
  onVerDetalle: (cliente: ClienteConVendedor) => void;
  onGenerarAutorizacion: (cliente: ClienteConVendedor) => void;
}

const ClientesAsignadosView: React.FC<ClientesAsignadosViewProps> = ({
  clientesAsignadosFiltrados,
  loadingClientes,
  sortConfig,
  onSort,
  filters,
  setFilter,
  clearFilters,
  clientWeaponAssignments,
  autorizaciones,
  onRefresh,
  onVerDetalle,
  onGenerarAutorizacion,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">✅ Clientes con Armas Asignadas</h2>
          <p className="text-sm text-gray-600 mt-1">Supervisión de clientes con número de serie asignado</p>
        </div>
        <div className="flex items-center space-x-3">
          {Object.keys(filters).length > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
              title="Limpiar filtros"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-xs">Limpiar filtros</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {loadingClientes ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Cargando clientes asignados...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <TableHeaderWithFilters
                  column="numeroIdentificacion"
                  label="CI/RUC"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  filterValue={filters.numeroIdentificacion || ''}
                  onFilterChange={setFilter}
                />
                <TableHeaderWithFilters
                  column="nombres"
                  label="Cliente"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  filterValue={filters.nombres || ''}
                  onFilterChange={setFilter}
                />
                <TableHeaderWithFilters
                  column="tipoClienteNombre"
                  label="Tipo"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  filterValue={filters.tipoClienteNombre || ''}
                  onFilterChange={setFilter}
                />
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Arma Asignada</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Serie</th>
                <TableHeaderWithFilters
                  column="vendedorNombre"
                  label="Vendedor"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  filterValue={filters.vendedorNombre || ''}
                  onFilterChange={setFilter}
                />
                <TableHeaderWithFilters
                  column="fechaCreacion"
                  label="Fecha"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  align="center"
                  filterValue={filters.fechaCreacion || ''}
                  onFilterChange={setFilter}
                />
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50 sticky right-0 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesAsignadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg font-medium">
                        No hay clientes con armas asignadas
                      </p>
                      <p className="text-gray-400 text-sm mt-2">Los clientes aparecerán aquí cuando se les asigne un número de serie</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clientesAsignadosFiltrados.map((cliente) => {
                  const weaponAssignment = clientWeaponAssignments[cliente.id];
                  return (
                    <tr key={cliente.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{cliente.numeroIdentificacion}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatNombreCompleto(cliente.nombres, cliente.apellidos)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (cliente.tipoClienteNombre || cliente.tipoProcesoNombre) === 'Cupo Civil' ? 'bg-blue-100 text-blue-800' :
                          (cliente.tipoClienteNombre || cliente.tipoProcesoNombre) === 'Extracupo Uniformado' ? 'bg-orange-100 text-orange-800' :
                          (cliente.tipoClienteNombre || cliente.tipoProcesoNombre) === 'Extracupo Empresa' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cliente.tipoClienteNombre || cliente.tipoProcesoNombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {weaponAssignment ? (
                          <div>
                            <div className="font-medium">{weaponAssignment.weapon.modelo || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{weaponAssignment.weapon.calibre}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {weaponAssignment?.numeroSerie ? (
                          <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                            {weaponAssignment.numeroSerie}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-green-600 font-bold text-xs">
                              {cliente.vendedorNombre?.charAt(0)}{cliente.vendedorApellidos?.charAt(0)}
                            </span>
                          </div>
                          <span>{formatNombreCompleto(cliente.vendedorNombre, cliente.vendedorApellidos)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {cliente.fechaCreacion ? new Date(cliente.fechaCreacion).toLocaleDateString('es-EC') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">
                        <div className="flex flex-col gap-2 items-center">
                          <button
                            onClick={() => onVerDetalle(cliente)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Ver Detalle</span>
                          </button>

                          {(() => {
                            const tieneAutorizacion = autorizaciones[cliente.id] && autorizaciones[cliente.id].length > 0;
                            return tieneAutorizacion;
                          })() ? (
                            <>
                              <button
                                onClick={() => {
                                  const autorizacion = autorizaciones[cliente.id][0];
                                  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                                  window.open(`${baseUrl}/api/documentos/serve-generated/${autorizacion.id}`, '_blank');
                                }}
                                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center justify-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Ver Autorización</span>
                              </button>

                              <button
                                onClick={() => onGenerarAutorizacion(cliente)}
                                className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center justify-center space-x-2"
                                title="Regenerar autorización (sobrescribirá la actual)"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Generar Nuevamente</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onGenerarAutorizacion(cliente)}
                              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Generar Autorización</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientesAsignadosView;
