import React from 'react';

interface ReasignarArmasViewProps {
  armasReasignadas: any[];
  loadingArmasReasignadas: boolean;
  onRefresh: () => void;
  onClienteReasignado: (arma: any) => void;
}

const ReasignarArmasView: React.FC<ReasignarArmasViewProps> = ({
  armasReasignadas,
  loadingArmasReasignadas,
  onRefresh,
  onClienteReasignado,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔄 Reasignar Armas</h2>
          <p className="text-sm text-gray-600 mt-1">Armas con estado REASIGNADO esperando asignación a nuevo cliente</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {loadingArmasReasignadas ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Cargando armas reasignadas...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Arma</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Categoría</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Cliente Anterior</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Precio</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Cantidad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Número de Serie</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50 sticky right-0 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {armasReasignadas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg font-medium">
                        No hay armas reasignadas
                      </p>
                      <p className="text-gray-400 text-sm mt-2">Las armas reasignadas aparecerán aquí</p>
                    </div>
                  </td>
                </tr>
              ) : (
                armasReasignadas.map((arma) => (
                  <tr key={arma.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium">{arma.armaModelo || arma.armaNombre || 'N/A'}</div>
                        {arma.armaCalibre && (
                          <div className="text-xs text-gray-500">Calibre: {arma.armaCalibre}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{arma.armaCategoriaNombre || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium">{arma.clienteNombre || 'N/A'}</div>
                        <div className="text-xs text-gray-500">ID: {arma.clienteId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">${arma.precioUnitario?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-center text-sm">{arma.cantidad || 1}</td>
                    <td className="px-4 py-3 text-sm font-mono">{arma.numeroSerie || 'Sin serie'}</td>
                    <td className="px-4 py-3 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">
                      <button
                        onClick={() => onClienteReasignado(arma)}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Cliente Reasignado
                      </button>
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

export default ReasignarArmasView;
