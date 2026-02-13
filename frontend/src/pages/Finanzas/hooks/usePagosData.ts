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
      if (configuraciones && typeof configuraciones === 'object') {
        const ivaValue = configuraciones.IVA || configuraciones['IVA'];
        if (ivaValue !== undefined && ivaValue !== null) {
          const ivaNumero = typeof ivaValue === 'number' ? ivaValue : parseFloat(String(ivaValue));
          if (!isNaN(ivaNumero) && ivaNumero >= 0) {
            setIvaPercent(ivaNumero);
            console.log(`IVA cargado desde configuración: ${ivaNumero}%`);
          } else {
            throw new Error('Valor de IVA inválido en la configuración del sistema');
          }
        } else {
          throw new Error('No se encontró la configuración de IVA en el sistema');
        }
      } else {
        throw new Error('No se pudo obtener la configuración del sistema');
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      alert('Error: No se pudo cargar la configuración del sistema. Por favor, contacte al administrador.');
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const clientesData = await apiService.getTodosClientes();

      const pagosTemp: PagoCompleto[] = [];
      for (const cliente of clientesData) {
        try {
          const pagosCliente = await apiService.getPagosCliente(cliente.id);
          for (const pago of pagosCliente) {
            let cuotas: CuotaPago[] = [];
            if (pago.tipoPago === 'CREDITO' || pago.tipoPago === 'CUOTAS') {
              try {
                const cuotasData = await apiService.getCuotasPorPago(pago.id);
                cuotas = cuotasData;
              } catch (error) {
                console.warn(`No se pudieron cargar cuotas para pago ${pago.id}`);
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

            pagosTemp.push({
              ...pago,
              cliente,
              cuotas,
              saldoPendiente,
              grupoImportacion,
              observaciones
            });
          }
        } catch (error) {
          console.warn(`No se pudieron cargar pagos para cliente ${cliente.id}`);
        }
      }

      setPagos(pagosTemp);
    } catch (error) {
      console.error('Error cargando datos:', error);
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
