import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import DocumentUpload from '../../../components/common/DocumentUpload';

interface GrupoImportacionDetalleProps {
  grupoId: number;
  onVolver: () => void;
}

interface ResumenGrupo {
  grupoId: number;
  grupoNombre: string;
  grupoCodigo: string;
  clientesCiviles: number;
  clientesUniformados: number;
  clientesEmpresas: number;
  clientesDeportistas: number;
  totalClientes: number;
  fechaUltimaActualizacion: string;
}

interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion?: string;
  obligatorio: boolean;
}

interface DocumentoCargado {
  id: number;
  tipoDocumentoId: number;
  tipoDocumentoNombre: string;
  nombreArchivo: string;
  rutaArchivo: string;
  descripcion?: string;
  estado: string;
  fechaCarga: string;
}

const GrupoImportacionDetalle: React.FC<GrupoImportacionDetalleProps> = ({ grupoId, onVolver }) => {
  const [resumen, setResumen] = useState<ResumenGrupo | null>(null);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [documentosCargados, setDocumentosCargados] = useState<DocumentoCargado[]>([]);
  const [loading, setLoading] = useState(false);
  const [puedeNotificarPago, setPuedeNotificarPago] = useState(false);
  const [mostrarCargarDocumento, setMostrarCargarDocumento] = useState<number | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [descripcionDocumento, setDescripcionDocumento] = useState('');
  const [fechaLlegada, setFechaLlegada] = useState('');
  const [numeroPrevia, setNumeroPrevia] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [grupoId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resumenData, tiposData, documentosData, puedeNotificarData] = await Promise.all([
        apiService.getGrupoResumen(grupoId),
        apiService.getTiposDocumentoGruposImportacion(),
        apiService.getDocumentosGrupo(grupoId),
        apiService.puedeNotificarPago(grupoId),
      ]);

      setResumen(resumenData);
      setTiposDocumento(tiposData);
      setDocumentosCargados(documentosData);
      setPuedeNotificarPago(puedeNotificarData.puedeNotificar);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos del grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleCargarDocumento = async (tipoDocumentoId: number) => {
    if (!archivoSeleccionado) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setLoading(true);

      // Si ya existe un documento de este tipo, eliminarlo primero
      const documentoExistente = obtenerDocumentoCargado(tipoDocumentoId);
      if (documentoExistente) {
        await apiService.eliminarDocumentoGrupo(grupoId, documentoExistente.id);
      }

      await apiService.cargarDocumentoGrupo(grupoId, tipoDocumentoId, archivoSeleccionado, descripcionDocumento);
      alert(documentoExistente ? 'Documento reemplazado exitosamente' : 'Documento cargado exitosamente');
      setArchivoSeleccionado(null);
      setDescripcionDocumento('');
      setMostrarCargarDocumento(null);
      cargarDatos();
    } catch (error) {
      console.error('Error cargando documento:', error);
      alert('Error al cargar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarDocumento = async (documentoId: number) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.eliminarDocumentoGrupo(grupoId, documentoId);
      alert('Documento eliminado exitosamente');
      cargarDatos();
    } catch (error) {
      console.error('Error eliminando documento:', error);
      alert('Error al eliminar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificarPago = async () => {
    if (!confirm('¿Confirmas que se realizó el pago a fábrica?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.notificarPagoFabrica(grupoId);
      alert('Pago a fábrica notificado exitosamente');
      cargarDatos();
    } catch (error: any) {
      console.error('Error notificando pago:', error);
      alert(error.message || 'Error al notificar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarFechaLlegada = async () => {
    if (!fechaLlegada) {
      alert('Por favor ingresa la fecha de llegada');
      return;
    }

    try {
      setLoading(true);
      await apiService.registrarFechaLlegada(grupoId, fechaLlegada);
      alert('Fecha de llegada registrada exitosamente');
      setFechaLlegada('');
      cargarDatos();
    } catch (error: any) {
      console.error('Error registrando fecha:', error);
      alert(error.message || 'Error al registrar la fecha de llegada');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarNumeroPrevia = async () => {
    if (!numeroPrevia.trim()) {
      alert('Por favor ingresa el número de previa importación');
      return;
    }

    try {
      setLoading(true);
      await apiService.registrarNumeroPrevia(grupoId, numeroPrevia);
      alert('Número de previa importación registrado exitosamente');
      setNumeroPrevia('');
      cargarDatos();
    } catch (error: any) {
      console.error('Error registrando número de previa:', error);
      alert(error.message || 'Error al registrar el número de previa');
    } finally {
      setLoading(false);
    }
  };

  const documentoEstaCargado = (tipoDocumentoId: number): boolean => {
    return documentosCargados.some(doc => doc.tipoDocumentoId === tipoDocumentoId);
  };

  const obtenerDocumentoCargado = (tipoDocumentoId: number): DocumentoCargado | undefined => {
    return documentosCargados.find(doc => doc.tipoDocumentoId === tipoDocumentoId);
  };

  if (loading && !resumen) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudo cargar la información del grupo</p>
        <button
          onClick={onVolver}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{resumen.grupoNombre}</h2>
          <p className="text-sm text-gray-500">Código: {resumen.grupoCodigo}</p>
        </div>
        <button
          onClick={onVolver}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Volver
        </button>
      </div>

      {/* Indicador de Progreso del Flujo */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Progreso del Flujo</h3>
        <div className="flex items-center gap-2">
          {/* Paso 1: Documentos Requeridos (1,2,3) */}
          <div className={`flex-1 h-2 rounded-full ${
            (documentosCargados.filter(doc => {
              const tipo = tiposDocumento.find(t => t.id === doc.tipoDocumentoId);
              return tipo && ['Proforma a fabrica para importacion', 'Solicitar carta inspeccion de rastrillo', 'Documento de resolucion de importacion'].includes(tipo.nombre);
            }).length === 3)
              ? 'bg-green-500'
              : documentosCargados.filter(doc => {
                  const tipo = tiposDocumento.find(t => t.id === doc.tipoDocumentoId);
                  return tipo && ['Proforma a fabrica para importacion', 'Solicitar carta inspeccion de rastrillo', 'Documento de resolucion de importacion'].includes(tipo.nombre);
                }).length > 0
              ? 'bg-yellow-500'
              : 'bg-gray-300'
          }`} title="Documentos Requeridos (1,2,3)">
            <div className="text-xs text-center mt-3 text-gray-600">
              {documentosCargados.filter(doc => {
                const tipo = tiposDocumento.find(t => t.id === doc.tipoDocumentoId);
                return tipo && ['Proforma a fabrica para importacion', 'Solicitar carta inspeccion de rastrillo', 'Documento de resolucion de importacion'].includes(tipo.nombre);
              }).length}/3 Docs
            </div>
          </div>
          
          {/* Paso 2: Notificar Pago */}
          <div className={`flex-1 h-2 rounded-full ${
            puedeNotificarPago ? 'bg-green-500' : 'bg-gray-300'
          }`} title="Notificar Pago a Fábrica">
            <div className="text-xs text-center mt-3 text-gray-600">
              {puedeNotificarPago ? '✓ Pago' : 'Pago'}
            </div>
          </div>
          
          {/* Paso 3: Documentos Adicionales (4,5,6,7) */}
          <div className={`flex-1 h-2 rounded-full ${
            documentosCargados.length >= 4 ? 'bg-green-500' : documentosCargados.length > 3 ? 'bg-yellow-500' : 'bg-gray-300'
          }`} title="Documentos Adicionales">
            <div className="text-xs text-center mt-3 text-gray-600">
              {documentosCargados.length}/7 Docs
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          {puedeNotificarPago 
            ? '✅ Listo para notificar pago a fábrica' 
            : `⚠️ Faltan ${3 - (documentosCargados.filter(doc => {
                const tipo = tiposDocumento.find(t => t.id === doc.tipoDocumentoId);
                return tipo && ['Proforma a fabrica para importacion', 'Solicitar carta inspeccion de rastrillo', 'Documento de resolucion de importacion'].includes(tipo.nombre);
              }).length)} documento(s) requerido(s) para notificar pago`}
        </div>
      </div>

      {/* Resumen de Clientes */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-blue-600 text-sm font-medium mb-1">Civiles</p>
          <p className="text-2xl font-bold text-blue-800">{resumen.clientesCiviles}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-green-600 text-sm font-medium mb-1">Uniformados</p>
          <p className="text-2xl font-bold text-green-800">{resumen.clientesUniformados}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-purple-600 text-sm font-medium mb-1">Empresas</p>
          <p className="text-2xl font-bold text-purple-800">{resumen.clientesEmpresas}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-orange-600 text-sm font-medium mb-1">Deportistas</p>
          <p className="text-2xl font-bold text-orange-800">{resumen.clientesDeportistas}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-800">{resumen.totalClientes}</p>
        </div>
      </div>

      {/* Documentos Requeridos */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📄 Documentos Requeridos</h3>
        <div className="space-y-4">
          {tiposDocumento.map((tipo) => {
            const cargado = documentoEstaCargado(tipo.id);
            const documento = obtenerDocumentoCargado(tipo.id);
            const mostrarFormulario = mostrarCargarDocumento === tipo.id;

            return (
              <div
                key={tipo.id}
                className={`border rounded-lg p-4 ${
                  cargado ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{tipo.nombre}</h4>
                      {cargado ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          ✓ Cargado
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Pendiente
                        </span>
                      )}
                    </div>
                    {tipo.descripcion && (
                      <p className="text-sm text-gray-600 mb-2">{tipo.descripcion}</p>
                    )}
                    {documento && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          <strong>Archivo:</strong> {documento.nombreArchivo}
                        </p>
                        <p className="text-xs text-gray-500">
                          Cargado: {new Date(documento.fechaCarga).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {cargado && documento ? (
                      <>
                        <button
                          onClick={() => {
                            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                            window.open(`${API_BASE_URL}${documento.rutaArchivo}`, '_blank');
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Ver Documento
                        </button>
                        <button
                          onClick={() => setMostrarCargarDocumento(mostrarFormulario ? null : tipo.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          {mostrarFormulario ? 'Cancelar' : 'Reemplazar'}
                        </button>
                        <button
                          onClick={() => handleEliminarDocumento(documento.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setMostrarCargarDocumento(mostrarFormulario ? null : tipo.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        {mostrarFormulario ? 'Cancelar' : 'Cargar Documento'}
                      </button>
                    )}
                  </div>
                </div>

                {mostrarFormulario && (
                  <div className="mt-4 border-t pt-4">
                    <DocumentUpload
                      label={cargado ? "Seleccionar nuevo archivo (reemplazará el actual)" : "Seleccionar archivo"}
                      name={`documento-${tipo.id}`}
                      onChange={(file) => setArchivoSeleccionado(file || null)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      maxSize={10}
                    />
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción (opcional)
                      </label>
                      <textarea
                        value={descripcionDocumento}
                        onChange={(e) => setDescripcionDocumento(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={2}
                        placeholder="Descripción del documento..."
                      />
                    </div>
                    <button
                      onClick={() => handleCargarDocumento(tipo.id)}
                      disabled={!archivoSeleccionado || loading}
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Cargando...' : (cargado ? 'Reemplazar Documento' : 'Subir Documento')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Acciones */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Acciones</h3>
        <div className="space-y-4">
          {/* Notificar Pago a Fábrica */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h4 className="font-medium text-gray-900">Notificar Pago a Fábrica</h4>
              <p className="text-sm text-gray-600">
                {puedeNotificarPago
                  ? 'Todos los documentos requeridos están cargados. Puedes notificar el pago.'
                  : 'Faltan documentos requeridos (1, 2, 3) para notificar el pago.'}
              </p>
            </div>
            <button
              onClick={handleNotificarPago}
              disabled={!puedeNotificarPago || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Notificar Pago
            </button>
          </div>

          {/* Registrar Fecha de Llegada */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex-1 mr-4">
              <h4 className="font-medium text-gray-900 mb-2">Registrar Fecha Aproximada de Llegada</h4>
              <input
                type="date"
                value={fechaLlegada}
                onChange={(e) => setFechaLlegada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={handleRegistrarFechaLlegada}
              disabled={!fechaLlegada || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Registrar Fecha
            </button>
          </div>

          {/* Registrar Número de Previa */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex-1 mr-4">
              <h4 className="font-medium text-gray-900 mb-2">Registrar Número de Previa Importación</h4>
              <input
                type="text"
                value={numeroPrevia}
                onChange={(e) => setNumeroPrevia(e.target.value)}
                placeholder="Número de previa importación"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={handleRegistrarNumeroPrevia}
              disabled={!numeroPrevia.trim() || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              Registrar Número
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrupoImportacionDetalle;

