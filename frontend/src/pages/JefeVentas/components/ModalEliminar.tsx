import React from 'react';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface ModalEliminarState {
  isOpen: boolean;
  cliente: { nombres?: string; apellidos?: string } | null;
  motivo: string;
  isLoading: boolean;
}

interface ModalEliminarProps {
  state: ModalEliminarState;
  onMotivoChange: (motivo: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const ModalEliminar: React.FC<ModalEliminarProps> = ({ state, onMotivoChange, onConfirm, onClose }) => {
  if (!state.isOpen || !state.cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Eliminar Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-2">
          Cliente: <strong>{formatNombreCompleto(state.cliente.nombres, state.cliente.apellidos)}</strong>
        </p>
        <p className="text-red-600 text-sm mb-4">
          Este registro quedara como auditoría y no será visible en ninguna vista. La cédula quedará disponible para crear un nuevo cliente.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo de eliminación (opcional)
          </label>
          <textarea
            value={state.motivo}
            onChange={(e) => onMotivoChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            rows={3}
            placeholder="Ingrese el motivo de la eliminación..."
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            disabled={state.isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Eliminando...' : 'Confirmar Eliminación'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEliminar;
