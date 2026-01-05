import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/api';

interface Provincia {
  codigo: string;
  nombre: string;
}

/**
 * Hook para cargar y manejar catálogos (tipos de cliente, tipos de identificación, provincias)
 * Extraído de ClientForm para mejorar mantenibilidad
 */
export const useClientCatalogs = () => {
  const [tiposCliente, setTiposCliente] = useState<any[]>([]);
  const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [availableCantons, setAvailableCantons] = useState<string[]>([]);
  const [availableCantonsEmpresa, setAvailableCantonsEmpresa] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Función helper para obtener el nombre de la provincia desde el código
  const getNombreProvincia = useCallback((codigo: string | undefined): string => {
    if (!codigo || provincias.length === 0) return codigo || 'No especificado';
    const provincia = provincias.find(p => p.codigo === codigo);
    return provincia ? provincia.nombre : codigo;
  }, [provincias]);

  // Cargar catálogos iniciales
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoading(true);
        const [tiposClienteData, tiposIdentificacionData, provinciasData] = await Promise.all([
          apiService.getClientTypes(),
          apiService.getTiposIdentificacion(),
          apiService.getProvinciasCompletas()
        ]);
        
        setTiposCliente(tiposClienteData || []);
        setTiposIdentificacion(tiposIdentificacionData || []);
        setProvincias((provinciasData as Provincia[]) || []);
      } catch (error) {
        console.error('❌ Error cargando catálogos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  // Cargar cantones cuando cambia la provincia
  const loadCantones = useCallback(async (provinciaCodigo: string | undefined, isEmpresa: boolean = false) => {
    if (!provinciaCodigo || provincias.length === 0) {
      if (isEmpresa) {
        setAvailableCantonsEmpresa([]);
      } else {
        setAvailableCantons([]);
      }
      return;
    }

    try {
      const provinciaNombre = getNombreProvincia(provinciaCodigo);
      const nombreParaBuscar = provinciaNombre === provinciaCodigo ? provinciaCodigo : provinciaNombre;
      
      const cantones = await apiService.getCantones(nombreParaBuscar);
      
      if (isEmpresa) {
        setAvailableCantonsEmpresa(cantones || []);
      } else {
        setAvailableCantons(cantones || []);
      }
    } catch (error) {
      console.error('❌ Error cargando cantones:', error);
      if (isEmpresa) {
        setAvailableCantonsEmpresa([]);
      } else {
        setAvailableCantons([]);
      }
    }
  }, [provincias, getNombreProvincia]);

  return {
    tiposCliente,
    tiposIdentificacion,
    provincias,
    availableCantons,
    availableCantonsEmpresa,
    loading,
    getNombreProvincia,
    loadCantones,
    setAvailableCantons,
    setAvailableCantonsEmpresa
  };
};
