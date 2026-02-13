import React from 'react';
import type { StockArma } from '../types';

interface StockViewProps {
  stockArmas: StockArma[];
  loadingStock: boolean;
  onRefresh: () => void;
}

const StockView: React.FC<StockViewProps> = ({ stockArmas, loadingStock, onRefresh }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventario de Armas en Stock</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {loadingStock ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando inventario...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Arma</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Calibre</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Disponible</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Reservadas</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Asignadas</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Precio Venta</th>
              </tr>
            </thead>
            <tbody>
              {stockArmas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No hay armas en stock
                  </td>
                </tr>
              ) : (
                stockArmas.map((stock) => {
                  const reservadas = stock.cantidadTotal - stock.cantidadDisponible;
                  const porcentajeDisponible = (stock.cantidadDisponible / stock.cantidadTotal) * 100;

                  return (
                    <tr key={stock.armaId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{stock.armaModelo || 'Sin modelo'}</td>
                      <td className="px-4 py-3 text-sm">{stock.armaCalibre}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-bold rounded-full">
                          {stock.cantidadTotal}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                          porcentajeDisponible > 50 ? 'bg-green-100 text-green-800' :
                          porcentajeDisponible > 20 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stock.cantidadDisponible}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                          {reservadas}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-full">
                          {stock.cantidadAsignada || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold">
                        ${stock.precioVenta.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {stockArmas.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={2} className="px-4 py-3 text-sm">TOTALES</td>
                  <td className="px-4 py-3 text-center text-sm">
                    {stockArmas.reduce((sum, s) => sum + s.cantidadTotal, 0)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {stockArmas.reduce((sum, s) => sum + s.cantidadDisponible, 0)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {stockArmas.reduce((sum, s) => sum + (s.cantidadTotal - s.cantidadDisponible), 0)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {stockArmas.reduce((sum, s) => sum + (s.cantidadAsignada || 0), 0)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default StockView;
