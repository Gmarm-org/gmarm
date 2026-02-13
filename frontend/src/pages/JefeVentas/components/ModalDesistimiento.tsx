import React from 'react';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface ModalDesistimientoState {
  isOpen: boolean;
  cliente: { nombres?: string; apellidos?: string } | null;
  observacion: string;
  isLoading: boolean;
}

interface ModalDesistimientoProps {
  state: ModalDesistimientoState;
  onObservacionChange: (observacion: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const ModalDesistimiento: React.FC<ModalDesistimientoProps> = ({ state, onObservacionChange, onConfirm, onClose }) => {
  if (!state.isOpen || !state.cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Cambiar Estado a DESISTIMIENTO</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Cliente: {formatNombreCompleto(state.cliente.nombres, state.cliente.apellidos)}
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observación (opcional)
          </label>
          <textarea
            value={state.observacion}
            onChange={(e) => onObservacionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={4}
            placeholder="Ingrese la observación del desistimiento..."
          />
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Procesando...' : 'Confirmar Desistimiento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDesistimiento;
