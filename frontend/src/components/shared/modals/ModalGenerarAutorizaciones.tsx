import React, { useState } from 'react';
import { apiService } from '../../../services/api';

interface ModalGenerarAutorizacionesProps {
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

const ModalGenerarAutorizaciones: React.FC<ModalGenerarAutorizacionesProps> = ({ 
  clientes, 
  onClose, 
  onRefresh 
}) => {
  const [numeroFactura, setNumeroFactura] = useState('');
  const [tramite, setTramite] = useState('');
  const [generando, setGenerando] = useState<number | null>(null);

  const handleGenerarAutorizacion = async (clienteId: number) => {
    if (!numeroFactura.trim()) {
      alert('Por favor ingresa el número de factura');
      return;
    }
    
    if (!tramite.trim()) {
      alert('Por favor ingresa el trámite');
      return;
    }

    try {
      setGenerando(clienteId);
      await apiService.generarAutorizacion(
        clienteId.toString(),
        numeroFactura.trim(),
        tramite.trim()
      );
      alert('Autorización generada exitosamente');
      onRefresh();
    } catch (error: any) {
      console.error('Error generando autorización:', error);
      alert(error.message || 'Error al generar la autorización');
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📋 Generar Autorizaciones de Venta</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Campos comunes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Factura
              </label>
              <input
                type="text"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: FAC-2024-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trámite
              </label>
              <input
                type="text"
                value={tramite}
                onChange={(e) => setTramite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: TRAM-2024-001"
              />
            </div>
          </div>

          {/* Lista de clientes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Clientes del Grupo</h3>
            {clientes.length === 0 ? (
              <p className="text-gray-500">No hay clientes en este grupo</p>
            ) : (
              <div className="space-y-3">
                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {cliente.clienteNombres} {cliente.clienteApellidos}
                      </p>
                      <p className="text-sm text-gray-500">Cédula: {cliente.clienteCedula}</p>
                    </div>
                    <button
                      onClick={() => handleGenerarAutorizacion(cliente.clienteId)}
                      disabled={!numeroFactura.trim() || !tramite.trim() || generando === cliente.clienteId}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {generando === cliente.clienteId ? 'Generando...' : 'Generar Autorización'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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

export default ModalGenerarAutorizaciones;

