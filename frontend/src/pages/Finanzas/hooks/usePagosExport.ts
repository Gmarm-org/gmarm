import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { apiService } from '../../../services/api';
import { formatNombreCompleto } from '../../../utils/formatUtils';
import type { PagoCompleto } from '../types';

export function usePagosExport(ivaPercent: number | null) {

  const obtenerDescripcionArma = useCallback(async (pago: PagoCompleto, clienteNombre: string) => {
    let descripcionArma = 'N/A';
    try {
      if (pago.cliente) {
        const armasResponse = await apiService.getArmasCliente(parseInt(pago.cliente.id));
        if (armasResponse && armasResponse.length > 0) {
          const arma = armasResponse[0];
          const tipoArma = (arma.armaCategoriaNombre?.toUpperCase() || 'PISTOLA');
          const marca = arma.armaModelo?.substring(0, 2).toUpperCase() || 'CZ';
          const modelo = arma.armaModelo || 'N/A';
          const calibre = arma.armaCalibre || 'N/A';
          const serie = arma.numeroSerie || 'N/A';
          descripcionArma = `${tipoArma} MARCA ${marca}, MODELO ${modelo}, CALIBRE ${calibre} SERIE: ${serie}`;
        }
      }
    } catch (error) {
      console.warn(`No se pudieron cargar las armas para el cliente ${clienteNombre}:`, error);
    }
    return descripcionArma;
  }, []);

  const crearHojaDetallePago = useCallback(async (pago: PagoCompleto) => {
    const clienteNombre = pago.cliente
      ? formatNombreCompleto(pago.cliente.nombres, pago.cliente.apellidos)
      : 'N/A';
    const clienteCedula = pago.cliente?.numeroIdentificacion || 'N/A';
    const descripcionArma = await obtenerDescripcionArma(pago, clienteNombre);

    const montoPagado = pago.montoTotal - (pago.saldoPendiente || 0);
    const saldoPendiente = pago.saldoPendiente || 0;
    const ivaPorcentaje = ivaPercent || 15;
    const montoAntesIva = pago.montoTotal / (1 + (ivaPorcentaje / 100));
    const montoIva = pago.montoTotal - montoAntesIva;

    const datosFactura = [
      ['════════════════════════════════════════════════════════════'],
      ['                    DATOS DE LA FACTURA                      '],
      ['════════════════════════════════════════════════════════════'],
      [''],
      ['Cliente:', clienteNombre],
      ['CI/RUC:', clienteCedula],
      ['Email:', pago.cliente?.email || 'N/A'],
      ['Teléfono:', pago.cliente?.telefonoPrincipal || 'N/A'],
      ['Dirección:', pago.cliente?.direccion || 'N/A'],
      [''],
      ['Arma:', descripcionArma],
      [''],
      ['════════════════════════════════════════════════════════════'],
      ['                    INFORMACIÓN FINANCIERA                   '],
      ['════════════════════════════════════════════════════════════'],
      [''],
      ['Monto antes de IVA:', montoAntesIva.toFixed(2)],
      ['IVA (' + ivaPorcentaje + '%):', montoIva.toFixed(2)],
      ['Monto Total:', pago.montoTotal.toFixed(2)],
      ['Monto Pagado:', montoPagado.toFixed(2)],
      ['Saldo Pendiente:', saldoPendiente.toFixed(2)],
      [''],
      ['Tipo de Pago:', pago.tipoPago],
      ['Estado:', pago.estado],
      ['Grupo de Importación:', pago.grupoImportacion || 'N/A'],
      ['Fecha Creación:', new Date(pago.fechaCreacion).toLocaleDateString('es-EC')],
      [''],
      ['════════════════════════════════════════════════════════════'],
      ['                    DETALLE DE CUOTAS                        '],
      ['════════════════════════════════════════════════════════════'],
      [''],
    ];

    const encabezadosCuotas = [
      ['N° Cuota', 'Monto', 'Fecha Vencimiento', 'Estado', 'Fecha Pago', 'Referencia Pago', 'N° Recibo', 'Observaciones']
    ];

    const datosCuotas = pago.cuotas?.map((cuota) => [
      cuota.numeroCuota,
      cuota.monto.toFixed(2),
      cuota.fechaVencimiento ? new Date(cuota.fechaVencimiento).toLocaleDateString('es-EC') : 'N/A',
      cuota.estado,
      cuota.fechaPago ? new Date(cuota.fechaPago).toLocaleDateString('es-EC') : 'N/A',
      cuota.referenciaPago || 'N/A',
      cuota.numeroRecibo || 'N/A',
      cuota.observaciones || ''
    ]) || [];

    const todosLosDatos = [
      ...datosFactura,
      ...encabezadosCuotas,
      ...datosCuotas,
      [''],
      ['════════════════════════════════════════════════════════════'],
      ['                    DATOS DE PAGOS                           '],
      ['════════════════════════════════════════════════════════════'],
      [''],
      ['ID Pago', 'Cliente', 'CI/RUC', 'Monto Total', 'Tipo Pago', 'Estado', 'Monto Pagado', 'Saldo Pendiente', 'Grupo Importación', 'Fecha Creación', 'N° Cuotas', 'Cuotas Pagadas', 'Observaciones'],
      [
        pago.id,
        clienteNombre,
        clienteCedula,
        pago.montoTotal.toFixed(2),
        pago.tipoPago,
        pago.estado,
        montoPagado.toFixed(2),
        saldoPendiente.toFixed(2),
        pago.grupoImportacion || 'N/A',
        new Date(pago.fechaCreacion).toLocaleDateString('es-EC'),
        pago.cuotas?.length || 0,
        pago.cuotas?.filter(c => c.estado === 'PAGADA').length || 0,
        pago.observaciones || ''
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(todosLosDatos);
    const columnWidths = [];
    const maxCol = XLSX.utils.decode_range(worksheet['!ref'] || 'A1').e.c;
    for (let col = 0; col <= maxCol; col++) {
      let maxWidth = 15;
      if (col === 0) maxWidth = 12;
      else if (col === 1) maxWidth = 30;
      else if (col === 2) maxWidth = 15;
      else if (col === 3) maxWidth = 15;
      else maxWidth = 20;
      columnWidths.push({ wch: maxWidth });
    }
    worksheet['!cols'] = columnWidths;

    const nombreHoja = `${clienteNombre.substring(0, 20)}_${pago.id}`.substring(0, 31);
    return { worksheet, nombreHoja };
  }, [ivaPercent, obtenerDescripcionArma]);

  const exportarPagoDetalleAExcel = useCallback(async (pago: PagoCompleto) => {
    try {
      const workbook = XLSX.utils.book_new();
      const { worksheet, nombreHoja } = await crearHojaDetallePago(pago);
      XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Pago_${pago.id}_${fecha}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);
    } catch (error) {
      console.error('Error al exportar detalle a Excel:', error);
      alert(`Error al exportar detalle a Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [crearHojaDetallePago]);

  const exportarPagosAExcel = useCallback(async (pagosFiltrados: PagoCompleto[]) => {
    try {
      const workbook = XLSX.utils.book_new();
      const encabezados = [
        'Cliente', 'CI/RUC', 'Email', 'Teléfono', 'Dirección', 'Arma',
        'Monto antes de IVA', 'IVA', 'Monto Total', 'Monto Pagado',
        'Saldo Pendiente', 'Tipo Pago', 'Estado', 'Grupo Importación',
        'Fecha Creación', 'N° Cuotas', 'Cuotas Pagadas', 'Observaciones'
      ];

      const filas = [];
      for (const pago of pagosFiltrados) {
        const clienteNombre = pago.cliente
          ? formatNombreCompleto(pago.cliente.nombres, pago.cliente.apellidos)
          : 'N/A';
        const clienteCedula = pago.cliente?.numeroIdentificacion || 'N/A';
        const descripcionArma = await obtenerDescripcionArma(pago, clienteNombre);

        const montoPagado = pago.montoTotal - (pago.saldoPendiente || 0);
        const saldoPendiente = pago.saldoPendiente || 0;
        const ivaPorcentaje = ivaPercent || 15;
        const montoAntesIva = pago.montoTotal / (1 + (ivaPorcentaje / 100));
        const montoIva = pago.montoTotal - montoAntesIva;

        filas.push([
          clienteNombre, clienteCedula,
          pago.cliente?.email || 'N/A', pago.cliente?.telefonoPrincipal || 'N/A',
          pago.cliente?.direccion || 'N/A', descripcionArma,
          montoAntesIva.toFixed(2), montoIva.toFixed(2),
          pago.montoTotal.toFixed(2), montoPagado.toFixed(2),
          saldoPendiente.toFixed(2), pago.tipoPago, pago.estado,
          pago.grupoImportacion || 'N/A',
          new Date(pago.fechaCreacion).toLocaleDateString('es-EC'),
          pago.cuotas?.length || 0,
          pago.cuotas?.filter(c => c.estado === 'PAGADA').length || 0,
          pago.observaciones || ''
        ]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
      worksheet['!cols'] = [
        { wch: 28 }, { wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 30 },
        { wch: 50 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
        { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 14 },
        { wch: 10 }, { wch: 14 }, { wch: 28 }
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ResumenPagos');

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Pagos_Resumen_${fecha}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);

      alert(`Exportación completada exitosamente!\n\nArchivo: ${nombreArchivo}\nTotal de pagos: ${pagosFiltrados.length}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert(`Error al exportar a Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [ivaPercent, obtenerDescripcionArma]);

  return {
    obtenerDescripcionArma,
    exportarPagoDetalleAExcel,
    exportarPagosAExcel,
  };
}
