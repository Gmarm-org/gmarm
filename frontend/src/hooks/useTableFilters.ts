import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig<T> = {
  key: keyof T | null;
  direction: SortDirection;
};

/**
 * Mapeo de columna → campos adicionales donde buscar.
 * Cuando se filtra por una columna, se concatenan los textos de todos los campos
 * listados y se busca en el resultado combinado.
 *
 * Ejemplo: { nombres: ['nombres', 'apellidos'] }
 * → filtrar por "nombres" busca en "nombres + apellidos" concatenados
 */
export type SearchFields<T> = Partial<Record<keyof T, (keyof T)[]>>;

/**
 * Extrae texto buscable de cualquier tipo de valor.
 */
function getSearchableText(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'validado true sí' : 'datos incorrectos false no';
  if (Array.isArray(value)) return '';
  if (typeof value === 'object') {
    return Object.values(value)
      .filter(v => typeof v === 'string' || typeof v === 'number')
      .map(String)
      .join(' ');
  }
  return String(value);
}


export function useTableFilters<T extends Record<string, any>>(
  data: T[],
  searchFields?: SearchFields<T>
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

        const searchText = filterValue.toLowerCase().trim();

        // Si hay searchFields configurado para esta columna, buscar en todos los campos listados
        const fieldsToSearch = searchFields?.[key as keyof T];
        if (fieldsToSearch && fieldsToSearch.length > 0) {
          const combinedText = fieldsToSearch
            .map(field => getSearchableText(item[field as string]))
            .join(' ')
            .toLowerCase();
          return combinedText.includes(searchText);
        }

        const itemValue = item[key];

        // Manejar valores booleanos (emailVerificado y otros campos boolean)
        if (key === 'emailVerificado' || typeof itemValue === 'boolean') {
          if (searchText === 'ok' || searchText === 'true' || searchText === 'validado' || searchText === 'sí' || searchText === 'si') {
            return itemValue === true;
          }
          if (searchText === 'error' || searchText === 'false' || searchText === 'datos incorrectos' || searchText === 'datosincorrectos' || searchText === 'no') {
            return itemValue === false;
          }
          if (searchText === 'pendiente' || searchText === 'null' || searchText === 'undefined') {
            return itemValue == null;
          }
          if (itemValue == null) return 'pendiente'.includes(searchText);
          const boolText = getSearchableText(itemValue).toLowerCase();
          return boolText.includes(searchText);
        }

        // Manejar null/undefined
        if (itemValue == null) {
          return 'n/a sin asignar pendiente'.includes(searchText);
        }

        // Obtener texto buscable y comparar (case-insensitive)
        const itemText = getSearchableText(itemValue).toLowerCase();

        if (!itemText) return false;

        return itemText.includes(searchText);
      });
    });
  }, [data, filters, searchFields]);

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
        comparison = String(aValue).localeCompare(String(bValue), 'es', { sensitivity: 'base' });
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Función para manejar ordenamiento
  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
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
