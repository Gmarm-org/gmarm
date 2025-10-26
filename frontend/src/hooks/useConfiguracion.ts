import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export interface ConfiguracionSistema {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
  editable: boolean;
}

/**
 * Hook para obtener configuraciones del sistema desde la base de datos
 */
export const useConfiguracion = (clave: string) => {
  const [valor, setValor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfiguracion = async () => {
      try {
        setLoading(true);
        const config = await apiService.getConfiguracion(clave);
        setValor(config.valor);
        setError(null);
      } catch (err) {
        console.error(`Error cargando configuración ${clave}:`, err);
        setError(`Error cargando configuración ${clave}`);
      } finally {
        setLoading(false);
      }
    };

    loadConfiguracion();
  }, [clave]);

  return { valor, loading, error };
};

/**
 * Hook específico para obtener el IVA del sistema
 * Retorna el IVA como decimal (ej: 0.15 para 15%)
 */
export const useIVA = () => {
  const { valor, loading, error } = useConfiguracion('IVA');
  
  const ivaDecimal = valor ? parseFloat(valor) / 100 : 0.15; // Fallback a 15% si no se puede cargar
  const ivaPorcentaje = valor ? parseFloat(valor) : 15;

  return { 
    iva: ivaDecimal,           // 0.15
    ivaPorcentaje,             // 15
    loading, 
    error 
  };
};

/**
 * Hook para obtener edad mínima de compra
 */
export const useEdadMinima = () => {
  const { valor, loading, error } = useConfiguracion('EDAD_MINIMA_COMPRA');
  
  const edadMinima = valor ? parseInt(valor) : 25; // Fallback a 25 años

  return { edadMinima, loading, error };
};

