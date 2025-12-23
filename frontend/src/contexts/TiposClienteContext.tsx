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
        console.log('🔄 TiposClienteProvider: Cargando configuración... (intento ' + (retryCount + 1) + ')');
        
        const tiposConfig = await apiService.getTiposClienteConfig();
        
        console.log('✅ TiposClienteProvider: Configuración cargada:', tiposConfig);
        console.log('✅ TiposClienteProvider: Número de tipos:', Object.keys(tiposConfig).length);
        console.log('✅ TiposClienteProvider: Tipos disponibles:', Object.keys(tiposConfig));
        
        setConfig(tiposConfig);
        setError(null);
        setRetryCount(0); // Reset retry count on success
      } catch (err: any) {
        console.error('❌ TiposClienteProvider: Error cargando configuración:', err);
        setError('Error cargando configuración');
        
        // Auto-retry hasta 3 veces con delay incremental
        if (retryCount < 3) {
          const delay = (retryCount + 1) * 2000; // 2s, 4s, 6s
          console.log(`⏰ TiposClienteProvider: Reintentando en ${delay/1000} segundos...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        } else {
          console.error('❌ TiposClienteProvider: Máximo de reintentos alcanzado');
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [retryCount]); // Se ejecuta cuando cambia retryCount

  const retry = () => {
    console.log('🔄 TiposClienteProvider: Reintento manual solicitado');
    setRetryCount(prev => prev + 1);
  };

  const getCodigoTipoCliente = (tipoCliente: string | undefined): string => {
    if (!tipoCliente) {
      console.error('❌ getCodigoTipoCliente: tipoCliente es undefined o vacío');
      throw new Error('Tipo de cliente no proporcionado');
    }
    
    // Si la configuración está cargada, usarla
    if (config[tipoCliente]) {
      console.log(`✅ getCodigoTipoCliente: ${tipoCliente} → ${config[tipoCliente].codigo}`);
      return config[tipoCliente].codigo;
    }
    
    // Fallback: mapeo manual si la configuración aún no está cargada (basado en BD)
    const fallbackMap: Record<string, string> = {
      'Civil': 'CIV',
      'Militar Fuerza Terrestre': 'MIL',
      'Militar Fuerza Naval': 'NAV',
      'Militar Fuerza Aérea': 'AER',
      'Militar Expoferia': 'EXP',
      'Uniformado Policial': 'POL',
      'Compañía de Seguridad': 'EMP',
      'Deportista': 'DEP'
    };
    
    const normalizedTipo = tipoCliente.trim();
    if (fallbackMap[normalizedTipo]) {
      console.warn(`⚠️ getCodigoTipoCliente: Usando mapeo de respaldo para "${tipoCliente}" → ${fallbackMap[normalizedTipo]} (configuración aún no cargada)`);
      return fallbackMap[normalizedTipo];
    }
    
    // Si no hay mapeo de respaldo y no está cargada la configuración, lanzar error
    console.error('❌ getCodigoTipoCliente: No se encontró configuración para:', tipoCliente);
    console.error('❌ Configuración disponible:', Object.keys(config));
    console.error('❌ Loading:', loading);
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

