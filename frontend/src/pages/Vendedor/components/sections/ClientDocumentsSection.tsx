import React, { useRef } from 'react';

interface ClientDocumentsSectionProps {
  mode: 'create' | 'edit' | 'view';
  requiredDocuments: any[];
  uploadedDocuments: Record<string, File>;
  loadedDocuments: Record<string, any>;
  handleDocumentUpload: (nombre: string, file: File) => void;
  getDocumentStatusColor: () => string;
  getDocumentStatusText: () => string;
}

export const ClientDocumentsSection: React.FC<ClientDocumentsSectionProps> = ({
  mode,
  requiredDocuments,
  uploadedDocuments,
  loadedDocuments,
  handleDocumentUpload,
  getDocumentStatusColor,
  getDocumentStatusText
}) => {
  // Refs para los inputs de archivo (uno por documento para poder reemplazar)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Documentos del Cliente</h2>
        </div>
        <div className={`px-4 py-2 rounded-lg border-2 ${getDocumentStatusColor()}`}>
          <span className="font-semibold">{getDocumentStatusText()}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredDocuments.map((document) => (
          <div 
            key={document.id} 
            className={`bg-white p-4 rounded-xl border-2 transition-all duration-200 ${
              document.urlDocumento 
                ? 'border-blue-200 hover:border-blue-300' 
                : 'border-gray-200 hover:border-gray-300'
            } ${
              uploadedDocuments[document.nombre] 
                ? 'bg-green-50 border-green-300' 
                : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{document.nombre}</h3>
                <p className="text-sm text-gray-500 mb-2">{document.descripcion}</p>
                <div className="flex flex-wrap gap-2">
                  {document.urlDocumento && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      📄 En Línea
                    </span>
                  )}
                  {document.obligatorio && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Obligatorio
                    </span>
                  )}
                  {(uploadedDocuments[document.id.toString()] || loadedDocuments[document.nombre]) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Subido
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {document.urlDocumento && (
              <div className="mb-3 flex justify-center">
                <a 
                  href={document.urlDocumento} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  Acceder a la Fuente Oficial
                </a>
              </div>
            )}
            
            {/* Mostrar documento cargado */}
            {loadedDocuments[document.nombre] ? (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      {loadedDocuments[document.nombre].nombreArchivo}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {loadedDocuments[document.nombre].estado}
                  </span>
                </div>
                
                {/* Previsualización del documento */}
                <div className="mb-3">
                  {loadedDocuments[document.nombre]?.id ? (
                    <>
                      <iframe
                        src={`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve/${loadedDocuments[document.nombre].id}`}
                        className="w-full h-64 border border-gray-300 rounded-lg"
                        title={`Previsualización de ${document.nombre}`}
                        onError={(e) => {
                          console.error('❌ Error cargando documento en iframe:', e, loadedDocuments[document.nombre]);
                        }}
                        onLoad={() => {
                          console.log('✅ Documento cargado exitosamente en iframe:', loadedDocuments[document.nombre]);
                        }}
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        ID: {loadedDocuments[document.nombre].id} | {loadedDocuments[document.nombre].nombreArchivo || 'Sin nombre'}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-64 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm mb-1">No se pudo cargar la previsualización del documento</p>
                        <p className="text-gray-400 text-xs">Documento: {document.nombre}</p>
                        {loadedDocuments[document.nombre] && (
                          <p className="text-gray-400 text-xs">Estado: {JSON.stringify(loadedDocuments[document.nombre])}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Botones de acción */}
                <div className="flex gap-2">
                  <a 
                    href={`${import.meta.env.VITE_API_BASE_URL}/api/documentos/serve/${loadedDocuments[document.nombre].id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    Abrir en Nueva Pestaña
                  </a>
                  
                  {mode !== 'view' && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Activar el input file para reemplazar el documento
                          const inputId = `file-replace-${document.id}`;
                          const fileInput = fileInputRefs.current[inputId];
                          if (fileInput) {
                            fileInput.click();
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Reemplazar
                      </button>
                      {/* Input oculto para reemplazar documento */}
                      <input
                        id={`file-replace-${document.id}`}
                        ref={(el) => {
                          if (el) {
                            fileInputRefs.current[`file-replace-${document.id}`] = el;
                          }
                        }}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDocumentUpload(document.nombre, file);
                            // Resetear el input para permitir seleccionar el mismo archivo nuevamente
                            e.target.value = '';
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <input
                type="file"
                disabled={mode === 'view'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleDocumentUpload(document.nombre, file);
                    // Resetear el input para permitir seleccionar el mismo archivo nuevamente
                    e.target.value = '';
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

