import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface ModalCargarDocumentoProps {
  grupoId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion?: string;
}

const ModalCargarDocumento: React.FC<ModalCargarDocumentoProps> = ({ grupoId, onClose, onSuccess }) => {
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState<number | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarTiposDocumento();
  }, []);

  const cargarTiposDocumento = async () => {
    try {
      const tipos = await apiService.getTiposDocumentoGruposImportacion();
      // Buscar el documento "Documento recibido por comando conjunto"
      const docComando = tipos.find(t => t.nombre === 'Documento recibido por comando conjunto');
      if (docComando) {
        setTipoDocumentoSeleccionado(docComando.id);
      }
      setTiposDocumento(tipos);
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
      alert('Error al cargar los tipos de documento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tipoDocumentoSeleccionado) {
      alert('Por favor selecciona un tipo de documento');
      return;
    }
    
    if (!archivo) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setLoading(true);
      await apiService.cargarDocumentoGrupo(grupoId, tipoDocumentoSeleccionado, archivo, descripcion);
      alert('Documento cargado exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error cargando documento:', error);
      alert(error.message || 'Error al cargar el documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📄 Cargar Documento Comando Conjunto</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              value={tipoDocumentoSeleccionado || ''}
              onChange={(e) => setTipoDocumentoSeleccionado(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un tipo de documento</option>
              {tiposDocumento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Agrega una descripción del documento..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Cargando...' : 'Cargar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCargarDocumento;

