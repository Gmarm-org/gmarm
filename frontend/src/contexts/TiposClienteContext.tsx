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

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        console.log('🔄 TiposClienteProvider: Cargando configuración...');
        
        const tiposConfig = await apiService.getTiposClienteConfig();
        
        console.log('✅ TiposClienteProvider: Configuración cargada:', tiposConfig);
        console.log('✅ TiposClienteProvider: Número de tipos:', Object.keys(tiposConfig).length);
        console.log('✅ TiposClienteProvider: Tipos disponibles:', Object.keys(tiposConfig));
        
        setConfig(tiposConfig);
        setError(null);
      } catch (err: any) {
        console.error('❌ TiposClienteProvider: Error cargando configuración:', err);
        setError('Error cargando configuración');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []); // Solo se ejecuta UNA VEZ al montar el provider

  const getCodigoTipoCliente = (tipoCliente: string | undefined): string => {
    if (!tipoCliente) {
      console.error('❌ getCodigoTipoCliente: tipoCliente es undefined o vacío');
      throw new Error('Tipo de cliente no proporcionado');
    }
    
    if (!config[tipoCliente]) {
      console.error('❌ getCodigoTipoCliente: No se encontró configuración para:', tipoCliente);
      console.error('❌ Configuración disponible:', Object.keys(config));
      throw new Error(`No se encontró configuración para el tipo de cliente: ${tipoCliente}`);
    }
    
    console.log(`✅ getCodigoTipoCliente: ${tipoCliente} → ${config[tipoCliente].codigo}`);
    return config[tipoCliente].codigo;
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

