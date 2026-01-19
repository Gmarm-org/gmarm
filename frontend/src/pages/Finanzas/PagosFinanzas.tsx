import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { Client } from '../Vendedor/types';
import * as XLSX from 'xlsx';
import { useTableFilters } from '../../hooks/useTableFilters';
import { TableHeaderWithFilters } from '../../components/TableHeaderWithFilters';

interface CuotaPago {
  id: number;
  numeroCuota: number;
  monto: number;
  fechaVencimiento: string;
  estado: string;
  fechaPago?: string;
  referenciaPago?: string;
  numeroRecibo?: string;
  comprobanteArchivo?: string;
  observaciones?: string;
  pagoId: number;
}

interface PagoCompleto {
  id: number;
  clienteId: number;
  cliente?: Client;
  montoTotal: number;
  tipoPago: string;
  estado: string;
  fechaCreacion: string;
  cuotas?: CuotaPago[];
  saldoPendiente?: number;
  grupoImportacion?: string;
  observaciones?: string;
}

const PagosFinanzas: React.FC = () => {
  const [pagos, setPagos] = useState<PagoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModalCuotas, setMostrarModalCuotas] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoCompleto | null>(null);
  const [cuotaEditando, setCuotaEditando] = useState<CuotaPago | null>(null);
  const [referenciaPago, setReferenciaPago] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [montoPago, setMontoPago] = useState<number>(0);
  const [comprobanteArchivo, setComprobanteArchivo] = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mostrarDatosFactura, setMostrarDatosFactura] = useState(false);
  const [mostrarModalAgregarCuota, setMostrarModalAgregarCuota] = useState(false);
  const [nuevaCuota, setNuevaCuota] = useState({
    monto: 0,
    fechaVencimiento: '',
    referenciaPago: ''
  });
  const [clienteFactura, setClienteFactura] = useState<Client | null>(null);
  const [montoFactura, setMontoFactura] = useState<number>(0);
  const [ivaPercent, setIvaPercent] = useState<number | null>(null); // IVA cargado desde configuracion_sistema
  const [, setCargandoIVA] = useState(true);
  const [descripcionArma, setDescripcionArma] = useState<string>('');
  const [mostrarModalCargarFactura, setMostrarModalCargarFactura] = useState(false);
  const [pagoParaFactura, setPagoParaFactura] = useState<PagoCompleto | null>(null);
  const [archivoFactura, setArchivoFactura] = useState<File | null>(null);
  const [cargandoFactura, setCargandoFactura] = useState(false);

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

  const handlePagarCuota = (cuota: CuotaPago) => {
    setCuotaEditando(cuota);
    setReferenciaPago('');
    setMontoPago(cuota.monto);
    setComprobanteArchivo(null);
    setObservaciones('');
    // Formato manual para evitar problemas de timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setFechaPago(`${year}-${month}-${day}`);
  };

  const confirmarPagoCuota = async () => {
    if (!cuotaEditando || !referenciaPago || !fechaPago) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    setProcesando(true);
    try {
      // Obtener usuario actual para el confirmador
      const usuario = await apiService.getMe();
      
      // Subir comprobante si existe
      let comprobanteArchivoRuta = null;
      if (comprobanteArchivo) {
        try {
          // Aquí deberías subir el archivo y obtener la ruta
          // Por ahora, asumimos que hay un endpoint para subir comprobantes
          const formData = new FormData();
          formData.append('archivo', comprobanteArchivo);
          formData.append('tipo', 'comprobante_cuota');
          formData.append('cuotaId', cuotaEditando.id.toString());
          
          // TODO: Implementar endpoint de subida de comprobante
          // const uploadResponse = await apiService.subirComprobanteCuota(cuotaEditando.id, comprobanteArchivo);
          // comprobanteArchivoRuta = uploadResponse.rutaArchivo;
        } catch (error) {
          console.warn('Error subiendo comprobante:', error);
          // Continuar sin el archivo si falla la subida
        }
      }
      
      await apiService.pagarCuota(
        cuotaEditando.id, 
        referenciaPago, 
        usuario.id,
        montoPago || cuotaEditando.monto,
        undefined,
        comprobanteArchivoRuta || undefined,
        observaciones || undefined
      );

      alert('✅ Cuota registrada exitosamente');
      
      // Recargar datos
      await cargarDatos();
      
      // Cerrar modal
      setMostrarModalCuotas(false);
      setCuotaEditando(null);
      setReferenciaPago('');
      setFechaPago('');
      setMontoPago(0);
      setComprobanteArchivo(null);
      setObservaciones('');
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert(`Error registrando el pago: ${error}`);
    } finally {
      setProcesando(false);
    }
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
    setArchivoFactura(null);
    setMostrarModalCargarFactura(true);
  };

  const confirmarCargarFactura = async () => {
    if (!pagoParaFactura || !pagoParaFactura.cliente) {
      alert('Error: No se pudo obtener la información del cliente');
      return;
    }

    if (!archivoFactura) {
      alert('Por favor seleccione un archivo de factura');
      return;
    }

    setCargandoFactura(true);
    try {
      // Obtener tipos de documento del catálogo
      const tiposDocumento = await apiService.getTiposDocumento();
      
      // Buscar el tipo de documento "FACTURA"
      const tipoFactura = tiposDocumento.find(td => 
        td.nombre?.toLowerCase().includes('factura') ||
        td.codigo?.toLowerCase().includes('factura')
      );

      if (!tipoFactura || !tipoFactura.id) {
        throw new Error('No se encontró el tipo de documento "FACTURA" en el sistema. Por favor, contacte al administrador.');
      }

      // Cargar el documento
      await apiService.cargarDocumentoCliente(
        parseInt(pagoParaFactura.cliente.id),
        tipoFactura.id,
        archivoFactura,
        `Factura de pago ID: ${pagoParaFactura.id}`
      );

      alert('✅ Factura cargada exitosamente');
      
      // Cerrar modal y limpiar
      setMostrarModalCargarFactura(false);
      setPagoParaFactura(null);
      setArchivoFactura(null);
      
      // Recargar datos para actualizar la vista
      await cargarDatos();
    } catch (error: any) {
      console.error('Error cargando factura:', error);
      alert(`Error al cargar la factura: ${error.message || 'Error desconocido'}`);
    } finally {
      setCargandoFactura(false);
    }
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
      ? `${pago.cliente.nombres} ${pago.cliente.apellidos}`.trim()
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
          ? `${pago.cliente.nombres} ${pago.cliente.apellidos}`.trim()
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            {pago.cliente.nombres} {pago.cliente.apellidos}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Cuotas de Pago - Cliente: {pagoSeleccionado.cliente?.nombres} {pagoSeleccionado.cliente?.apellidos}
              </h3>
              <button
                onClick={() => {
                  setMostrarModalCuotas(false);
                  setCuotaEditando(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={() => {
                  setMostrarModalAgregarCuota(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                ➕ Agregar Cuota
              </button>
            </div>

            {pagoSeleccionado.cuotas && pagoSeleccionado.cuotas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Pago</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nro. Recibo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagoSeleccionado.cuotas.map((cuota) => (
                      <tr key={cuota.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{cuota.numeroCuota}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">${cuota.monto.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(cuota.fechaVencimiento).toLocaleDateString('es-EC')}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            cuota.estado === 'PAGADA' ? 'bg-green-100 text-green-800' :
                            cuota.estado === 'VENCIDA' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cuota.estado}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {cuota.fechaPago ? new Date(cuota.fechaPago).toLocaleDateString('es-EC') : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {cuota.numeroRecibo || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-1">
                            {cuota.estado !== 'PAGADA' && (
                              <button
                                onClick={() => handlePagarCuota(cuota)}
                                className="text-green-600 hover:text-green-900 font-medium text-left"
                              >
                                Registrar Pago
                              </button>
                            )}
                            {cuota.estado === 'PAGADA' && (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      setProcesando(true);
                                      // Primero generar el recibo si no existe
                                      await apiService.generarRecibo(cuota.id);
                                      // Luego descargarlo
                                      await apiService.descargarRecibo(cuota.id);
                                    } catch (error) {
                                      console.error('Error descargando recibo:', error);
                                      alert(`Error al descargar el recibo: ${error}`);
                                    } finally {
                                      setProcesando(false);
                                    }
                                  }}
                                  disabled={procesando}
                                  className="text-blue-600 hover:text-blue-900 font-medium text-left disabled:opacity-50"
                                >
                                  📥 Descargar RECIBO
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      setProcesando(true);
                                      // El backend obtiene automáticamente los correos desde configuracion_sistema
                                      // (CORREOS_RECIBO) y agrega el correo del cliente
                                      
                                      // Primero generar el recibo si no existe
                                      await apiService.generarRecibo(cuota.id);
                                      // Luego enviarlo por correo (backend maneja los correos automáticamente)
                                      await apiService.enviarReciboPorCorreo(cuota.id);
                                      alert('✅ Recibo enviado exitosamente');
                                    } catch (error: any) {
                                      console.error('Error enviando recibo:', error);
                                      const errorMessage = error?.message || error?.error || 'Error desconocido';
                                      alert(`Error al enviar el recibo: ${errorMessage}`);
                                    } finally {
                                      setProcesando(false);
                                    }
                                  }}
                                  disabled={procesando}
                                  className="text-purple-600 hover:text-purple-900 font-medium text-left disabled:opacity-50"
                                >
                                  📧 Enviar por Correo
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay cuotas registradas para este pago.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para agregar cuota */}
      {mostrarModalAgregarCuota && pagoSeleccionado && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Nueva Cuota</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={nuevaCuota.monto}
                onChange={(e) => setNuevaCuota({ ...nuevaCuota, monto: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                value={nuevaCuota.fechaVencimiento}
                onChange={(e) => setNuevaCuota({ ...nuevaCuota, fechaVencimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia de Pago
              </label>
              <input
                type="text"
                value={nuevaCuota.referenciaPago}
                onChange={(e) => setNuevaCuota({ ...nuevaCuota, referenciaPago: e.target.value })}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setMostrarModalAgregarCuota(false);
                  setNuevaCuota({ monto: 0, fechaVencimiento: '', referenciaPago: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!nuevaCuota.monto || !nuevaCuota.fechaVencimiento) {
                    alert('Por favor complete todos los campos obligatorios');
                    return;
                  }

                  setProcesando(true);
                  try {
                    await apiService.crearCuotaPago(pagoSeleccionado.id, nuevaCuota);
                    alert('✅ Cuota agregada exitosamente');
                    await cargarDatos();
                    // Recargar cuotas del pago seleccionado
                    if (pagoSeleccionado) {
                      const cuotasData = await apiService.getCuotasPorPago(pagoSeleccionado.id);
                      setPagoSeleccionado({
                        ...pagoSeleccionado,
                        cuotas: cuotasData
                      });
                    }
                    setMostrarModalAgregarCuota(false);
                    setNuevaCuota({ monto: 0, fechaVencimiento: '', referenciaPago: '' });
                  } catch (error) {
                    console.error('Error agregando cuota:', error);
                    alert(`Error agregando la cuota: ${error}`);
                  } finally {
                    setProcesando(false);
                  }
                }}
                disabled={procesando}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {procesando ? 'Agregando...' : 'Agregar Cuota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar pago de cuota */}
      {cuotaEditando && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Pago de Cuota #{cuotaEditando.numeroCuota}</h3>
            
            {/* Información de solo lectura */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha de Vencimiento
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(cuotaEditando.fechaVencimiento).toLocaleDateString('es-EC')}
                </p>
              </div>

              {pagoSeleccionado && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Saldo Pendiente Total
                  </label>
                  <p className="text-sm font-semibold text-red-600">
                    ${(pagoSeleccionado.montoTotal - (pagoSeleccionado.cuotas?.filter(c => c.estado === 'PAGADA').reduce((sum, c) => sum + c.monto, 0) || 0)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Campos editables */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Recibo
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 text-sm">
                Se genera automáticamente al registrar el pago (formato: RC-IMPORTADOR-AÑO-000100).
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor de Pago * (Editable)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoPago}
                onChange={(e) => setMontoPago(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Monto original: ${cuotaEditando.monto.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia de Pago *
              </label>
              <input
                type="text"
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="Nro. transferencia, cheque, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Pago *
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante o Transferencia (PDF/Foto)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setComprobanteArchivo(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCuotaEditando(null);
                  setReferenciaPago('');
                  setFechaPago('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPagoCuota}
                disabled={procesando}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {procesando ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver datos de factura */}
      {mostrarDatosFactura && clienteFactura && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Datos de Factura</h3>
              <button
                onClick={() => setMostrarDatosFactura(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cédula / RUC
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clienteFactura.numeroIdentificacion}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nombre Completo
                  </label>
                  <p className="text-sm font-semibold text-gray-900">
                    {clienteFactura.nombres} {clienteFactura.apellidos}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Correo Electrónico
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clienteFactura.email}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Teléfono
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clienteFactura.telefonoPrincipal}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dirección
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clienteFactura.direccion || 'N/A'}</p>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-300">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Descripción
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{descripcionArma || 'Cargando...'}</p>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-300">
                  <div className="space-y-2">
                    {ivaPercent !== null ? (
                      <>
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700">Subtotal</label>
                          <p className="text-sm font-semibold text-gray-900">${(montoFactura / (1 + ivaPercent / 100)).toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700">IVA ({ivaPercent}%)</label>
                          <p className="text-sm font-semibold text-gray-900">${(montoFactura - (montoFactura / (1 + ivaPercent / 100))).toFixed(2)}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700">IVA</label>
                        <p className="text-sm text-yellow-600">⚠️ Cargando configuración...</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <label className="text-base font-bold text-gray-900">Total</label>
                      <p className="text-2xl font-bold text-blue-600">${montoFactura.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setMostrarDatosFactura(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cargar factura */}
      {mostrarModalCargarFactura && pagoParaFactura && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Cargar Factura</h3>
              <button
                onClick={() => {
                  setMostrarModalCargarFactura(false);
                  setPagoParaFactura(null);
                  setArchivoFactura(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <p className="text-sm text-gray-900">
                {pagoParaFactura.cliente?.nombres} {pagoParaFactura.cliente?.apellidos}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo de Factura (PDF/Foto) *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setArchivoFactura(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setMostrarModalCargarFactura(false);
                  setPagoParaFactura(null);
                  setArchivoFactura(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCargarFactura}
                disabled={cargandoFactura || !archivoFactura}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {cargandoFactura ? 'Cargando...' : 'Cargar Factura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosFinanzas;

