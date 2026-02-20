import { useEffect } from 'react';
import { apiService } from '../../../services/api';
import type { useJefeVentasState } from './useJefeVentasState';

type State = ReturnType<typeof useJefeVentasState>;

export function useJefeVentasData(state: State) {
  const {
    vistaActual,
    setStockArmas, setLoadingStock,
    setClientes, setLoadingClientes,
    setClientesAsignados, setClientWeaponAssignments, setAutorizaciones,
    setArmasReasignadas, setLoadingArmasReasignadas,
  } = state;

  const cargarStockArmas = async () => {
    setLoadingStock(true);
    try {
      const response = await apiService.getStockTodasArmas();
      setStockArmas(response);
    } catch (error) {
      console.error('Error cargando stock:', error);
      alert(`Error cargando el inventario de armas: ${error}`);
    } finally {
      setLoadingStock(false);
    }
  };

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      const response = await apiService.getTodosClientes();

      // Obtener armas de TODOS los clientes en paralelo
      const armasResults = await Promise.all(
        response.map(async (cliente) => {
          try {
            const armasResponse = await apiService.getArmasCliente(cliente.id);
            const tieneArmaAsignada = armasResponse && armasResponse.length > 0 &&
                                       armasResponse.some((arma: any) => arma.estado === 'ASIGNADA');
            return { cliente, tieneArmaAsignada };
          } catch {
            return { cliente, tieneArmaAsignada: false };
          }
        })
      );

      const clientesSinArmaAsignada = armasResults
        .filter(({ tieneArmaAsignada }) => !tieneArmaAsignada)
        .map(({ cliente }) => cliente);

      setClientes(clientesSinArmaAsignada);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      alert(`Error cargando la lista de clientes: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

  const cargarClientesAsignados = async () => {
    setLoadingClientes(true);
    try {
      const response = await apiService.getTodosClientes();

      // Paso 1: Obtener armas de TODOS los clientes en paralelo
      const armasResults = await Promise.all(
        response.map(async (client) => {
          try {
            const armasResponse = await apiService.getArmasCliente(client.id);
            return { client, armas: armasResponse || [] };
          } catch {
            return { client, armas: [] };
          }
        })
      );

      // Paso 2: Procesar resultados y encontrar clientes con arma ASIGNADA
      const weaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }> = {};
      const clientesConArmaAsignada: any[] = [];

      for (const { client, armas } of armasResults) {
        if (armas.length > 0) {
          const arma = armas[0];
          const armaModelo = arma.armaModelo || arma.armaNombre || 'N/A';
          weaponAssignments[client.id] = {
            weapon: {
              id: arma.armaId,
              nombre: armaModelo,
              modelo: armaModelo,
              marca: arma.armaMarca,
              alimentadora: arma.armaAlimentadora,
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
          if (arma.estado === 'ASIGNADA') {
            clientesConArmaAsignada.push(client);
          }
        }
      }

      // Paso 3: Obtener autorizaciones de clientes ASIGNADOS en paralelo
      const autorizacionesResults = await Promise.all(
        clientesConArmaAsignada.map(async (client) => {
          try {
            const autorizacionesResponse = await apiService.getAutorizacionesPorCliente(parseInt(client.id));
            return { clientId: client.id, autorizaciones: autorizacionesResponse || [] };
          } catch {
            return { clientId: client.id, autorizaciones: [] };
          }
        })
      );

      const autorizacionesTemp: Record<string, any[]> = {};
      for (const { clientId, autorizaciones: auths } of autorizacionesResults) {
        autorizacionesTemp[clientId] = auths;
      }

      setClientesAsignados(clientesConArmaAsignada);
      setClientWeaponAssignments(weaponAssignments);
      setAutorizaciones(autorizacionesTemp);
    } catch (error) {
      console.error('Error cargando clientes asignados:', error);
      alert(`Error cargando la lista de clientes asignados: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

  const cargarArmasReasignadas = async () => {
    setLoadingArmasReasignadas(true);
    try {
      setArmasReasignadas([]);
    } catch (error) {
      console.error('Error cargando armas reasignadas:', error);
    } finally {
      setLoadingArmasReasignadas(false);
    }
  };

  // Cargar datos según la vista actual
  useEffect(() => {
    if (vistaActual === 'stock') {
      cargarStockArmas();
    } else if (vistaActual === 'clientes') {
      cargarClientes();
    } else if (vistaActual === 'clientes-asignados') {
      cargarClientesAsignados();
    } else if (vistaActual === 'reasignar-armas') {
      cargarArmasReasignadas();
    }
  }, [vistaActual]);

  return {
    cargarStockArmas,
    cargarClientes,
    cargarClientesAsignados,
    cargarArmasReasignadas,
  };
}
