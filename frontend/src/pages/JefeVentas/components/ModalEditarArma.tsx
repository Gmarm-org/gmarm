import React from 'react';

interface ModalEditarArmaState {
  isOpen: boolean;
  clienteArma: any | null;
  armasDisponibles: any[];
  armaSeleccionada: any | null;
  nuevoPrecio: string;
  isLoading: boolean;
}

interface ModalEditarArmaProps {
  state: ModalEditarArmaState;
  onArmaChange: (arma: any | undefined, nuevoPrecio: string) => void;
  onPrecioChange: (precio: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const ModalEditarArma: React.FC<ModalEditarArmaProps> = ({ state, onArmaChange, onPrecioChange, onConfirm, onClose }) => {
  if (!state.isOpen || !state.clienteArma) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Editar Arma Asignada</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Arma Actual</p>
          <p className="font-semibold text-blue-600">{state.clienteArma.armaModelo || state.clienteArma.armaNombre || 'N/A'}</p>
          <p className="text-sm text-gray-600 mt-2">Precio Actual</p>
          <p className="font-medium">${state.clienteArma.precioUnitario?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Nueva Arma *
          </label>
          <select
            value={state.armaSeleccionada?.id || ''}
            onChange={(e) => {
              const armaSeleccionada = state.armasDisponibles.find(
                a => a.id.toString() === e.target.value
              );
              onArmaChange(armaSeleccionada, armaSeleccionada?.precioReferencia?.toString() || '');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona una arma...</option>
            {state.armasDisponibles.map((arma: any) => (
              <option key={arma.id} value={arma.id}>
                {arma.modelo || 'N/A'} - ${arma.precioReferencia?.toFixed(2) || '0.00'}
              </option>
            ))}
          </select>
        </div>

        {state.armaSeleccionada && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Precio Unitario (USD) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={state.nuevoPrecio}
              onChange={(e) => onPrecioChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Precio de referencia: ${state.armaSeleccionada.precioReferencia?.toFixed(2) || '0.00'}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            disabled={state.isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={state.isLoading || !state.armaSeleccionada}
          >
            {state.isLoading ? 'Procesando...' : 'Confirmar Cambio'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarArma;
