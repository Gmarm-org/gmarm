import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseCrudListOptions<T> {
  fetchFn: () => Promise<T[]>;
  filterFn?: (items: T[], searchTerm: string) => T[];
}

interface UseCrudListResult<T> {
  items: T[];
  filteredItems: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  reload: () => Promise<void>;
}

/**
 * Hook genérico para listas CRUD con búsqueda y carga automática.
 *
 * Uso:
 *   const { filteredItems, searchTerm, setSearchTerm, isLoading, reload } = useCrudList({
 *     fetchFn: () => roleApi.getAll(),
 *     filterFn: (items, term) => items.filter(i => i.nombre.toLowerCase().includes(term.toLowerCase())),
 *   });
 */
export function useCrudList<T>({ fetchFn, filterFn }: UseCrudListOptions<T>): UseCrudListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchFn();
      setItems(data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim() || !filterFn) return items;
    return filterFn(items, searchTerm);
  }, [items, searchTerm, filterFn]);

  return { items, filteredItems, searchTerm, setSearchTerm, isLoading, reload };
}
