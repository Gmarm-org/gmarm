import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { apiService } from '../../services/api';
import type { GrupoImportacion } from '../../services/api';

interface SerieRow {
  serialNumber: string;
  model: string;
  calibre: string;
  categoria: string;
  marca: string;
}

const CargaMasivaSeries: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<SerieRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoImportacion[]>([]);
  const [cargandoGrupos, setCargandoGrupos] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  // Cargar grupos de importación activos al montar
  useEffect(() => {
    cargarGruposActivos();
  }, []);

  const cargarGruposActivos = async () => {
    setCargandoGrupos(true);
    try {
      // Usar endpoint de gestión de importaciones que incluye TODOS los grupos
      // Necesitamos grupos con pedido definido (EN_PROCESO_OPERACIONES, etc.)
      const response = await apiService.getGruposParaJefeVentas(0, 100);
      const grupos = Array.isArray(response) ? response : (response as any)?.content || [];
      
      // Filtrar solo grupos que tengan pedido definido (estados posteriores a EN_PREPARACION)
      // Y que AÚN necesiten series (seriesPendientes > 0)
      const gruposPedidoDefinido = grupos.filter((g: any) => {
        const estado = g.grupoEstado || g.estado;
        const tienePedidoDefinido = estado && !['BORRADOR', 'EN_PREPARACION', 'EN_PROCESO_ASIGNACION_CLIENTES'].includes(estado);
        
        // Verificar si aún necesita series
        const seriesPendientes = g.seriesPendientes !== undefined ? g.seriesPendientes : 999; // Si no tiene el campo, asumir que necesita
        const necesitaSeries = seriesPendientes > 0;
        
        return tienePedidoDefinido && necesitaSeries;
      });
      
      // Mapear a la estructura esperada por el componente (id, nombre, codigo)
      const gruposMapeados = gruposPedidoDefinido.map((g: any) => ({
        id: g.grupoId || g.id,
        nombre: g.grupoNombre || g.nombre,
        codigo: g.grupoCodigo || g.codigo,
        estado: g.grupoEstado || g.estado,
        tipoGrupo: g.tipoGrupo,
        totalArmasSolicitadas: g.totalArmasSolicitadas || 0,
        seriesCargadas: g.seriesCargadas || 0,
        seriesPendientes: g.seriesPendientes || 0
      }));
      
      setGruposDisponibles(gruposMapeados);
    } catch (error) {
      console.error('Error cargando grupos:', error instanceof Error ? error.message : 'Error desconocido');
      alert('Error al cargar los grupos de importación');
    } finally {
      setCargandoGrupos(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    processExcelFile(file);
  };

  // Helper para encontrar valor en el row con variaciones de nombre de columna
  const findColumnValue = (row: any, ...possibleNames: string[]): string => {
    // Normalizar función: quitar espacios, guiones bajos, convertir a minúsculas
    const normalize = (str: string) => str.toLowerCase().replace(/[\s_-]/g, '');
    
    // Buscar primero coincidencia exacta
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name];
      }
    }
    
    // Si no hay coincidencia exacta, buscar por coincidencia normalizada
    const rowKeys = Object.keys(row);
    for (const name of possibleNames) {
      const normalizedName = normalize(name);
      const matchingKey = rowKeys.find(key => normalize(key) === normalizedName);
      if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
        return row[matchingKey];
      }
    }
    
    return '';
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Leer la primera hoja
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Mapear datos a nuestro formato con búsqueda flexible
        const mappedData: SerieRow[] = jsonData.map((row: any) => ({
          serialNumber: findColumnValue(row, 
            'serialNumber', 'Serial number', 'Serial numbe', 'serial_number', 
            'SERIAL_NUMBER', 'Serial Number', 'SerialNumber', 'numero de serie', 
            'Numero de Serie', 'numero_serie'
          ),
          model: findColumnValue(row, 
            'model', 'Model', 'modelo', 'Modelo', 'MODEL', 'MODELO'
          ),
          calibre: findColumnValue(row, 
            'calibre', 'Calibre', 'caliber', 'Caliber', 'CALIBRE', 'CALIBER'
          ),
          categoria: findColumnValue(row, 
            'tipo', 'Tipo', 'categoria', 'Categoria', 'TIPO', 'CATEGORIA', 
            'category', 'Category'
          ),
          marca: findColumnValue(row, 
            'marca', 'Marca', 'MARCA', 'brand', 'Brand'
          )
        }));

        setPreviewData(mappedData);
      } catch (error) {
        console.error('Error procesando Excel:', error instanceof Error ? error.message : 'Error desconocido');
        alert('Error al procesar el archivo Excel. Verifica el formato.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || previewData.length === 0) {
      alert('Por favor selecciona un archivo primero');
      return;
    }

    if (!grupoSeleccionado) {
      alert('Por favor selecciona un grupo de importación');
      return;
    }

    setIsProcessing(true);
    setUploadResult(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/arma-serie/bulk-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          series: previewData,
          grupoImportacionId: grupoSeleccionado
        })
      });

      if (!response.ok) {
        throw new Error(`Error en la carga: ${response.statusText}`);
      }

      const result = await response.json();
      setUploadResult({
        success: result.success || 0,
        errors: result.errors || []
      });

      // Mostrar resultado al usuario
      let mensaje = '';
      if (result.success > 0) {
        mensaje += `✅ Se cargaron exitosamente ${result.success} de ${result.total} series.\n\n`;
      }

      if (result.errors && result.errors.length > 0) {
        mensaje += `⚠️ Se encontraron ${result.errors.length} errores:\n\n`;
        // Mostrar solo los primeros 10 errores para no saturar el alert
        const erroresAMostrar = result.errors.slice(0, 10);
        mensaje += erroresAMostrar.join('\n');
        if (result.errors.length > 10) {
          mensaje += `\n\n... y ${result.errors.length - 10} errores más. Revisa la consola para ver todos.`;
        }
        console.error('Errores de carga de series:', result.errors.length);
      }

      if (mensaje) {
        alert(mensaje);
      }

      // Limpiar formulario
      setSelectedFile(null);
      setPreviewData([]);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Error subiendo series:', error instanceof Error ? error.message : 'Error desconocido');
      const errorMessage = error?.message || 'Error desconocido';
      alert(`❌ Error al cargar las series:\n\n${errorMessage}\n\nRevisa que:\n- El archivo Excel tenga el formato correcto\n- Las columnas se llamen exactamente: serialNumber, model, caliber, tipo, marca\n- Hayas seleccionado un grupo de importación`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setUploadResult(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📤 Carga Masiva de Series</h2>
        <p className="text-sm text-gray-600 mt-2">
          Sube un archivo Excel con las series de armas para cargarlas masivamente al sistema
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Formato del Excel</h3>
        <p className="text-sm text-blue-800 mb-2">El archivo debe tener las siguientes columnas (acepta múltiples variaciones):</p>
        <ul className="text-sm text-blue-800 space-y-2 ml-4">
          <li>
            • <strong>Número de Serie</strong>: Acepta cualquiera de estos nombres:
            <div className="ml-4 mt-1 text-xs">
              <span className="font-mono bg-blue-100 px-1 rounded mr-1">Serial number</span>
              <span className="font-mono bg-blue-100 px-1 rounded mr-1">serialNumber</span>
              <span className="font-mono bg-blue-100 px-1 rounded mr-1">numero de serie</span>
              <span className="font-mono bg-blue-100 px-1 rounded">serial_number</span>
            </div>
          </li>
          <li>
            • <strong>Modelo</strong>: Acepta: 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">Model</span>, 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">modelo</span>
          </li>
          <li>
            • <strong>Calibre</strong>: Acepta: 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">Calibre</span>, 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">caliber</span>
          </li>
          <li>
            • <strong>Tipo/Categoría</strong>: Acepta: 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">Tipo</span>, 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">categoria</span>
          </li>
          <li>
            • <strong>Marca</strong>: Acepta: 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">Marca</span>, 
            <span className="font-mono bg-blue-100 px-1 rounded ml-1">marca</span>
          </li>
        </ul>
        <p className="text-xs text-green-600 mt-3 font-semibold flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          El sistema detecta automáticamente las columnas, sin importar mayúsculas, espacios o guiones bajos.
        </p>
      </div>

      {/* Selección de grupo de importación */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grupo de Importación *
        </label>
        <select
          value={grupoSeleccionado || ''}
          onChange={(e) => setGrupoSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
          disabled={cargandoGrupos || gruposDisponibles.length === 0}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            cargandoGrupos || gruposDisponibles.length === 0
              ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
              : 'border-gray-300'
          }`}
          required
        >
          <option value="">
            {cargandoGrupos 
              ? 'Cargando grupos...' 
              : gruposDisponibles.length === 0 
                ? 'No hay grupos de importación disponibles' 
                : '-- Seleccione un grupo de importación --'}
          </option>
          {gruposDisponibles.map((grupo) => {
            const grupoAny = grupo as any;
            const seriesInfo = grupoAny.seriesPendientes > 0 
              ? ` (${grupoAny.seriesCargadas}/${grupoAny.totalArmasSolicitadas} series cargadas)`
              : '';
            return (
              <option key={grupo.id} value={grupo.id}>
                {grupoAny.codigo || grupoAny.nombre || `Grupo ${grupo.id}`} - {grupo.nombre}{seriesInfo}
              </option>
            );
          })}
        </select>
        {cargandoGrupos && (
          <p className="text-sm text-gray-500 mt-1">⏳ Cargando grupos de importación...</p>
        )}
        {!cargandoGrupos && gruposDisponibles.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ No hay grupos con pedido definido
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Solo puedes cargar series a grupos que YA tienen el pedido definido (estado: SOLICITAR_PROFORMA_FABRICA o posterior). 
              Primero define el pedido del grupo desde la página de Importaciones.
            </p>
          </div>
        )}
        {!cargandoGrupos && gruposDisponibles.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {gruposDisponibles.length} grupo(s) de importación disponible(s)
          </p>
        )}
      </div>

      {/* Subida de archivo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar archivo Excel (.xlsx o .xls)
          {!grupoSeleccionado && (
            <span className="text-red-500 text-xs ml-2">
              (Primero selecciona un grupo de importación)
            </span>
          )}
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex-1">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={!grupoSeleccionado}
              className={`block w-full text-sm ${
                !grupoSeleccionado 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-500 cursor-pointer'
              } file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${
                !grupoSeleccionado 
                  ? 'file:bg-gray-100 file:text-gray-400 file:cursor-not-allowed' 
                  : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
              }`}
            />
          </label>
          {selectedFile && (
            <button
              onClick={clearFile}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-2">
            📄 Archivo seleccionado: <strong>{selectedFile.name}</strong> ({previewData.length} filas)
          </p>
        )}
      </div>

      {/* Vista previa de datos */}
      {previewData.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">👀 Vista Previa (primeras 10 filas)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Serial Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Model</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Calibre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Marca</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-mono text-blue-600">{row.serialNumber}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{row.model}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{row.calibre}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{row.categoria}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{row.marca}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 10 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                ... y {previewData.length - 10} filas más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botón de carga */}
      {previewData.length > 0 && (
        <div className="flex justify-end space-x-4">
          <button
            onClick={clearFile}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={isProcessing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              isProcessing
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Cargar {previewData.length} Series</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Resultado de la carga */}
      {uploadResult && (
        <div className={`mt-6 p-4 rounded-lg ${uploadResult.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className="font-semibold text-gray-900 mb-2">Resultado de la Carga</h3>
          <p className="text-sm text-gray-700 mb-2">
            ✅ <strong>{uploadResult.success}</strong> series cargadas exitosamente
          </p>
          {uploadResult.errors.length > 0 && (
            <div>
              <p className="text-sm text-red-700 font-semibold mb-1">⚠️ Errores:</p>
              <ul className="text-sm text-red-600 space-y-1 ml-4">
                {uploadResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CargaMasivaSeries;

