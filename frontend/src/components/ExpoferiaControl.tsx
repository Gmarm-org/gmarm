import React from 'react';
import { useExpoferia } from '../hooks/useExpoferia';

interface ExpoferiaControlProps {
  onToggle?: (activa: boolean) => void;
}

const ExpoferiaControl: React.FC<ExpoferiaControlProps> = ({ onToggle }) => {
  const { activa, nombre, loading, error, toggleExpoferia } = useExpoferia();

  const handleToggle = async () => {
    const nuevoEstado = !activa;
    await toggleExpoferia(nuevoEstado);
    onToggle?.(nuevoEstado);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-600">Cargando estado de expoferia...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
        <span className="text-sm text-red-600">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${activa ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            {activa ? 'Expoferia Activa' : 'Expoferia Inactiva'}
          </h3>
          <p className="text-xs text-gray-500">{nombre}</p>
        </div>
      </div>
      
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activa
            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
            : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {activa ? 'Desactivar' : 'Activar'} Expoferia
      </button>
    </div>
  );
};

export default ExpoferiaControl;
