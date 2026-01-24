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
  selectedWeapons: any[],
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
  setSelectedWeapons: (weapons: any[]) => void,
  setPrecioModificado: (precio: number) => void,
  setCantidad: (cantidad: number) => void,
  setClientFormData: (data: any) => void
) => {
  const handlePaymentComplete = useCallback(async (paymentData: any) => {
    // Prevenir múltiples submissions
    if ((handlePaymentComplete as any).isProcessing) {
      console.warn('⚠️ Ya hay un proceso de pago en ejecución, ignorando solicitud duplicada');
      return;
    }
    
    (handlePaymentComplete as any).isProcessing = true;
    
    try {
      if (!clientFormData) {
        throw new Error('No hay datos del cliente para procesar');
      }
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }
      const armasSeleccionadas = (paymentData?.armas && Array.isArray(paymentData.armas) && paymentData.armas.length > 0)
        ? paymentData.armas
        : (selectedWeapons && selectedWeapons.length > 0 ? selectedWeapons : []);
      if (!selectedWeapon && armasSeleccionadas.length === 0) {
        throw new Error('No hay arma seleccionada');
      }
      if (!paymentData) {
        throw new Error('No hay datos de pago');
      }
      
      const clienteDataToSend = { ...clientFormData };
      delete clienteDataToSend.id;
      
      const montoTotalCalculado = paymentData.total || Math.round((precioModificado * cantidad * 1.15) * 100) / 100;
      const pagoData = {
        clienteId: null,
        montoTotal: montoTotalCalculado,
        tipoPago: paymentData.tipoPago || 'CONTADO',
        numeroCuotas: paymentData.numeroCuotas || 1,
        montoCuota: paymentData.montoPorCuota || montoTotalCalculado,
        montoPagado: 0,
        montoPendiente: montoTotalCalculado
      };
      
      const numeroSerieDesdeRef = selectedSerieNumeroRef.current;
      const numeroSerieDesdePayment = paymentData.numeroSerie;
      const numeroSerieFinal = numeroSerieDesdeRef || numeroSerieDesdePayment || null;
      
      const armaData = armasSeleccionadas.length > 1
        ? null
        : (selectedWeapon ? {
          armaId: selectedWeapon.id,
          cantidad: cantidad,
          precioUnitario: precioModificado,
          numeroSerie: numeroSerieFinal
        } : (armasSeleccionadas.length === 1 ? {
          armaId: armasSeleccionadas[0].armaId ?? armasSeleccionadas[0].id,
          cantidad: armasSeleccionadas[0].cantidad ?? 1,
          precioUnitario: armasSeleccionadas[0].precioUnitario ?? precioModificado,
          numeroSerie: numeroSerieFinal
        } : null));
      
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
        armas: armasSeleccionadas,
        respuestas: (clientFormData.respuestas || []).map((respuesta: any) => ({
          ...respuesta,
          preguntaId: respuesta.questionId || respuesta.preguntaId || respuesta.id
        })),
        cuotas: cuotasData,
        documentos: documentosUsuario
      };
      
      const resultado = await apiService.createCliente(requestData as any);
      
      // Si llegamos aquí, el cliente se creó exitosamente
      const clienteId = (resultado as any).clienteId || resultado.id;
      console.log('✅ Cliente creado exitosamente con ID:', clienteId);
      
      // Subir documentos (si hay) - estos errores no deben fallar todo el proceso
      let erroresDocumentos = [];
      if (documentosUsuario && Object.keys(documentosUsuario).length > 0) {
        for (const [tipoDocumentoId, file] of Object.entries(documentosUsuario)) {
          try {
            await apiService.cargarDocumentoCliente(clienteId, parseInt(tipoDocumentoId), file as File);
            console.log(`✅ Documento ${tipoDocumentoId} subido exitosamente`);
          } catch (error) {
            console.error(`❌ Error subiendo documento ${tipoDocumentoId}:`, error);
            erroresDocumentos.push(`documento ${tipoDocumentoId}`);
          }
        }
      }
      
      // Mostrar mensaje apropiado
      if (erroresDocumentos.length > 0) {
        alert(`⚠️ Cliente creado exitosamente, pero hubo problemas subiendo algunos documentos: ${erroresDocumentos.join(', ')}. Puedes subirlos más tarde desde la gestión de documentos.`);
      } else {
        alert('🎉 ¡Proceso completado exitosamente! Cliente, arma, plan de pago creados y contrato enviado por email.');
      }
      
      // El backend asigna todas las armas enviadas en requestData.armas

      await loadClients(0);
      setCurrentPage('dashboard');
      setSelectedClient(null);
      setSelectedWeapon(null);
      setSelectedWeapons([]);
      setPrecioModificado(0);
      setCantidad(1);
      setClientFormData(null);
    } catch (error: any) {
      console.error('❌ Error procesando pago:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error desconocido al crear el cliente';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Si el error es de clave duplicada, mostrar mensaje más amigable
      if (errorMessage.includes('duplicate key') || errorMessage.includes('Ya existe un cliente')) {
        alert(`⚠️ Ya existe un cliente con estos datos.\n\n${errorMessage}\n\nSi acabas de crear el cliente, es posible que se haya duplicado el proceso. Verifica la lista de clientes.`);
      } else {
        alert(`❌ Error al crear el cliente: ${errorMessage}\n\nEl proceso se ha detenido y no se han guardado datos parciales.`);
      }
    } finally {
      // Liberar el flag de procesamiento
      (handlePaymentComplete as any).isProcessing = false;
    }
  }, [clientFormData, selectedWeapon, selectedWeapons, precioModificado, cantidad, user, selectedSerieNumeroRef, mapearProvinciaACodigo, provinciasCompletas, loadClients, setCurrentPage, setSelectedClient, setSelectedWeapon, setSelectedWeapons, setPrecioModificado, setCantidad, setClientFormData]);

  return { handlePaymentComplete };
};

