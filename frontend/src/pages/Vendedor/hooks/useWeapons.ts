import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import type { Weapon } from '../types';

export const useWeapons = () => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeapons = async () => {
    try {
      setLoading(true);
      const weaponsData = await apiService.getArmas();
      setWeapons(weaponsData);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar armas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeapons();
  }, []);

  return {
    weapons,
    loading,
    error,
    loadWeapons
  };
}; 