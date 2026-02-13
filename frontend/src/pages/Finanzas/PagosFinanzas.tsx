import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { Client } from '../Vendedor/types';
import * as XLSX from 'xlsx';
import { useTableFilters } from '../../hooks/useTableFilters';
import { TableHeaderWithFilters } from '../../components/TableHeaderWithFilters';
import { formatNombreCompleto } from '../../utils/formatUtils';
import type { CuotaPago, PagoCompleto } from './types';
import ModalCuotas from './modals/ModalCuotas';
import ModalDatosFactura from './modals/ModalDatosFactura';
import ModalCargarFactura from './modals/ModalCargarFactura';

const PagosFinanzas: React.FC = () => {
  const [pagos, setPagos] = useState<PagoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModalCuotas, setMostrarModalCuotas] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoCompleto | null>(null);
  const [mostrarDatosFactura, setMostrarDatosFactura] = useState(false);
  const [clienteFactura, setClienteFactura] = useState<Client | null>(null);
  const [montoFactura, setMontoFactura] = useState<number>(0);
  const [ivaPercent, setIvaPercent] = useState<number | null>(null);
  const [, setCargandoIVA] = useState(true);
  const [descripcionArma, setDescripcionArma] = useState<string>('');
  const [mostrarModalCargarFactura, setMostrarModalCargarFactura] = useState(false);
  const [pagoParaFactura, setPagoParaFactura] = useState<PagoCompleto | null>(null);

  // Hook para filtros y ordenamiento
  const {
    filteredAndSortedData: pagosFiltrados,
    sortConfig,
    handleSort,
    filters,
    setFilter,
    clearFilters,
  } = useTableFilters<PagoCompleto>(pagos);

  useEffect(() => {
    cargarDatos();
    cargarIVA();
  }, []);

  const cargarIVA = async () => {
    setCargandoIVA(true);
    try {
      const configuraciones = await apiService.getConfiguracionSistema();
      if (configuraciones && typeof configuraciones === 'object') {
        const ivaValue = configuraciones.IVA || configuraciones['IVA'];
        if (ivaValue !== undefined && ivaValue !== null) {
          // El backend devuelve el IVA como número entero (ej: 15) o string (ej: "15")
          const ivaNumero = typeof ivaValue === 'number' ? ivaValue : parseFloat(String(ivaValue));
          if (!isNaN(ivaNumero) && ivaNumero >= 0) {
            setIvaPercent(ivaNumero);
            console.log(`✅ IVA cargado desde configuración: ${ivaNumero}%`);
          } else {
            console.error('❌ Valor de IVA inválido en configuración:', ivaValue);
            throw new Error('Valor de IVA inválido en la configuración del sistema');
          }
        } else {
          throw new Error('No se encontró la configuración de IVA en el sistema');
        }

        // Nota: Los correos para recibos (CORREOS_RECIBO) se obtienen automáticamente
        // en el backend desde configuracion_sistema, no es necesario cargarlos aquí
      } else {
        throw new Error('No se pudo obtener la configuración del sistema');
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      alert('Error: No se pudo cargar la configuración del sistema. Por favor, contacte al administrador.');
      // NO establecer un valor por defecto - el sistema debe fallar si no puede cargar el IVA
    } finally {
      setCargandoIVA(false);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar todos los clientes del sistema
      const clientesData = await apiService.getTodosClientes();

      // Para cada cliente, cargar sus pagos
      const pagosTemp: PagoCompleto[] = [];
      for (const cliente of clientesData) {
        try {
          const pagosCliente = await apiService.getPagosCliente(cliente.id);
          for (const pago of pagosCliente) {
            // Cargar cuotas del pago si es tipo crédito
            let cuotas: CuotaPago[] = [];
            if (pago.tipoPago === 'CREDITO' || pago.tipoPago === 'CUOTAS') {
              try {
                const cuotasData = await apiService.getCuotasPorPago(pago.id);
                cuotas = cuotasData;
              } catch (error) {
                console.warn(`No se pudieron cargar cuotas para pago ${pago.id}`);
              }
            }

            // Calcular saldo pendiente
            const montoPagado = cuotas.reduce((sum, c) =>
              sum + (c.estado === 'PAGADA' ? c.monto : 0), 0);
            const saldoPendiente = pago.montoTotal - montoPagado;

            // Obtener grupo de importación del cliente
            const grupoImportacion = cliente.grupoImportacionNombre || 'N/A';

            // Obtener observaciones (de la última cuota con observaciones)
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

  const handleVerCuotas = async (pago: PagoCompleto) => {
    setPagoSeleccionado(pago);

    // Si no tiene cuotas cargadas, cargarlas
    if (!pago.cuotas || pago.cuotas.length === 0) {
      try {
        const cuotasData = await apiService.getCuotasPorPago(pago.id);
        setPagoSeleccionado({
          ...pago,
          cuotas: cuotasData
        });
      } catch (error) {
        console.error('Error cargando cuotas:', error);
        setPagoSeleccionado({ ...pago, cuotas: [] });
      }
    }

    setMostrarModalCuotas(true);
  };

  const handleVerDatosFactura = async (pago: PagoCompleto) => {
    if (pago.cliente) {
      setClienteFactura(pago.cliente);
      setMontoFactura(pago.montoTotal);
      setDescripcionArma(''); // Limpiar descripción anterior

      // Cargar información del arma del cliente
      try {
        const armasResponse = await apiService.getArmasCliente(parseInt(pago.cliente.id));
        if (armasResponse && armasResponse.length > 0) {
          const arma = armasResponse[0];
          // Construir descripción: PISTOLA MARCA CZ, MODELO CZ P-10 SC Urban Grey, CALIBRE 9MM SERIE: D286252
          const tipoArma = (arma.armaCategoriaNombre?.toUpperCase() || 'PISTOLA');
          const marca = arma.armaModelo?.substring(0, 2).toUpperCase() || 'CZ';
          const modelo = arma.armaModelo || 'N/A';
          const calibre = arma.armaCalibre || 'N/A';
          const serie = arma.numeroSerie || 'N/A';
          const descripcion = `${tipoArma} MARCA ${marca}, MODELO ${modelo}, CALIBRE ${calibre} SERIE: ${serie}`;
          setDescripcionArma(descripcion);
        }
      } catch (error) {
        console.warn('No se pudieron cargar las armas del cliente:', error);
        setDescripcionArma('No disponible');
      }

      setMostrarDatosFactura(true);
    }
  };

  const handleCargarFactura = (pago: PagoCompleto) => {
    setPagoParaFactura(pago);
    setMostrarModalCargarFactura(true);
  };

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

    // Calcular montos
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
      console.error('❌ Error al exportar detalle a Excel:', error);
      alert(`❌ Error al exportar detalle a Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [crearHojaDetallePago]);

  // Función para exportar resumen a Excel (una fila por cliente)
  const exportarPagosAExcel = useCallback(async () => {
    try {
      console.log('📊 Iniciando exportación resumen de pagos a Excel...');

      const workbook = XLSX.utils.book_new();
      const encabezados = [
        'Cliente',
        'CI/RUC',
        'Email',
        'Teléfono',
        'Dirección',
        'Arma',
        'Monto antes de IVA',
        'IVA',
        'Monto Total',
        'Monto Pagado',
        'Saldo Pendiente',
        'Tipo Pago',
        'Estado',
        'Grupo Importación',
        'Fecha Creación',
        'N° Cuotas',
        'Cuotas Pagadas',
        'Observaciones'
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
          clienteNombre,
          clienteCedula,
          pago.cliente?.email || 'N/A',
          pago.cliente?.telefonoPrincipal || 'N/A',
          pago.cliente?.direccion || 'N/A',
          descripcionArma,
          montoAntesIva.toFixed(2),
          montoIva.toFixed(2),
          pago.montoTotal.toFixed(2),
          montoPagado.toFixed(2),
          saldoPendiente.toFixed(2),
          pago.tipoPago,
          pago.estado,
          pago.grupoImportacion || 'N/A',
          new Date(pago.fechaCreacion).toLocaleDateString('es-EC'),
          pago.cuotas?.length || 0,
          pago.cuotas?.filter(c => c.estado === 'PAGADA').length || 0,
          pago.observaciones || ''
        ]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
      worksheet['!cols'] = [
        { wch: 28 },
        { wch: 14 },
        { wch: 24 },
        { wch: 14 },
        { wch: 30 },
        { wch: 50 },
        { wch: 16 },
        { wch: 12 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 20 },
        { wch: 14 },
        { wch: 10 },
        { wch: 14 },
        { wch: 28 }
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ResumenPagos');

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Pagos_Resumen_${fecha}.xlsx`;

      XLSX.writeFile(workbook, nombreArchivo);

      console.log(`✅ Exportación completada: ${nombreArchivo}`);
      alert(`✅ Exportación completada exitosamente!\n\nArchivo: ${nombreArchivo}\nTotal de pagos: ${pagosFiltrados.length}`);
    } catch (error) {
      console.error('❌ Error al exportar a Excel:', error);
      alert(`❌ Error al exportar a Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [pagosFiltrados, ivaPercent, obtenerDescripcionArma]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <p className="text-gray-600">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gestión de Pagos</h2>
            <p className="text-sm text-gray-600 mt-1">Visualiza y gestiona todos los pagos del sistema</p>
          </div>
          <div className="flex gap-2">
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                title="Limpiar filtros"
              >
                🗑️ Limpiar Filtros
              </button>
            )}
            <button
              onClick={exportarPagosAExcel}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              📊 Exportar a Excel
            </button>
          </div>
        </div>

        {pagos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No hay pagos registrados en el sistema</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeaderWithFilters
                    column="id"
                    label="ID"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.id || ''}
                    onFilterChange={setFilter}
                  />
                  <TableHeaderWithFilters
                    column="cliente"
                    label="Cliente"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.cliente || ''}
                    onFilterChange={setFilter}
                  />
                  <TableHeaderWithFilters
                    column="montoTotal"
                    label="Monto Total"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.montoTotal || ''}
                    onFilterChange={setFilter}
                  />
                  <TableHeaderWithFilters
                    column="tipoPago"
                    label="Tipo"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.tipoPago || ''}
                    onFilterChange={setFilter}
                  />
                  <TableHeaderWithFilters
                    column="estado"
                    label="Estado"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.estado || ''}
                    onFilterChange={setFilter}
                  />
                  <TableHeaderWithFilters
                    column="fechaCreacion"
                    label="Fecha Creación"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.fechaCreacion || ''}
                    onFilterChange={setFilter}
                  />
                  <TableHeaderWithFilters
                    column="grupoImportacion"
                    label="Grupo Importación"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.grupoImportacion || ''}
                    onFilterChange={setFilter}
                  />
                  <TableHeaderWithFilters
                    column="saldoPendiente"
                    label="Saldo Pendiente"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.saldoPendiente || ''}
                    onFilterChange={setFilter}
                  />
                  <TableHeaderWithFilters
                    column="observaciones"
                    label="Observaciones"
                    sortKey={sortConfig.key}
                    sortDirection={sortConfig.direction || null}
                    onSort={handleSort}
                    filterValue={filters.observaciones || ''}
                    onFilterChange={setFilter}
                  />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagosFiltrados.map((pago) => (
                  <tr key={pago.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {pago.cliente ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatNombreCompleto(pago.cliente.nombres, pago.cliente.apellidos)}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {pago.cliente.numeroIdentificacion}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${pago.montoTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        pago.tipoPago === 'CONTADO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {pago.tipoPago === 'CONTADO' ? 'CONTADO' : 'CRÉDITO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pago.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                        pago.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(pago.fechaCreacion).toLocaleDateString('es-EC')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.grupoImportacion || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(pago.saldoPendiente || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate" title={pago.observaciones || ''}>
                      {pago.observaciones || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10">
                      <div className="flex flex-col gap-1">
                        {(pago.tipoPago === 'CREDITO' || pago.tipoPago === 'CUOTAS') && (
                          <button
                            onClick={() => handleVerCuotas(pago)}
                            className="text-blue-600 hover:text-blue-900 font-medium text-left"
                          >
                            Ver Cuotas
                          </button>
                        )}
                        {/* Botón Ver Datos Factura - SIEMPRE visible */}
                        <button
                          onClick={() => handleVerDatosFactura(pago)}
                          className="text-green-600 hover:text-green-900 font-medium text-left"
                        >
                          Ver Datos Factura
                        </button>
                        <button
                          onClick={() => handleCargarFactura(pago)}
                          className="text-purple-600 hover:text-purple-900 font-medium text-left"
                        >
                          📄 Cargar Factura
                        </button>
                        <button
                          onClick={() => exportarPagoDetalleAExcel(pago)}
                          className="text-green-700 hover:text-green-900 font-medium text-left"
                        >
                          📊 Descargar info en Excel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cuotas */}
      {mostrarModalCuotas && pagoSeleccionado && (
        <ModalCuotas
          pago={pagoSeleccionado}
          onClose={() => setMostrarModalCuotas(false)}
          onDataReload={cargarDatos}
          onPagoUpdate={setPagoSeleccionado}
        />
      )}

      {/* Modal para ver datos de factura */}
      {mostrarDatosFactura && clienteFactura && (
        <ModalDatosFactura
          cliente={clienteFactura}
          montoFactura={montoFactura}
          ivaPercent={ivaPercent}
          descripcionArma={descripcionArma}
          onClose={() => setMostrarDatosFactura(false)}
        />
      )}

      {/* Modal para cargar factura */}
      {mostrarModalCargarFactura && pagoParaFactura && (
        <ModalCargarFactura
          pago={pagoParaFactura}
          onClose={() => {
            setMostrarModalCargarFactura(false);
            setPagoParaFactura(null);
          }}
          onSuccess={cargarDatos}
        />
      )}
    </div>
  );
};

export default PagosFinanzas;
