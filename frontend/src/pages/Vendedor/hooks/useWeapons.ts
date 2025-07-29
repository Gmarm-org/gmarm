import { useState, useEffect } from 'react';
import { mockApiService } from '../../../services/mockApiService';
import type { Weapon } from '../types';

export const useWeapons = () => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeapons = async () => {
    try {
      setLoading(true);
      const weaponsData = await mockApiService.getWeapons();
      setWeapons(weaponsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar armas');
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