import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { apiService } from '../../services/api';
import type { GrupoImportacion } from '../../services/api';

interface SerieRow {
  serialNumber: string;
  codigo: string;
  model: string;
  caliber: string;
  observaciones: string;
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
      const grupos = await apiService.getGruposActivos();
      setGruposDisponibles(grupos);
      console.log('✅ Grupos de importación cargados:', grupos.length);
    } catch (error) {
      console.error('❌ Error cargando grupos:', error);
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

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Leer la primera hoja
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Mapear datos a nuestro formato
        const mappedData: SerieRow[] = jsonData.map((row: any) => ({
          serialNumber: row['Serial number'] || row['serial_number'] || '',
          codigo: row['CODIGO'] || row['codigo'] || '',
          model: row['Model'] || row['model'] || '',
          caliber: row['Caliber'] || row['caliber'] || '',
          observaciones: row['Text2'] || row['text2'] || ''
        }));

        setPreviewData(mappedData);
        console.log('📊 Datos procesados del Excel:', mappedData);
      } catch (error) {
        console.error('Error procesando Excel:', error);
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
      const response = await fetch('http://localhost:8080/api/arma-serie/bulk-upload', {
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

      if (result.success > 0) {
        alert(`✅ Se cargaron exitosamente ${result.success} series`);
      }

      if (result.errors && result.errors.length > 0) {
        console.error('⚠️ Errores al cargar algunas series:', result.errors);
      }

      // Limpiar formulario
      setSelectedFile(null);
      setPreviewData([]);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error subiendo series:', error);
      alert('Error al cargar las series. Revisa la consola para más detalles.');
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
        <p className="text-sm text-blue-800 mb-2">El archivo debe tener las siguientes columnas:</p>
        <ul className="text-sm text-blue-800 space-y-1 ml-4">
          <li>• <strong>Serial number</strong>: Número de serie del arma</li>
          <li>• <strong>CODIGO</strong>: Código del arma en el sistema (ej: CZ-P09-C-NOCTURNE-PLAN-PILOTO)</li>
          <li>• <strong>Model</strong>: Nombre del modelo (ej: CZ P-09 C NOCTURNE)</li>
          <li>• <strong>Caliber</strong>: Calibre (ej: 9 mm)</li>
          <li>• <strong>Text2</strong>: Observaciones (ej: 2 alimentadoras)</li>
        </ul>
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
            return (
              <option key={grupo.id} value={grupo.id}>
                {grupoAny.codigo || grupoAny.nombre || `Grupo ${grupo.id}`} - {grupo.nombre}
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
              ⚠️ No hay grupos de importación disponibles
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Debe crear grupos de importación activos antes de cargar series. Comuníquese con el Jefe de Ventas.
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
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex-1">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Código</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Model</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Caliber</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Observaciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-mono text-blue-600">{row.serialNumber}</td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-900">{row.codigo}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{row.model}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{row.caliber}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.observaciones}</td>
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

