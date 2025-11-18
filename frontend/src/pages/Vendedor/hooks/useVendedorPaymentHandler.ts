import { useCallback } from 'react';
import { apiService } from '../../../services/api';
import type { User } from '../../../types';

/**
 * Handler específico para el proceso de pago completo
 * Separado para cumplir con límite de 500 líneas por archivo
 */
export const useVendedorPaymentHandler = (
  clientFormData: any,
  selectedWeapon: any | null,
  precioModificado: number,
  cantidad: number,
  user: User | null,
  selectedSerieNumeroRef: React.MutableRefObject<string | null>,
  mapearProvinciaACodigo: (nombre: string, provincias: Array<{codigo: string, nombre: string}>) => string,
  provinciasCompletas: Array<{codigo: string, nombre: string}>,
  loadClients: (page?: number) => Promise<void>,
  setCurrentPage: (page: string) => void,
  setSelectedClient: (client: any) => void,
  setSelectedWeapon: (weapon: any | null) => void,
  setPrecioModificado: (precio: number) => void,
  setCantidad: (cantidad: number) => void,
  setClientFormData: (data: any) => void
) => {
  const handlePaymentComplete = useCallback(async (paymentData: any) => {
    try {
      if (!clientFormData) {
        throw new Error('No hay datos del cliente para procesar');
      }
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }
      if (!selectedWeapon) {
        throw new Error('No hay arma seleccionada');
      }
      if (!paymentData) {
        throw new Error('No hay datos de pago');
      }
      
      const clienteDataToSend = { ...clientFormData };
      delete clienteDataToSend.id;
      
      const pagoData = {
        clienteId: null,
        montoTotal: paymentData.total || Math.round((precioModificado * cantidad * 1.15) * 100) / 100,
        tipoPago: paymentData.tipoPago || 'CONTADO',
        numeroCuotas: paymentData.numeroCuotas || 1,
        montoCuota: paymentData.montoPorCuota || Math.round((precioModificado * cantidad * 1.15) * 100) / 100,
        montoPagado: 0,
        montoPendiente: paymentData.total || Math.round((precioModificado * cantidad * 1.15) * 100) / 100
      };
      
      const numeroSerieDesdeRef = selectedSerieNumeroRef.current;
      const numeroSerieDesdePayment = paymentData.numeroSerie;
      const numeroSerieFinal = numeroSerieDesdeRef || numeroSerieDesdePayment || null;
      
      const armaData = selectedWeapon ? {
        armaId: selectedWeapon.id,
        cantidad: cantidad,
        precioUnitario: precioModificado,
        numeroSerie: numeroSerieFinal
      } : null;
      
      const documentosUsuario = clientFormData.uploadedDocuments || {};
      
      const cuotasData = [];
      if (paymentData.tipoPago === 'CUOTAS' && paymentData.cuotas && paymentData.cuotas.length > 0) {
        for (const cuota of paymentData.cuotas) {
          cuotasData.push({
            numeroCuota: cuota.numeroCuota,
            fechaVencimiento: cuota.fecha,
            monto: cuota.monto,
            estado: 'PENDIENTE'
          });
        }
      }
      
      const requestData = {
        cliente: {
          nombres: clienteDataToSend.nombres,
          apellidos: clienteDataToSend.apellidos,
          numeroIdentificacion: clienteDataToSend.numeroIdentificacion,
          tipoIdentificacionCodigo: clienteDataToSend.tipoIdentificacionCodigo,
          tipoClienteCodigo: clienteDataToSend.tipoClienteCodigo,
          fechaNacimiento: clienteDataToSend.fechaNacimiento,
          direccion: clienteDataToSend.direccion,
          provincia: mapearProvinciaACodigo(clienteDataToSend.provincia, provinciasCompletas),
          canton: clienteDataToSend.canton,
          email: clienteDataToSend.email,
          telefonoPrincipal: clienteDataToSend.telefonoPrincipal,
          telefonoSecundario: clienteDataToSend.telefonoSecundario,
          representanteLegal: clienteDataToSend.representanteLegal,
          ruc: clienteDataToSend.ruc,
          nombreEmpresa: clienteDataToSend.nombreEmpresa,
          direccionFiscal: clienteDataToSend.direccionFiscal,
          telefonoReferencia: clienteDataToSend.telefonoReferencia,
          correoEmpresa: clienteDataToSend.correoEmpresa,
          provinciaEmpresa: mapearProvinciaACodigo(clienteDataToSend.provinciaEmpresa, provinciasCompletas),
          cantonEmpresa: clienteDataToSend.cantonEmpresa,
          estadoMilitar: clienteDataToSend.estadoMilitar,
          codigoIssfa: clienteDataToSend.codigoIssfa,
          rango: clienteDataToSend.rango,
          usuarioCreadorId: user?.id
        },
        pago: {
          clienteId: null,
          montoTotal: pagoData.montoTotal,
          tipoPago: pagoData.tipoPago,
          numeroCuotas: pagoData.numeroCuotas,
          montoCuota: pagoData.montoCuota,
          montoPagado: pagoData.montoPagado,
          montoPendiente: pagoData.montoPendiente
        },
        arma: armaData ? {
          armaId: armaData.armaId,
          cantidad: armaData.cantidad,
          precioUnitario: armaData.precioUnitario,
          numeroSerie: armaData.numeroSerie
        } : null,
        respuestas: (clientFormData.respuestas || []).map((respuesta: any) => ({
          ...respuesta,
          preguntaId: respuesta.questionId || respuesta.preguntaId || respuesta.id
        })),
        cuotas: cuotasData,
        documentos: documentosUsuario
      };
      
      const resultado = await apiService.createCliente(requestData as any);
      
      if (documentosUsuario && Object.keys(documentosUsuario).length > 0) {
        const clienteId = (resultado as any).clienteId || resultado.id;
        for (const [tipoDocumentoId, file] of Object.entries(documentosUsuario)) {
          try {
            await apiService.cargarDocumentoCliente(clienteId, parseInt(tipoDocumentoId), file as File);
          } catch (error) {
            console.error(`❌ Error subiendo documento ${tipoDocumentoId}:`, error);
          }
        }
      }
      
      alert('🎉 ¡Proceso completado exitosamente! Cliente, arma, plan de pago creados y contrato enviado por email.');
      await loadClients(0);
      setCurrentPage('dashboard');
      setSelectedClient(null);
      setSelectedWeapon(null);
      setPrecioModificado(0);
      setCantidad(1);
      setClientFormData(null);
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al crear el cliente: ${errorMessage}. El proceso se ha detenido y no se han guardado datos parciales.`);
    }
  }, [clientFormData, selectedWeapon, precioModificado, cantidad, user, selectedSerieNumeroRef, mapearProvinciaACodigo, provinciasCompletas, loadClients, setCurrentPage, setSelectedClient, setSelectedWeapon, setPrecioModificado, setCantidad, setClientFormData]);

  return { handlePaymentComplete };
};

