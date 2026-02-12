import React from 'react';

interface EmptyStateProps {
  message?: string;
  searchTerm?: string;
  onClearFilters?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  searchTerm,
  onClearFilters,
}) => {
  const defaultMessage = searchTerm
    ? 'No se encontraron resultados con los filtros aplicados'
    : 'No hay datos registrados';

  return (
    <div className="text-center py-12">
      <div className="text-gray-500 text-lg">{message || defaultMessage}</div>
      {searchTerm && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
};

export default EmptyState;
