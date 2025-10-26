import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import type { ArmaImagen } from '../../../types';

export interface Arma {
  id: number;
  codigo: string;
  nombre: string;
  calibre?: string;
  capacidad?: number;
  precioReferencia?: number;
  urlImagen?: string;
  urlProducto?: string;
  estado: string; // Cambiado a string para ser consistente con la base de datos
  categoriaId?: number;
  categoriaNombre?: string;
  categoriaCodigo?: string;
  // Múltiples imágenes
  imagenes?: ArmaImagen[];
  imagenPrincipal?: string;
}

export const useArmas = () => {
  const [armas, setArmas] = useState<Arma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArmas = async () => {
    try {
      setLoading(true);
      const data = await apiService.getArmas();
      setArmas(data);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar armas';
      setError(errorMessage);
      console.error('Error loading armas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArmas();
  }, []);

  return {
    armas,
    loading,
    error,
    loadArmas
  };
};
