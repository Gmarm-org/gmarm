import React from 'react';

interface ClientViewSectionsProps {
  loadedContratos: any[];
  loadedArmas: any[];
  loadedPagos: any[];
  loadedDocuments?: Record<string, any>;
  requiredDocuments?: any[];
  ivaDecimal: number;
  ivaPorcentaje: number;
  emailVerificado?: boolean | null; // true = Validado, false = Datos incorrectos, null/undefined = Pendiente
  grupoImportacionNombre?: string; // Nombre del grupo de importación activo
  licenciaNombre?: string; // Nombre de la licencia del grupo de importación
  licenciaNumero?: string; // Número de la licencia del grupo de importación
}

export const ClientViewSections: React.FC<ClientViewSectionsProps> = ({
  loadedContratos,
  loadedArmas,
  loadedPagos,
  loadedDocuments = {},
  requiredDocuments = [],
  ivaDecimal,
  ivaPorcentaje,
  emailVerificado,
  grupoImportacionNombre,
  licenciaNombre,
  licenciaNumero
}) => {
  return (
    <>
      {/* Sección de Información de Importación */}
      {(grupoImportacionNombre || licenciaNombre) && (
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Información de Importación</h2>
              <p className="text-sm text-gray-600 mt-1">Grupo de importación y licencia asignada</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border-2 border-purple-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            {grupoImportacionNombre && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Grupo de Importación</p>
                <p className="text-lg font-semibold text-blue-600">{grupoImportacionNombre}</p>
              </div>
            )}
            {licenciaNombre && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Licencia</p>
                <p className="text-lg font-semibold text-purple-600">{licenciaNombre}</p>
                {licenciaNumero && (
                  <p className="text-sm text-gray-500 mt-1">Número: {licenciaNumero}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección de Validación de Cliente */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-6">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Validación de Datos Personales</h2>
            <p className="text-sm text-gray-600 mt-1">Estado de validación de datos por el cliente</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">Estado de Validación:</span>
            {emailVerificado === true ? (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Validado
              </span>
            ) : emailVerificado === false ? (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Datos incorrectos
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Pendiente
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sección de Documentos Cargados */}
      {(requiredDocuments.length > 0 || Object.keys(loadedDocuments).length > 0) && (
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200 mb-6">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Documentos del Cliente</h2>
              <p className="text-sm text-gray-600 mt-1">Documentos cargados durante el proceso</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredDocuments.map((document) => {
              const loadedDoc = loadedDocuments[document.nombre];
              return (
                <div key={document.id} className="bg-white p-4 rounded-xl border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{document.nombre}</h3>
                    {loadedDoc?.id && loadedDoc?.estado === 'CARGADO' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Cargado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ⏳ Pendiente
                      </span>
                    )}
                  </div>
                  
                  {loadedDoc?.id && (
                    <div className="mb-3">
                      <iframe
                        src={`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve/${loadedDoc.id}`}
                        className="w-full h-64 border border-gray-300 rounded-lg"
                        title={`Previsualización de ${document.nombre}`}
                        onError={(e) => {
                          console.error('❌ Error cargando documento en iframe:', e, loadedDoc);
                        }}
                        onLoad={() => {
                          console.log('✅ Documento cargado exitosamente en iframe:', loadedDoc);
                        }}
                      />
                      <div className="mt-2 flex justify-end">
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve/${loadedDoc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                          Abrir en Nueva Pestaña
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Sección de Contratos Generados */}
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
        <div className="flex items-center mb-6">
          <div className="bg-purple-100 p-3 rounded-full mr-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contratos Generados</h2>
            <p className="text-sm text-gray-600 mt-1">Documentos generados al finalizar el proceso de creación del cliente</p>
          </div>
        </div>
        
        {loadedContratos.length > 0 ? (
          <div className="space-y-4">
            {loadedContratos.map((contrato, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border-2 border-purple-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{contrato.nombreArchivo}</h3>
                    <p className="text-sm text-gray-500 mb-3">{contrato.descripcion}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        📄 Contrato
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Generado
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Previsualización del contrato */}
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <iframe
                      src={`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve-generated/${contrato.id}`}
                      className="w-full h-96 rounded-lg border-0"
                      title={`Previsualización de ${contrato.nombreArchivo}`}
                    />
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve-generated/${contrato.id}`, '_blank')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Ver Contrato</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve-generated/${contrato.id}`;
                      link.download = contrato.nombreArchivo;
                      link.click();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-300 text-center">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay contratos generados</h3>
            <p className="text-gray-500 mb-4">Los contratos se generarán automáticamente al finalizar el proceso de creación del cliente.</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pendiente de generación
            </div>
          </div>
        )}
      </div>

      {/* Sección de Armas Asignadas */}
      {loadedArmas.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Armas Asignadas</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadedArmas.map((arma, index) => {
              const precioSinIva = parseFloat(arma.precioUnitario) || 0;
              const cantidad = parseInt(arma.cantidad) || 0;
              const subtotal = precioSinIva * cantidad;
              const ivaArma = subtotal * ivaDecimal;
              const totalConIva = subtotal + ivaArma;
              
              return (
                <div key={index} className="bg-white p-4 rounded-xl border-2 border-blue-200">
                  <div className="flex items-start space-x-4">
                    {/* Imagen del arma */}
                    {arma.armaImagen && (
                      <div className="flex-shrink-0">
                        <img 
                          src={arma.armaImagen} 
                          alt={arma.armaModelo || arma.armaNombre || 'Sin modelo'}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Información del arma */}
                    <div className="flex-1 space-y-2">
                      <p><span className="font-medium">Arma:</span> {arma.armaModelo || arma.armaNombre || 'N/A'}</p>
                      <p><span className="font-medium">Modelo:</span> {arma.armaModelo || 'N/A'}</p>
                      <p><span className="font-medium">Código:</span> {arma.armaCodigo || 'N/A'}</p>
                      {arma.numeroSerie && (
                        <p>
                          <span className="font-medium">Número de Serie:</span>{' '}
                          <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                            {arma.numeroSerie}
                          </span>
                        </p>
                      )}
                      {arma.estado && (
                        <p>
                          <span className="font-medium">Estado:</span>{' '}
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            arma.estado === 'ASIGNADA' ? 'bg-green-100 text-green-800' :
                            arma.estado === 'RESERVADA' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {arma.estado}
                          </span>
                        </p>
                      )}
                      <p><span className="font-medium">Cantidad:</span> {cantidad}</p>
                      <p><span className="font-medium">Precio Unitario (sin IVA):</span> ${precioSinIva.toFixed(2)}</p>
                      <div className="border-t pt-2 mt-2">
                        <p><span className="font-medium">Subtotal:</span> ${subtotal.toFixed(2)}</p>
                        <p><span className="font-medium">IVA ({ivaPorcentaje}%):</span> ${ivaArma.toFixed(2)}</p>
                        <p className="font-bold text-lg"><span className="font-medium">Total (con IVA):</span> ${totalConIva.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sección de Pagos */}
      {loadedPagos.length > 0 && (
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Información de Pagos</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadedPagos.map((pago, index) => {
              const montoTotal = parseFloat(pago.montoTotal) || 0;
              const subtotal = montoTotal / (1 + ivaDecimal); // Calcular subtotal sin IVA
              const ivaPago = montoTotal - subtotal; // Calcular IVA
              
              return (
                <div key={index} className="bg-white p-4 rounded-xl border-2 border-green-200">
                  <div className="space-y-2">
                    <p><span className="font-medium">Tipo de Pago:</span> {pago.tipoPago || 'N/A'}</p>
                    <p><span className="font-medium">Estado:</span> {pago.estado || 'N/A'}</p>
                    <p><span className="font-medium">Fecha de Creación:</span> {pago.fechaCreacion ? new Date(pago.fechaCreacion).toLocaleDateString('es-ES') : 'N/A'}</p>
                    <div className="border-t pt-2 mt-2">
                      <p><span className="font-medium">Subtotal (sin IVA):</span> ${subtotal.toFixed(2)}</p>
                      <p><span className="font-medium">IVA ({ivaPorcentaje}%):</span> ${ivaPago.toFixed(2)}</p>
                      <p className="font-bold text-lg"><span className="font-medium">Total (con IVA):</span> ${montoTotal.toFixed(2)}</p>
                    </div>
                    {pago.numeroCuotas && (
                      <p><span className="font-medium">Número de Cuotas:</span> {pago.numeroCuotas}</p>
                    )}
                    {pago.montoCuota && (
                      <p><span className="font-medium">Monto por Cuota:</span> ${parseFloat(pago.montoCuota).toFixed(2)}</p>
                    )}
                    {pago.montoPagado && (
                      <p><span className="font-medium">Monto Pagado:</span> ${parseFloat(pago.montoPagado).toFixed(2)}</p>
                    )}
                    {pago.montoPendiente && (
                      <p><span className="font-medium">Monto Pendiente:</span> ${parseFloat(pago.montoPendiente).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

