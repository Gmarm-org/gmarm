import { useState, useCallback } from 'react';
import { apiService } from '../../../services/api';
import { mapTipoIdentificacionToCode } from '../../../utils/typeMappers';
import { validateClientForm } from '../utils/clientFormValidation';
import type { Client, Weapon } from '../types';

interface RequiredDocument {
  id: number;
  nombre: string;
}

interface UseClientSubmitProps {
  mode: 'create' | 'edit' | 'view';
  client?: Client | null;
  formData: any;
  getCodigoTipoCliente: (tipo: string | undefined) => string;
  userId?: string | number;
  uploadedDocuments: Record<string, File>;
  loadedDocuments: Record<string, any>;
  requiredDocuments: RequiredDocument[];
  currentSelectedWeapon: Weapon | null;
  precioModificado: number;
  cantidad: number;
  documentStatus: string;
  clienteBloqueado: boolean;
  motivoBloqueo: string;
  edadValida: boolean;
  isMilitaryType: boolean;
  isPoliceType: boolean;
  clienteArmaIdDelStock: number | null;
  setClienteArmaIdDelStock: (id: number | null) => void;
  setLoadedDocuments: (docs: Record<string, any>) => void;
  onSave: (client: Client) => void;
  onConfirmData?: (formData: any) => void;
  onNavigateToWeaponSelection?: () => void;
  onClienteBloqueado?: (clientId: string, bloqueado: boolean, motivo: string) => void;
}

export function useClientSubmit(props: UseClientSubmitProps) {
  const {
    mode, client, formData, getCodigoTipoCliente, userId,
    uploadedDocuments, loadedDocuments, requiredDocuments,
    currentSelectedWeapon, precioModificado, cantidad,
    documentStatus, clienteBloqueado, motivoBloqueo, edadValida,
    isMilitaryType, isPoliceType,
    clienteArmaIdDelStock, setClienteArmaIdDelStock, setLoadedDocuments,
    onSave, onConfirmData, onNavigateToWeaponSelection, onClienteBloqueado
  } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const buildClientDataForBackend = useCallback(() => {
    return {
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      numeroIdentificacion: formData.numeroIdentificacion,
      tipoIdentificacionCodigo: mapTipoIdentificacionToCode(formData.tipoIdentificacion),
      tipoClienteCodigo: getCodigoTipoCliente(formData.tipoCliente),
      fechaNacimiento: formData.fechaNacimiento,
      direccion: formData.direccion,
      provincia: formData.provincia,
      canton: formData.canton,
      email: formData.email,
      telefonoPrincipal: formData.telefonoPrincipal,
      telefonoSecundario: formData.telefonoSecundario,
      representanteLegal: formData.representanteLegal || '',
      ruc: formData.ruc || '',
      nombreEmpresa: formData.nombreEmpresa || '',
      direccionFiscal: formData.direccionFiscal || '',
      telefonoReferencia: formData.telefonoReferencia || '',
      correoEmpresa: formData.correoEmpresa || '',
      provinciaEmpresa: formData.provinciaEmpresa || '',
      cantonEmpresa: formData.cantonEmpresa || '',
      estadoMilitar: formData.estadoMilitar && formData.estadoMilitar.trim() !== '' ? formData.estadoMilitar : undefined,
      codigoIssfa: formData.codigoIssfa || '',
      codigoIsspol: formData.codigoIsspol || '',
      rango: formData.rango || '',
      usuarioCreadorId: userId
    };
  }, [formData, getCodigoTipoCliente, userId]);

  const resolveDocumentoId = useCallback((key: string, file: File) => {
    const parsedId = parseInt(key);
    if (!Number.isNaN(parsedId)) {
      const docById = requiredDocuments.find(doc => doc.id.toString() === key);
      return { tipoDocumentoId: parsedId, documentNombre: docById?.nombre || key };
    }

    const documentoEncontrado = requiredDocuments.find(doc => doc.nombre === key || doc.id.toString() === key);
    if (documentoEncontrado) {
      return { tipoDocumentoId: documentoEncontrado.id, documentNombre: documentoEncontrado.nombre };
    }

    const numericEntry = Object.entries(uploadedDocuments).find(([k, v]) => {
      const numericId = parseInt(k);
      return !Number.isNaN(numericId) && v === file;
    });

    if (numericEntry) {
      return { tipoDocumentoId: parseInt(numericEntry[0]), documentNombre: key };
    }

    return { tipoDocumentoId: null as number | null, documentNombre: key };
  }, [requiredDocuments, uploadedDocuments]);

  const determineClientStatus = useCallback(() => {
    let clientStatus = 'PENDIENTE_DOCUMENTOS';
    if (clienteBloqueado) {
      clientStatus = 'BLOQUEADO';
    } else if (!edadValida) {
      clientStatus = 'INHABILITADO_COMPRA';
    } else if (documentStatus === 'complete') {
      clientStatus = 'LISTO_IMPORTACION';
    }
    return clientStatus;
  }, [clienteBloqueado, edadValida, documentStatus]);

  /** Upload documents for a given clienteId. Returns array of error strings. */
  const uploadDocuments = useCallback(async (clienteId: number, isEditMode: boolean): Promise<string[]> => {
    const documentErrors: string[] = [];
    if (Object.keys(uploadedDocuments).length === 0) return documentErrors;

    const documentosSubidos = new Set<string>();

    for (const [key, file] of Object.entries(uploadedDocuments)) {
      const { tipoDocumentoId, documentNombre } = resolveDocumentoId(key, file);

      if (!tipoDocumentoId) {
        // No se pudo determinar el ID del documento
        if (requiredDocuments.length > 0) {
          documentErrors.push(`Documento ${documentNombre}`);
        }
        continue;
      }

      if (documentosSubidos.has(tipoDocumentoId.toString())) {
        continue;
      }
      documentosSubidos.add(tipoDocumentoId.toString());

      try {
        if (isEditMode) {
          const documentoExistente = loadedDocuments[documentNombre];
          if (documentoExistente && documentoExistente.id) {
            const usuarioId = 1; // TODO: Obtener del contexto de autenticación
            await apiService.actualizarDocumentoCliente(documentoExistente.id, file, undefined, usuarioId);
          } else {
            await apiService.cargarDocumentoCliente(clienteId, tipoDocumentoId, file);
          }
        } else {
          await apiService.cargarDocumentoCliente(clienteId, tipoDocumentoId, file);
        }
      } catch (error: any) {
        const statusCode = error?.response?.status || error?.status;
        if (statusCode === 201 || statusCode === 200) {
          // Document saved despite parse error
          continue;
        }
        let errorMsg = error?.responseData?.message || error?.response?.data?.message || 'Error desconocido';
        if (statusCode === 400) {
          errorMsg = 'El archivo excede el tamaño máximo permitido (10MB)';
        } else if (statusCode === 500) {
          errorMsg = 'Error del servidor al subir el archivo';
        }
        documentErrors.push(`${documentNombre}: ${errorMsg}`);
      }
    }
    return documentErrors;
  }, [uploadedDocuments, loadedDocuments, requiredDocuments, resolveDocumentoId]);

  /** Handle weapon assignment for edit mode */
  const handleWeaponAssignmentEdit = useCallback(async (clienteId: number): Promise<string | null> => {
    if (!currentSelectedWeapon) return null;

    try {
      const reservasExistentes = await apiService.getArmasCliente(clienteId);
      const reservasActivas = reservasExistentes?.filter((reserva: any) =>
        reserva.estado !== 'CANCELADA' && reserva.estado !== 'COMPLETADA'
      ) || [];

      const armaYaReservada = reservasActivas.some((reserva: any) =>
        reserva.armaId === parseInt(currentSelectedWeapon.id.toString()) ||
        reserva.arma?.id === parseInt(currentSelectedWeapon.id.toString())
      );

      if (!armaYaReservada) {
        const precioTotal = precioModificado * cantidad;
        await apiService.crearReservaArma(
          clienteId,
          parseInt(currentSelectedWeapon.id.toString()),
          cantidad,
          precioModificado,
          precioTotal
        );
      }
      return null;
    } catch (error: any) {
      const errorResponse = error?.response?.data;
      const errorMessage = errorResponse?.message || errorResponse?.error || error?.message || '';
      const statusCode = error?.response?.status || error?.status;

      if (statusCode === 404 && errorMessage.includes('reserva')) {
        try {
          const precioTotal = precioModificado * cantidad;
          await apiService.crearReservaArma(
            clienteId,
            parseInt(currentSelectedWeapon.id.toString()),
            cantidad,
            precioModificado,
            precioTotal
          );
          return null;
        } catch (retryError: any) {
          const retryMessage = retryError?.response?.data?.message || retryError?.message || '';
          if (retryMessage.includes('ya está asignada') || retryMessage.includes('ya existe') || retryMessage.includes('Ya existe una reserva')) {
            return null;
          }
          return retryMessage || 'Error al asignar arma';
        }
      } else if (errorMessage.includes('ya está asignada') || errorMessage.includes('ya existe') || errorMessage.includes('Ya existe una reserva')) {
        return null;
      }
      return errorMessage || 'Error desconocido';
    }
  }, [currentSelectedWeapon, precioModificado, cantidad]);

  /** Reload documents into state after successful upload */
  const reloadDocuments = useCallback(async (clienteId: number) => {
    try {
      const documentos = await apiService.getDocumentosCliente(clienteId);
      const documentosMap: Record<string, any> = {};
      if (Array.isArray(documentos)) {
        documentos.forEach((doc: any) => {
          if (doc.tipoDocumentoNombre && doc.rutaArchivo && doc.estado === 'CARGADO' && doc.id) {
            documentosMap[doc.tipoDocumentoNombre] = {
              id: doc.id,
              nombre: doc.tipoDocumentoNombre,
              url: doc.rutaArchivo,
              tipo: doc.tipoArchivo || 'application/pdf',
              estado: doc.estado,
              nombreArchivo: doc.nombreArchivo,
              fechaCarga: doc.fechaCarga
            };
          }
        });
      }
      setLoadedDocuments(documentosMap);
    } catch (err) {
      console.error('Error recargando documentos:', err instanceof Error ? err.message : 'Unknown error');
    }
  }, [setLoadedDocuments]);

  /** Submit handler for edit mode */
  const submitEdit = useCallback(async (clientStatus: string, clientDataForBackend: any) => {
    if (!client) throw new Error('No client for edit');

    const clienteOriginalBackend = {
      nombres: client.nombres,
      apellidos: client.apellidos,
      numeroIdentificacion: client.numeroIdentificacion,
      tipoIdentificacionCodigo: mapTipoIdentificacionToCode(client.tipoIdentificacion),
      tipoClienteCodigo: getCodigoTipoCliente(client.tipoCliente),
      fechaNacimiento: client.fechaNacimiento,
      direccion: client.direccion,
      provincia: client.provincia,
      canton: client.canton,
      email: client.email,
      telefonoPrincipal: client.telefonoPrincipal,
      telefonoSecundario: client.telefonoSecundario,
      representanteLegal: (client as any).representanteLegal || '',
      ruc: (client as any).ruc || '',
      nombreEmpresa: (client as any).nombreEmpresa || '',
      direccionFiscal: (client as any).direccionFiscal || '',
      telefonoReferencia: (client as any).telefonoReferencia || '',
      correoEmpresa: (client as any).correoEmpresa || '',
      provinciaEmpresa: (client as any).provinciaEmpresa || '',
      cantonEmpresa: (client as any).cantonEmpresa || '',
      estadoMilitar: (client as any).estadoMilitar || undefined,
      codigoIssfa: (client as any).codigoIssfa || '',
      codigoIsspol: (client as any).codigoIsspol || '',
      rango: (client as any).rango || ''
    };

    const cambiosCliente: any = {};
    Object.keys(clientDataForBackend).forEach(campo => {
      if (campo === 'usuarioCreadorId') return;
      const valorOriginal = clienteOriginalBackend[campo as keyof typeof clienteOriginalBackend];
      const valorNuevo = clientDataForBackend[campo as keyof typeof clientDataForBackend];
      const valorOriginalNormalizado = valorOriginal === undefined || valorOriginal === null ? '' : String(valorOriginal);
      const valorNuevoNormalizado = valorNuevo === undefined || valorNuevo === null ? '' : String(valorNuevo);
      if (valorNuevoNormalizado !== valorOriginalNormalizado) {
        cambiosCliente[campo] = valorNuevo;
      }
    });

    if (clientStatus !== client.estado) {
      cambiosCliente.estado = clientStatus;
    }

    const requestDataForBackend: any = {};
    if (Object.keys(cambiosCliente).length > 0) {
      requestDataForBackend.cliente = { ...cambiosCliente, id: client.id };
    }

    const respuestasActuales = (formData.respuestas || []).filter((r: any) => r.respuesta && r.respuesta.trim() !== '');
    if (respuestasActuales.length > 0) {
      requestDataForBackend.respuestas = respuestasActuales.map((r: any) => ({
        pregunta: r.pregunta,
        respuesta: r.respuesta,
        tipo: r.tipo || 'TEXTO',
        preguntaId: r.questionId || r.preguntaId || r.id || null
      }));
    }

    if (currentSelectedWeapon && !clienteArmaIdDelStock) {
      const precioTotal = precioModificado * cantidad;
      requestDataForBackend.arma = {
        armaId: parseInt(currentSelectedWeapon.id.toString()),
        cantidad: cantidad,
        precioUnitario: precioModificado,
        precioTotal: precioTotal
      };
    }

    const updateResponse: any = await apiService.patchCliente(parseInt(client.id.toString()), requestDataForBackend);

    let updatedClient: any;
    if (updateResponse && typeof updateResponse === 'object') {
      if ('cliente' in updateResponse && updateResponse.cliente) {
        updatedClient = updateResponse.cliente;
      } else if ('id' in updateResponse) {
        updatedClient = updateResponse;
      } else if ('clienteId' in updateResponse) {
        updatedClient = await apiService.getClienteById(updateResponse.clienteId);
      }
    }

    if (!updatedClient || (!updatedClient.id && !(updateResponse?.clienteId))) {
      throw new Error('No se recibió el cliente actualizado del servidor');
    }

    const clienteId = parseInt(updatedClient.id?.toString() || updateResponse?.clienteId?.toString() || client.id.toString());

    // Upload documents
    const documentErrors = await uploadDocuments(clienteId, true);

    // Handle weapon assignment
    let armaError: string | null = null;
    if (currentSelectedWeapon) {
      armaError = await handleWeaponAssignmentEdit(clienteId);
    }

    // Show result
    if (documentErrors.length > 0 || armaError) {
      const errores = [];
      if (documentErrors.length > 0) errores.push(`documentos: ${documentErrors.join(', ')}`);
      if (armaError) errores.push(`arma: ${armaError}`);
      alert(`Cliente actualizado exitosamente, pero hubo problemas con: ${errores.join(' y ')}. Puedes intentar subirlos nuevamente más tarde.`);
    } else {
      alert('Cliente actualizado exitosamente. Todos los datos, documentos y arma se guardaron correctamente.');
      await reloadDocuments(clienteId);
    }

    return updatedClient;
  }, [client, formData, getCodigoTipoCliente, currentSelectedWeapon, clienteArmaIdDelStock, precioModificado, cantidad, uploadDocuments, handleWeaponAssignmentEdit, reloadDocuments]);

  /** Submit handler for create mode */
  const submitCreate = useCallback(async (clientStatus: string, clientDataForBackend: any) => {
    const respuestasParaBackend = (formData.respuestas || [])
      .filter((r: any) => r.questionId && r.respuesta)
      .map((r: any) => ({
        preguntaId: r.questionId,
        respuesta: r.respuesta
      }));

    const requestData: any = {
      cliente: { ...clientDataForBackend, estado: clientStatus },
      respuestas: respuestasParaBackend
    };

    if (currentSelectedWeapon && !clienteArmaIdDelStock) {
      const precioTotal = precioModificado * cantidad;
      requestData.arma = {
        armaId: parseInt(currentSelectedWeapon.id.toString()),
        cantidad: cantidad,
        precioUnitario: precioModificado,
        precioTotal: precioTotal
      };
    }

    const response = await apiService.createCliente(requestData);

    // Reassign weapon from stock if applicable
    if (clienteArmaIdDelStock && currentSelectedWeapon) {
      const clienteId = (response as any).clienteId || (response as any).id;
      if (clienteId) {
        try {
          await apiService.reasignarArmaACliente(clienteArmaIdDelStock, parseInt(clienteId.toString()));
          setClienteArmaIdDelStock(null);
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido';
          if (errorMessage.includes('documentos obligatorios') || errorMessage.includes('documentos completos')) {
            alert(`No se pudo reasignar el arma del stock:\n\n${errorMessage}\n\nPor favor, carga todos los documentos obligatorios del cliente y vuelve a intentar.`);
          } else {
            // El arma del stock no se pudo reasignar, pero el cliente se creo correctamente
          }
        }
      }
    }

    if (response) {
      const clienteId = (response as any).clienteId || (response as any).id;

      // Upload documents
      if (Object.keys(uploadedDocuments).length > 0) {
        const documentErrors = await uploadDocuments(parseInt(clienteId.toString()), false);

        if (requiredDocuments.length > 0) {
          try {
            const documentosActualizados = await apiService.getDocumentosCliente(parseInt(clienteId.toString()));
            const documentosMap: Record<string, any> = {};
            if (Array.isArray(documentosActualizados)) {
              documentosActualizados.forEach((doc: any) => {
                if (doc.tipoDocumentoNombre && doc.rutaArchivo && doc.estado === 'CARGADO' && doc.id) {
                  documentosMap[doc.tipoDocumentoNombre] = doc;
                }
              });
            }
            const documentosFaltantes = requiredDocuments.filter(doc => {
              const porNombre = documentosMap[doc.nombre];
              const porUploaded = uploadedDocuments[doc.nombre] || uploadedDocuments[doc.id?.toString?.() || ''];
              return !porNombre && !porUploaded;
            });
            if (documentosFaltantes.length > 0) {
              const nombres = documentosFaltantes.map(doc => doc.nombre).join(', ');
              alert(`Cliente creado exitosamente, pero faltan documentos por subir: ${nombres}. Puedes subirlos más tarde.`);
            }
          } catch (verificarError) {
            console.error('Error verificando documentos despues de la carga:', verificarError instanceof Error ? verificarError.message : 'Unknown error');
          }
        } else if (documentErrors.length > 0) {
          // Hubo errores al subir algunos documentos
        }
      }

      alert('Cliente creado exitosamente con todos los datos.');
      return response as any;
    }

    return null;
  }, [formData, currentSelectedWeapon, clienteArmaIdDelStock, precioModificado, cantidad, uploadedDocuments, requiredDocuments, uploadDocuments, setClienteArmaIdDelStock]);

  /** Main submit handler */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!validateClientForm(formData, { isMilitaryType, isPoliceType })) {
        alert('Por favor, corrija los errores en el formulario antes de continuar.');
        return;
      }

      // Validate unique identification (create mode only)
      if (mode === 'create' && formData.numeroIdentificacion) {
        try {
          const validacion = await apiService.validarIdentificacion(formData.numeroIdentificacion);
          if (validacion.existe) {
            setIsSubmitting(false);
            alert(`${validacion.mensaje}\n\nSi desea ver o editar este cliente, búsquelo en la lista de clientes.`);
            return;
          }
        } catch (_validacionError) {
          // No se pudo validar la identificacion, continuando
        }
      }

      const clientStatus = determineClientStatus();
      const clientDataForBackend = buildClientDataForBackend();

      let updatedClient: any;
      if (mode === 'edit' && client) {
        updatedClient = await submitEdit(clientStatus, clientDataForBackend);
      } else {
        updatedClient = await submitCreate(clientStatus, clientDataForBackend);
      }

      if (!updatedClient) {
        setIsSubmitting(false);
        alert('Error: No se pudo obtener el cliente actualizado. Por favor, intente nuevamente.');
        return;
      }

      // Notify parent about block status
      if (clienteBloqueado) {
        onClienteBloqueado?.(updatedClient.id.toString(), true, motivoBloqueo);
      } else if (client && (client as any).estado === 'BLOQUEADO' && !clienteBloqueado) {
        onClienteBloqueado?.(updatedClient.id.toString(), false, '');
      }

      // Navigate or save
      if (clientStatus === 'LISTO_IMPORTACION') {
        if (onConfirmData && updatedClient) {
          const clientDataWithId = {
            ...formData,
            ...updatedClient,
            id: updatedClient.id.toString()
          };
          onConfirmData(clientDataWithId);
        } else {
          onNavigateToWeaponSelection?.();
        }
      } else {
        onSave(updatedClient as any);
      }
    } catch (error: any) {
      console.error('Error al guardar cliente:', error instanceof Error ? error.message : 'Unknown error');
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Error desconocido';
      const statusCode = error?.response?.status || error?.status;

      let userMessage = 'Error al guardar el cliente. Por favor, intente nuevamente.';
      if (statusCode === 400) {
        userMessage = `Error de validación: ${errorMessage}`;
      } else if (statusCode === 403) {
        userMessage = `Error de permisos: ${errorMessage}`;
      } else if (statusCode === 404) {
        userMessage = `Recurso no encontrado: ${errorMessage}`;
      } else if (statusCode === 500) {
        userMessage = `Error del servidor: ${errorMessage}`;
      } else if (errorMessage && errorMessage !== 'Error desconocido') {
        userMessage = `Error: ${errorMessage}`;
      }

      alert(userMessage);
      return;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, formData, isMilitaryType, isPoliceType, mode, client,
    determineClientStatus, buildClientDataForBackend, submitEdit, submitCreate,
    clienteBloqueado, motivoBloqueo, onClienteBloqueado, onConfirmData,
    onNavigateToWeaponSelection, onSave
  ]);

  return {
    handleSubmit,
    isSubmitting,
    buildClientDataForBackend,
    validateForm: () => validateClientForm(formData, { isMilitaryType, isPoliceType }),
    canContinueWithWeapons: () => {
      if (!validateClientForm(formData, { isMilitaryType, isPoliceType })) return false;
      if (clienteBloqueado) return false;
      if (!edadValida) return false;
      return true;
    }
  };
}
