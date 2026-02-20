import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { apiService } from '../../../services/api';

/**
 * Hook para exportar todos los clientes a Excel (Jefe de Ventas)
 * Exporta TODOS los clientes del sistema, no solo los de un vendedor
 */
export const useJefeVentasExport = () => {
  const exportarClientesAExcel = useCallback(async () => {
    try {
      // Obtener clientes y configuración IVA en paralelo
      const [todosLosClientes, configuraciones] = await Promise.all([
        apiService.getTodosClientes(),
        apiService.getConfiguracionSistema(),
      ]);

      // Calcular IVA una sola vez
      const ivaValue = configuraciones?.IVA || configuraciones?.['IVA'];
      const ivaPercent = typeof ivaValue === 'number' ? ivaValue : parseFloat(String(ivaValue || '15'));
      const ivaDecimal = isNaN(ivaPercent) ? 0.15 : ivaPercent / 100;

      // Obtener armas de todos los clientes en paralelo
      const armasResults = await Promise.all(
        todosLosClientes.map(async (cliente) => {
          try {
            const armasResponse = await apiService.getArmasCliente(cliente.id);
            return { cliente, arma: armasResponse && armasResponse.length > 0 ? armasResponse[0] : null };
          } catch {
            return { cliente, arma: null };
          }
        })
      );

      const datosExportacion: any[] = [];

      for (const { cliente, arma } of armasResults) {
        const clienteData = cliente as any;
        const tipoClienteNombre = clienteData.tipoProcesoNombre || clienteData.tipoClienteNombre || clienteData.tipoCliente || 'N/A';
        const vendedorNombre = clienteData.vendedorNombre || clienteData.vendedor?.nombres || '';
        const vendedorApellidos = clienteData.vendedorApellidos || clienteData.vendedor?.apellidos || '';
        const vendedorCompleto = vendedorNombre && vendedorApellidos
          ? `${vendedorNombre} ${vendedorApellidos}`.trim()
          : clienteData.vendedor?.email || clienteData.usuarioCreador?.email || 'N/A';

        const fila: Record<string, any> = {};

        if (cliente.numeroIdentificacion) fila['CI/RUC'] = cliente.numeroIdentificacion;
        const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
        if (nombreCompleto) fila['Nombre Completo'] = nombreCompleto;
        if (tipoClienteNombre && tipoClienteNombre !== 'N/A') fila['Tipo Cliente'] = tipoClienteNombre;
        if (cliente.email) fila['Email'] = cliente.email;
        if (cliente.telefonoPrincipal) fila['Teléfono Principal'] = cliente.telefonoPrincipal;
        if (clienteData.telefonoSecundario) fila['Teléfono Secundario'] = clienteData.telefonoSecundario;
        if (clienteData.direccion) fila['Dirección'] = clienteData.direccion;
        if (clienteData.provincia) fila['Provincia'] = clienteData.provincia;
        if (clienteData.canton) fila['Cantón'] = clienteData.canton;
        if (clienteData.fechaNacimiento) fila['Fecha Nacimiento'] = new Date(clienteData.fechaNacimiento).toLocaleDateString('es-EC');
        if (clienteData.estadoMilitar) fila['Estado Militar'] = clienteData.estadoMilitar;
        if (clienteData.codigoIssfa) fila['Código ISSFA'] = clienteData.codigoIssfa;
        if (clienteData.rango) fila['Rango'] = clienteData.rango;
        if (clienteData.representanteLegal) fila['Representante Legal'] = clienteData.representanteLegal;
        if (clienteData.ruc) fila['RUC Empresa'] = clienteData.ruc;
        if (clienteData.nombreEmpresa) fila['Nombre Empresa'] = clienteData.nombreEmpresa;
        if (clienteData.direccionFiscal) fila['Dirección Fiscal'] = clienteData.direccionFiscal;
        if (clienteData.telefonoReferencia) fila['Teléfono Referencia'] = clienteData.telefonoReferencia;
        if (clienteData.correoEmpresa) fila['Correo Empresa'] = clienteData.correoEmpresa;
        if (clienteData.provinciaEmpresa) fila['Provincia Empresa'] = clienteData.provinciaEmpresa;
        if (clienteData.cantonEmpresa) fila['Cantón Empresa'] = clienteData.cantonEmpresa;
        if (cliente.estado) fila['Estado Cliente'] = cliente.estado;
        if (clienteData.fechaCreacion) fila['Fecha Creación'] = new Date(clienteData.fechaCreacion).toLocaleDateString('es-EC');
        if (vendedorCompleto && vendedorCompleto !== 'N/A') fila['Vendedor'] = vendedorCompleto;

        if (arma) {
          if (arma.armaModelo) fila['Arma Nombre'] = arma.armaModelo;
          if (arma.armaModelo) fila['Arma Modelo'] = arma.armaModelo;
          if (arma.armaCalibre) fila['Arma Calibre'] = arma.armaCalibre;
          if (arma.numeroSerie) fila['Número de Serie'] = arma.numeroSerie;
          if (arma.estado) fila['Estado Arma'] = arma.estado;
          if (arma.cantidad) fila['Cantidad'] = arma.cantidad;
          const precioUnitario = parseFloat(arma.precioUnitario || '0');
          if (precioUnitario > 0) {
            fila['Precio Unitario'] = precioUnitario.toFixed(2);
            const cantidad = parseInt(arma.cantidad || '1');
            fila['Precio Total'] = (precioUnitario * cantidad * (1 + ivaDecimal)).toFixed(2);
          }
        }

        datosExportacion.push(fila);
      }
      
      // Crear worksheet con datos (XLSX manejará automáticamente las columnas presentes)
      const worksheet = XLSX.utils.json_to_sheet(datosExportacion);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
      
      // Ajustar ancho de columnas dinámicamente basado en las columnas presentes
      const columnWidths: { wch: number }[] = [];
      const maxCol = XLSX.utils.decode_range(worksheet['!ref'] || 'A1').e.c;
      for (let col = 0; col <= maxCol; col++) {
        const colLetter = XLSX.utils.encode_col(col);
        let maxWidth = 10;
        for (let row = 1; row <= datosExportacion.length; row++) {
          const cellAddress = colLetter + row;
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            const cellValue = String(cell.v);
            maxWidth = Math.max(maxWidth, Math.min(cellValue.length, 50));
          }
        }
        columnWidths.push({ wch: maxWidth });
      }
      worksheet['!cols'] = columnWidths;
      
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Clientes_Todos_${fecha}.xlsx`;
      
      XLSX.writeFile(workbook, nombreArchivo);

      alert(`✅ Exportación completada exitosamente!\n\nArchivo: ${nombreArchivo}\nTotal de clientes: ${datosExportacion.length}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error instanceof Error ? error.message : 'Error desconocido');
      alert(`❌ Error al exportar a Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, []);

  return { exportarClientesAExcel };
};

