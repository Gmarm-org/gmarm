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

      const clientesSinArmaAsignada: any[] = [];

      for (const cliente of response) {
        try {
          const armasResponse = await apiService.getArmasCliente(cliente.id);
          const tieneArmaAsignada = armasResponse && armasResponse.length > 0 &&
                                     armasResponse.some((arma: any) => arma.estado === 'ASIGNADA');

          if (!tieneArmaAsignada) {
            clientesSinArmaAsignada.push(cliente);
          }
        } catch (error) {
          clientesSinArmaAsignada.push(cliente);
        }
      }

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

      const weaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }> = {};
      const clientesConArmaAsignada: any[] = [];
      const autorizacionesTemp: Record<string, any[]> = {};

      for (const client of response) {
        try {
          const armasResponse = await apiService.getArmasCliente(client.id);
          if (armasResponse && armasResponse.length > 0) {
            const arma = armasResponse[0];
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

              try {
                const autorizacionesResponse = await apiService.getAutorizacionesPorCliente(parseInt(client.id));
                autorizacionesTemp[client.id] = autorizacionesResponse || [];
              } catch {
                autorizacionesTemp[client.id] = [];
              }
            }
          }
        } catch {
          // Si falla cargar armas de un cliente, continuar con el siguiente
        }
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
