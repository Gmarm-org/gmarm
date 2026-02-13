import React from 'react';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface ClienteOption {
  id: string | number;
  nombres?: string;
  apellidos?: string;
  numeroIdentificacion?: string;
}

interface ModalClienteReasignadoState {
  isOpen: boolean;
  arma: any | null;
  nuevoClienteId: number | null;
  isLoading: boolean;
}

interface ModalClienteReasignadoProps {
  state: ModalClienteReasignadoState;
  clientes: ClienteOption[];
  onClienteChange: (clienteId: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const ModalClienteReasignado: React.FC<ModalClienteReasignadoProps> = ({ state, clientes, onClienteChange, onConfirm, onClose }) => {
  if (!state.isOpen || !state.arma) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Asignar Arma a Nuevo Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Información del Arma</h3>
          <p className="text-sm text-gray-600"><strong>Arma:</strong> {state.arma.armaModelo || state.arma.armaNombre || 'N/A'}</p>
          {state.arma.armaCalibre && (
            <p className="text-sm text-gray-600"><strong>Calibre:</strong> {state.arma.armaCalibre}</p>
          )}
          <p className="text-sm text-gray-600"><strong>Cliente Anterior:</strong> {state.arma.clienteNombre}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Nuevo Cliente *
          </label>
          <select
            value={state.nuevoClienteId || ''}
            onChange={(e) => onClienteChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">-- Seleccione un cliente --</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {formatNombreCompleto(cliente.nombres, cliente.apellidos)} - {cliente.numeroIdentificacion}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            El cliente seleccionado debe tener todos sus documentos aprobados para poder recibir el arma.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            disabled={state.isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            disabled={state.isLoading || !state.nuevoClienteId}
          >
            {state.isLoading ? 'Procesando...' : 'Confirmar Reasignación'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalClienteReasignado;
