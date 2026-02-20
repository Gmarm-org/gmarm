import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import type { CuotaPago, PagoCompleto } from '../types';

export function usePagosData() {
  const [pagos, setPagos] = useState<PagoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [ivaPercent, setIvaPercent] = useState<number | null>(null);

  useEffect(() => {
    cargarDatos();
    cargarIVA();
  }, []);

  const cargarIVA = async () => {
    try {
      const configuraciones = await apiService.getConfiguracionSistema();
      if (!configuraciones || typeof configuraciones !== 'object') throw new Error('No se pudo obtener la configuración del sistema');

      const ivaValue = configuraciones.IVA ?? configuraciones['IVA'];
      if (ivaValue == null) throw new Error('No se encontró la configuración de IVA en el sistema');

      const ivaNumero = typeof ivaValue === 'number' ? ivaValue : parseFloat(String(ivaValue));
      if (isNaN(ivaNumero) || ivaNumero < 0) throw new Error('Valor de IVA inválido en la configuración del sistema');

      setIvaPercent(ivaNumero);
    } catch (error) {
      console.error('Error cargando configuración:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error: No se pudo cargar la configuración del sistema. Por favor, contacte al administrador.');
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const clientesData = await apiService.getTodosClientes();

      // Paso 1: Obtener pagos de TODOS los clientes en paralelo (en vez de secuencial)
      const pagosResults = await Promise.all(
        clientesData.map(async (cliente) => {
          try {
            const pagosCliente = await apiService.getPagosCliente(cliente.id);
            return { cliente, pagos: pagosCliente };
          } catch {
            return { cliente, pagos: [] };
          }
        })
      );

      // Paso 2: Obtener cuotas de TODOS los pagos CREDITO en paralelo
      const pagosConCuotas = await Promise.all(
        pagosResults.flatMap(({ cliente, pagos: pagosCliente }) =>
          pagosCliente.map(async (pago) => {
          let cuotas: CuotaPago[] = [];
          if (pago.tipoPago === 'CREDITO' || pago.tipoPago === 'CUOTAS') {
            try {
              cuotas = await apiService.getCuotasPorPago(pago.id);
            } catch {
              // Cuotas no disponibles
            }
          }

          const montoPagado = cuotas.reduce((sum, c) =>
            sum + (c.estado === 'PAGADA' ? c.monto : 0), 0);
          const saldoPendiente = pago.montoTotal - montoPagado;
          const grupoImportacion = cliente.grupoImportacionNombre || 'N/A';
          const observaciones = cuotas
            .filter(c => c.observaciones && c.observaciones.trim() !== '')
            .map(c => c.observaciones)
            .join('; ') || '';

          return {
            ...pago,
            cliente,
            cuotas,
            saldoPendiente,
            grupoImportacion,
            observaciones
          } as PagoCompleto;
          })
        )
      );

      setPagos(pagosConCuotas);
    } catch (error) {
      console.error('Error cargando datos:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    pagos,
    loading,
    ivaPercent,
    cargarDatos,
  };
}
