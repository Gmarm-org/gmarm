import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';

interface TipoClienteConfig {
  codigo: string;
  tipoProcesoId: number;
  requiereIssfa: boolean;
  esMilitar: boolean;
  esPolicia: boolean;
  debeTratarseComoCivilCuandoPasivo: boolean;
}

interface TiposClienteContextType {
  config: Record<string, TipoClienteConfig>;
  loading: boolean;
  error: string | null;
  retry: () => void;
  getCodigoTipoCliente: (tipoCliente: string | undefined) => string;
  requiereCodigoIssfa: (tipoCliente: string | undefined) => boolean;
  esTipoMilitar: (tipoCliente: string | undefined) => boolean;
  esTipoPolicia: (tipoCliente: string | undefined) => boolean;
  esUniformado: (tipoCliente: string | undefined) => boolean;
  debeTratarseComoCivilCuandoPasivo: (tipoCliente: string | undefined) => boolean;
}

const TiposClienteContext = createContext<TiposClienteContextType | undefined>(undefined);

export const TiposClienteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<Record<string, TipoClienteConfig>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const tiposConfig = await apiService.getTiposClienteConfig();

        setConfig(tiposConfig);
        setError(null);
        setRetryCount(0); // Reset retry count on success
      } catch (err: any) {
        console.error('TiposClienteProvider: Error cargando configuración:', err instanceof Error ? err.message : 'Unknown error');
        setError('Error cargando configuración');
        
        // Auto-retry hasta 3 veces con delay incremental
        if (retryCount < 3) {
          const delay = (retryCount + 1) * 2000; // 2s, 4s, 6s
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        } else {
          console.error('TiposClienteProvider: Máximo de reintentos alcanzado');
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [retryCount]); // Se ejecuta cuando cambia retryCount

  const retry = () => {
    setRetryCount(prev => prev + 1);
  };

  const getCodigoTipoCliente = (tipoCliente: string | undefined): string => {
    if (!tipoCliente) {
      throw new Error('Tipo de cliente no proporcionado');
    }
    
    // Si la configuración está cargada, usarla
    if (config[tipoCliente]) {
      return config[tipoCliente].codigo;
    }
    
    // Fallback: mapeo manual si la configuración aún no está cargada (basado en BD)
    const fallbackMap: Record<string, string> = {
      'Civil': 'CIV',
      'Militar Fuerza Terrestre': 'MIL',
      'Militar Fuerza Naval': 'NAV',
      'Militar Fuerza Aérea': 'AER',
      'Uniformado Policial': 'POL',
      'Compañía de Seguridad': 'EMP',
      'Deportista': 'DEP'
    };
    
    const normalizedTipo = tipoCliente.trim();
    if (fallbackMap[normalizedTipo]) {
      // Usando mapeo de respaldo (configuracion aun no cargada)
      return fallbackMap[normalizedTipo];
    }
    
    // Si no hay mapeo de respaldo y no está cargada la configuración, lanzar error
    console.error('getCodigoTipoCliente: No se encontro configuracion para tipo de cliente');
    throw new Error(`No se encontró configuración para el tipo de cliente: ${tipoCliente}. La configuración aún está cargando: ${loading}`);
  };

  const requiereCodigoIssfa = (tipoCliente: string | undefined): boolean => {
    if (!tipoCliente || !config[tipoCliente]) {
      return false;
    }
    return config[tipoCliente].requiereIssfa;
  };

  const esTipoMilitar = (tipoCliente: string | undefined): boolean => {
    if (!tipoCliente || !config[tipoCliente]) {
      return false;
    }
    return config[tipoCliente].esMilitar;
  };

  const esTipoPolicia = (tipoCliente: string | undefined): boolean => {
    if (!tipoCliente || !config[tipoCliente]) {
      return false;
    }
    return config[tipoCliente].esPolicia;
  };

  const esUniformado = (tipoCliente: string | undefined): boolean => {
    if (!tipoCliente || !config[tipoCliente]) {
      return false;
    }
    return config[tipoCliente].esMilitar || config[tipoCliente].esPolicia;
  };

  const debeTratarseComoCivilCuandoPasivo = (tipoCliente: string | undefined): boolean => {
    if (!tipoCliente || !config[tipoCliente]) {
      return false;
    }
    return config[tipoCliente].debeTratarseComoCivilCuandoPasivo;
  };

  const value: TiposClienteContextType = {
    config,
    loading,
    error,
    retry,
    getCodigoTipoCliente,
    requiereCodigoIssfa,
    esTipoMilitar,
    esTipoPolicia,
    esUniformado,
    debeTratarseComoCivilCuandoPasivo,
  };

  return (
    <TiposClienteContext.Provider value={value}>
      {children}
    </TiposClienteContext.Provider>
  );
};

export const useTiposClienteConfig = (): TiposClienteContextType => {
  const context = useContext(TiposClienteContext);
  
  if (!context) {
    throw new Error('useTiposClienteConfig debe usarse dentro de un TiposClienteProvider');
  }
  
  return context;
};

