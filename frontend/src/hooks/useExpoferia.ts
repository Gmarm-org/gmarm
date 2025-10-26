import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface ExpoferiaState {
  activa: boolean;
  nombre: string;
  loading: boolean;
  error: string | null;
}

export const useExpoferia = () => {
  const [state, setState] = useState<ExpoferiaState>({
    activa: false,
    nombre: 'EXPOFERIA_2025',
    loading: true,
    error: null
  });

  const fetchExpoferiaState = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const activa = await apiService.getExpoferiaEstado();
      const nombre = await apiService.getExpoferiaNombre();
      
      setState({
        activa,
        nombre,
        loading: false,
        error: null
      });
      
      console.log('🎯 Estado de expoferia cargado:', { activa, nombre });
    } catch (error) {
      console.error('❌ Error cargando estado de expoferia:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error cargando estado de expoferia'
      }));
    }
  };

  const toggleExpoferia = async (activa: boolean) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await apiService.setExpoferiaActiva(activa);
      
      setState(prev => ({
        ...prev,
        activa,
        loading: false,
        error: null
      }));
      
      console.log('✅ Expoferia', activa ? 'activada' : 'desactivada');
    } catch (error) {
      console.error('❌ Error cambiando estado de expoferia:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error cambiando estado de expoferia'
      }));
    }
  };

  useEffect(() => {
    fetchExpoferiaState();
  }, []);

  return {
    ...state,
    toggleExpoferia,
    refetch: fetchExpoferiaState
  };
};
