import React, { useState } from 'react';
// import { apiService } from '../../../services/api'; // TODO: Implementar endpoint para registrar pagos

interface ModalRegistrarPagosProps {
  grupoId: number;
  clientes: Array<{
    id: number;
    clienteId: number;
    clienteNombres: string;
    clienteApellidos: string;
    clienteCedula: string;
  }>;
  onClose: () => void;
  onRefresh: () => void;
}

const ModalRegistrarPagos: React.FC<ModalRegistrarPagosProps> = ({ 
  clientes, 
  onClose, 
  onRefresh 
}) => {
  const [pagos, setPagos] = useState<Record<number, {
    monto: string;
    referencia: string;
    fechaPago: string;
  }>>({});
  const [loading, setLoading] = useState(false);

  const handleRegistrarPago = async (clienteId: number) => {
    const pago = pagos[clienteId];
    if (!pago || !pago.monto || !pago.referencia || !pago.fechaPago) {
      alert('Por favor completa todos los campos del pago');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implementar endpoint para registrar pago pendiente
      // Por ahora solo mostramos un mensaje
      alert(`Pago registrado para cliente ${clienteId}:\nMonto: ${pago.monto}\nReferencia: ${pago.referencia}\nFecha: ${pago.fechaPago}\n\nNota: Esta funcionalidad requiere implementar el endpoint en el backend.`);
      // Limpiar el pago registrado
      setPagos(prev => {
        const newPagos = { ...prev };
        delete newPagos[clienteId];
        return newPagos;
      });
      onRefresh();
    } catch (error: any) {
      console.error('Error registrando pago:', error);
      alert(error.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const updatePago = (clienteId: number, field: 'monto' | 'referencia' | 'fechaPago', value: string) => {
    setPagos(prev => ({
      ...prev,
      [clienteId]: {
        ...prev[clienteId],
        [field]: value,
      } as any,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">💰 Registrar Pagos Pendientes</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {clientes.length === 0 ? (
            <p className="text-gray-500">No hay clientes en este grupo</p>
          ) : (
            <div className="space-y-4">
              {clientes.map((cliente) => {
                const pago = pagos[cliente.clienteId] || { monto: '', referencia: '', fechaPago: '' };
                return (
                  <div
                    key={cliente.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {cliente.clienteNombres} {cliente.clienteApellidos}
                      </p>
                      <p className="text-sm text-gray-500">Cédula: {cliente.clienteCedula}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={pago.monto}
                          onChange={(e) => updatePago(cliente.clienteId, 'monto', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referencia
                        </label>
                        <input
                          type="text"
                          value={pago.referencia}
                          onChange={(e) => updatePago(cliente.clienteId, 'referencia', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Número de referencia"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Pago
                        </label>
                        <input
                          type="date"
                          value={pago.fechaPago}
                          onChange={(e) => updatePago(cliente.clienteId, 'fechaPago', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRegistrarPago(cliente.clienteId)}
                      disabled={loading || !pago.monto || !pago.referencia || !pago.fechaPago}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Registrando...' : 'Registrar Pago'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRegistrarPagos;

