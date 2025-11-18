import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig<T> = {
  key: keyof T | null;
  direction: SortDirection;
};


export function useTableFilters<T extends Record<string, any>>(
  data: T[]
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: null,
  });

  // Aplicar ordenamiento (sin filtros)
  const sortedData = useMemo(() => {
    if (!data) return [];
    
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      // Manejar valores nulos/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Comparar valores
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'es', { sensitivity: 'base' });
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue && bValue && typeof (aValue as any).getTime === 'function' && typeof (bValue as any).getTime === 'function') {
        comparison = (aValue as any).getTime() - (bValue as any).getTime();
      } else {
        // Convertir a string para comparar
        comparison = String(aValue).localeCompare(String(bValue), 'es', { sensitivity: 'base' });
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Función para manejar ordenamiento
  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Si ya está ordenado por esta columna, cambiar dirección
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
      // Nueva columna, empezar con ascendente
      return { key, direction: 'asc' };
    });
  };

  return {
    filteredAndSortedData: sortedData,
    sortConfig,
    handleSort,
  };
}

