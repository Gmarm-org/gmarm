import React from 'react';
import { TableHeaderWithFilters } from '../../../components/TableHeaderWithFilters';
import { formatNombreCompleto } from '../../../utils/formatUtils';
import type { SortConfig } from '../../../hooks/useTableFilters';
import type { ClienteConVendedor } from '../types';

interface ClientesListViewProps {
  clientesFiltrados: ClienteConVendedor[];
  loadingClientes: boolean;
  sortConfig: SortConfig<ClienteConVendedor>;
  onSort: (key: keyof ClienteConVendedor) => void;
  filters: Partial<Record<keyof ClienteConVendedor, string>>;
  setFilter: (key: keyof ClienteConVendedor, value: string) => void;
  clearFilters: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onVerDetalle: (cliente: ClienteConVendedor) => void;
  onEditar: (cliente: ClienteConVendedor) => void;
  onReasignarArma: (cliente: ClienteConVendedor) => void;
  onDesistimiento: (cliente: ClienteConVendedor) => void;
}

const ClientesListView: React.FC<ClientesListViewProps> = ({
  clientesFiltrados,
  loadingClientes,
  sortConfig,
  onSort,
  filters,
  setFilter,
  clearFilters,
  onRefresh,
  onExport,
  onVerDetalle,
  onEditar,
  onReasignarArma,
  onDesistimiento,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Todos los Clientes del Sistema</h2>
          <p className="text-sm text-gray-600 mt-1">Todos los clientes creados por los vendedores</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onExport}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md flex items-center space-x-2 text-sm font-semibold"
            title="Exportar todos los clientes a Excel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar a Excel</span>
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Actualizar
          </button>
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
        </div>
      </div>

      {loadingClientes ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando clientes...</p>
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
                  column="email"
                  label="Email"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  filterValue={filters.email || ''}
                  onFilterChange={setFilter}
                />
                <TableHeaderWithFilters
                  column="estado"
                  label="Estado"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  align="center"
                  filterValue={filters.estado || ''}
                  onFilterChange={setFilter}
                />
                <TableHeaderWithFilters
                  column="estadoPago"
                  label="Estado de Pago"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  align="center"
                  filterValue={filters.estadoPago || ''}
                  onFilterChange={setFilter}
                />
                <TableHeaderWithFilters
                  column="emailVerificado"
                  label="Validado por Cliente"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  align="center"
                  filterValue={filters.emailVerificado !== undefined ? String(filters.emailVerificado) : ''}
                  onFilterChange={setFilter}
                />
                <TableHeaderWithFilters
                  column="grupoImportacionNombre"
                  label="Grupo de Importación"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  align="center"
                  filterValue={filters.grupoImportacionNombre || ''}
                  onFilterChange={setFilter}
                />
                <TableHeaderWithFilters
                  column="licenciaNombre"
                  label="Licencia"
                  sortKey={sortConfig.key}
                  sortDirection={sortConfig.direction}
                  onSort={onSort}
                  align="center"
                  filterValue={filters.licenciaNombre || ''}
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
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{cliente.numeroIdentificacion}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatNombreCompleto(cliente.nombres, cliente.apellidos)}
                    </td>
                    <td className="px-4 py-3 text-sm">{cliente.tipoClienteNombre}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-blue-600 font-bold text-xs">
                            {cliente.vendedorNombre?.charAt(0)}{cliente.vendedorApellidos?.charAt(0)}
                          </span>
                        </div>
                        <span>{formatNombreCompleto(cliente.vendedorNombre, cliente.vendedorApellidos)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{cliente.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        cliente.estado === 'LISTO_IMPORTACION' ? 'bg-green-100 text-green-800' :
                        cliente.estado === 'BLOQUEADO' ? 'bg-red-100 text-red-800' :
                        cliente.estado === 'PENDIENTE_DOCUMENTOS' ? 'bg-yellow-100 text-yellow-800' :
                        cliente.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                        cliente.estado === 'EN_CURSO_IMPORTACION' ? 'bg-purple-100 text-purple-800' :
                        cliente.estado === 'SERIE_ASIGNADA' ? 'bg-green-100 text-green-800' :
                        cliente.estado?.includes('INHABILITADO') ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cliente.estado === 'PENDIENTE_DOCUMENTOS' ? 'Faltan documentos' :
                         cliente.estado === 'LISTO_IMPORTACION' ? 'Listo para importación' :
                         cliente.estado === 'EN_CURSO_IMPORTACION' ? 'En curso de importación' :
                         cliente.estado === 'SERIE_ASIGNADA' ? 'Serie asignada' :
                         cliente.estado === 'EN_PROCESO' ? 'En proceso' :
                         cliente.estado === 'BLOQUEADO' ? 'Bloqueado' :
                         cliente.estado || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        cliente.estadoPago === 'PAGO_COMPLETO' ? 'bg-green-100 text-green-800' :
                        cliente.estadoPago === 'ABONADO' ? 'bg-yellow-100 text-yellow-800' :
                        cliente.estadoPago === 'IMPAGO' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cliente.estadoPago || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        cliente.emailVerificado === true ? 'bg-green-100 text-green-800' :
                        cliente.emailVerificado === false ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cliente.emailVerificado === true ? 'Validado' :
                         cliente.emailVerificado === false ? 'Datos incorrectos' :
                         'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {cliente.grupoImportacionNombre ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {cliente.grupoImportacionNombre}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {cliente.licenciaNombre ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {cliente.licenciaNombre}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin licencia</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {cliente.fechaCreacion ? new Date(cliente.fechaCreacion).toLocaleDateString('es-ES') : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onVerDetalle(cliente)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Ver Detalle
                        </button>
                        {['SERIE_ASIGNADA', 'CONTRATO_ENVIADO', 'CONTRATO_FIRMADO', 'PROCESO_COMPLETADO'].includes(cliente.estado || '') ? (
                          <button
                            disabled
                            className="px-3 py-1 bg-gray-400 text-white text-xs rounded-lg cursor-not-allowed opacity-60"
                            title="No se puede editar un cliente con serie asignada"
                          >
                            Editar
                          </button>
                        ) : (
                          <button
                            onClick={() => onEditar(cliente)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Editar
                          </button>
                        )}
                        <button
                          onClick={() => onReasignarArma(cliente)}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Reasignar Arma
                        </button>
                        <button
                          onClick={() => onDesistimiento(cliente)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Desistimiento
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientesListView;
