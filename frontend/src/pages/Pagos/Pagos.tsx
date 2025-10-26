import React, { useState, useEffect } from 'react';
import { mockApiService } from '../../services/mockApiService';
import type { Pago } from '../../types';
import Header from '../../components/Header';

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPagos = async () => {
      try {
        const pagosData = await mockApiService.getPagos();
        setPagos(pagosData.data || []);
      } catch (error) {
        console.error('Error cargando pagos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPagos();
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Pagos" subtitle="Gestión de pagos" />
        <div className="p-6">
          <p>Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Pagos" subtitle="Gestión de pagos" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Pagos</h1>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagos.map((pago) => (
                <tr key={pago.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pago.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pago.cliente?.nombres || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${pago.montoTotal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      pago.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                      pago.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {pago.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pagos; 