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
  
  // Filtros por campo
  const [filters, setFilters] = useState<Partial<Record<keyof T, string>>>({});

  // Aplicar filtros primero, luego ordenamiento
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    // Si no hay filtros, retornar todos los datos
    const hasFilters = Object.values(filters).some(value => value && value.trim() !== '');
    if (!hasFilters) {
      return data;
    }
    
    // Aplicar filtros
    return data.filter(item => {
      return Object.entries(filters).every(([key, filterValue]) => {
        // Si el filtro está vacío, no filtrar por ese campo
        if (!filterValue || filterValue.trim() === '') {
          return true;
        }
        
        const itemValue = item[key];
        
        // Manejar valores booleanos y null (para emailVerificado)
        if (key === 'emailVerificado') {
          const filterLower = filterValue.toLowerCase().trim();
          if (filterLower === 'ok' || filterLower === 'true' || filterLower === 'validado') {
            return itemValue === true;
          }
          if (filterLower === 'error' || filterLower === 'false' || filterLower === 'datos incorrectos' || filterLower === 'datosincorrectos') {
            return itemValue === false;
          }
          if (filterLower === 'pendiente' || filterLower === 'null' || filterLower === 'undefined' || filterLower === '') {
            return itemValue == null || itemValue === undefined;
          }
          // Si no coincide con ningún patrón, no filtrar
          return true;
        }
        
        if (itemValue == null) {
          // Para valores null/undefined, permitir filtrar por "pendiente", "null", etc.
          const filterLower = filterValue.toLowerCase().trim();
          return filterLower === 'pendiente' || filterLower === 'null' || filterLower === 'undefined' || filterLower === '';
        }
        
        // Convertir a string y buscar (case-insensitive)
        const searchText = filterValue.toLowerCase().trim();
        const itemText = String(itemValue).toLowerCase();
        
        return itemText.includes(searchText);
      });
    });
  }, [data, filters]);

  // Aplicar ordenamiento a los datos filtrados
  const sortedData = useMemo(() => {
    if (!filteredData) return [];
    
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortConfig]);

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

  // Función para actualizar un filtro específico
  const setFilter = (key: keyof T, value: string) => {
    setFilters(prev => {
      if (!value || value.trim() === '') {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
  };
  
  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setFilters({});
  };

  return {
    filteredAndSortedData: sortedData,
    sortConfig,
    handleSort,
    filters,
    setFilter,
    clearFilters,
  };
}

