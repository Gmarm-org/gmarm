import { useCallback, useEffect } from 'react';
import { apiService } from '../../../services/api';
import type { User } from '../../../types';

/**
 * Hook para cargar datos (clientes y armas)
 * Separado para cumplir con límite de 500 líneas por archivo
 */
export const useVendedorData = (
  user: User | null,
  currentPageNumber: number,
  pageSize: number,
  setClients: (clients: any[]) => void,
  setAvailableWeapons: (weapons: any[]) => void,
  setClientWeaponAssignments: (assignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>) => void,
  setClientsLoading: (loading: boolean) => void,
  setWeaponsLoading: (loading: boolean) => void,
  setTotalPages: (pages: number) => void,
  setTotalClients: (total: number) => void,
  setCurrentPageNumber: (page: number) => void,
  setProvinciasCompletas: (provincias: Array<{codigo: string, nombre: string}>) => void
) => {
  // Cargar provincias completas al inicializar
  useEffect(() => {
    const cargarProvinciasCompletas = async () => {
      try {
        const provincias = await apiService.getProvinciasCompletas();
        setProvinciasCompletas(provincias);
      } catch (error) {
        console.error('Error cargando provincias completas:', error instanceof Error ? error.message : 'Unknown error');
      }
    };
    cargarProvinciasCompletas();
  }, [setProvinciasCompletas]);

  const loadClients = useCallback(async (page: number = currentPageNumber) => {
    try {
      setClientsLoading(true);
      
      if (!user || !user.id) {
        console.error('No se puede cargar clientes sin usuario autenticado');
        setClientsLoading(false);
        return;
      }
      
      const clientsData = await apiService.getClientesPorVendedor(user.id);
      
      const totalElements = clientsData.length;
      const totalPagesCalc = Math.ceil(totalElements / pageSize);
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const clientsPaginados = clientsData.slice(startIndex, endIndex);
      
      setClients(clientsPaginados as any);
      setTotalPages(totalPagesCalc);
      setTotalClients(totalElements);
      setCurrentPageNumber(page);
      
      const weaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }> = {};
      
      for (const client of clientsPaginados) {
        try {
          const armasResponse = await apiService.getArmasCliente(client.id);
          if (armasResponse && armasResponse.length > 0) {
            const arma = armasResponse[0];
            weaponAssignments[client.id] = {
              weapon: {
                id: arma.armaId,
                modelo: arma.armaModelo || 'N/A',
                calibre: arma.armaCalibre || 'N/A',
                codigo: arma.armaCodigo,
                urlImagen: arma.armaImagen,
                precioReferencia: parseFloat(arma.precioUnitario) || 0
              },
              precio: parseFloat(arma.precioUnitario) || 0,
              cantidad: parseInt(arma.cantidad) || 1,
              numeroSerie: arma.numeroSerie,
              estado: arma.estado
            };
          }
        } catch (error) {
          // No se pudieron cargar armas para este cliente
        }
      }
      
      setClientWeaponAssignments(weaponAssignments);
    } catch (error) {
      console.error('Error al cargar clientes:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setClientsLoading(false);
    }
  }, [user, currentPageNumber, pageSize, setClients, setClientWeaponAssignments, setClientsLoading, setTotalPages, setTotalClients, setCurrentPageNumber]);

  const loadWeapons = useCallback(async () => {
    try {
      setWeaponsLoading(true);
      const armas = await apiService.getArmas();
      
      if (Array.isArray(armas)) {
        setAvailableWeapons(armas);
      } else {
        console.error('Respuesta de armas no es un array');
      }
    } catch (error) {
      console.error('Error al cargar armas:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setWeaponsLoading(false);
    }
  }, [setAvailableWeapons, setWeaponsLoading]);

  return {
    loadClients,
    loadWeapons,
  };
};

