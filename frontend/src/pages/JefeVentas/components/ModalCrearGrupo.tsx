import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface Licencia {
  id: number;
  numero: string;
  nombre: string;
  cupoCivil?: number;
  cupoMilitar?: number;
  cupoEmpresa?: number;
  cupoDeportista?: number;
}

interface ModalCrearGrupoProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ModalCrearGrupo: React.FC<ModalCrearGrupoProps> = ({ onClose, onSuccess }) => {
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [creando, setCreando] = useState(false);

  // Form state - Solo campos necesarios
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [licenciaId, setLicenciaId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const licenciasData = await apiService.getLicenciasDisponibles();
      setLicencias(licenciasData);
      
      // Si solo hay una licencia disponible, seleccionarla automáticamente
      if (licenciasData.length === 1) {
        setLicenciaId(licenciasData[0].id);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar licencias disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del grupo');
      return;
    }

    if (!licenciaId) {
      alert('Por favor selecciona una licencia');
      return;
    }

    try {
      setCreando(true);
      // Los cupos, fechas y tipo de proceso se calculan automáticamente en el backend
      const resultado = await apiService.crearGrupoImportacion({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        licenciaId,
        observaciones: observaciones.trim() || undefined
      });

      alert(`Grupo de importación "${resultado.nombre}" creado exitosamente`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creando grupo:', error);
      alert(error.message || 'Error al crear el grupo de importación');
    } finally {
      setCreando(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">➕ Crear Grupo de Importación</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Grupo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Grupo Importación 2024-01"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción opcional del grupo"
            />
          </div>

          {/* Licencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Licencia <span className="text-red-500">*</span>
            </label>
            <select
              value={licenciaId || ''}
              onChange={(e) => setLicenciaId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona una licencia</option>
              {licencias.map((licencia) => {
                const cupoTotal = (licencia.cupoCivil || 0) + 
                                 (licencia.cupoMilitar || 0) + 
                                 (licencia.cupoEmpresa || 0) + 
                                 (licencia.cupoDeportista || 0);
                return (
                  <option key={licencia.id} value={licencia.id}>
                    {licencia.numero} - {licencia.nombre} 
                    {cupoTotal > 0 && ` (Cupo Total: ${cupoTotal})`}
                  </option>
                );
              })}
            </select>
            {licencias.length === 0 && (
              <p className="text-sm text-red-500 mt-1">No hay licencias disponibles</p>
            )}
            {licenciaId && (
              <p className="text-sm text-gray-600 mt-1">
                💡 Los cupos se calcularán automáticamente desde la licencia seleccionada
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Observaciones adicionales"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={creando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={creando}
            >
              {creando ? 'Creando...' : 'Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCrearGrupo;

