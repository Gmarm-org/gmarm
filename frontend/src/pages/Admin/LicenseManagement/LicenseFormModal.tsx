import React, { useState, useEffect } from 'react';
import type { License } from '../../../services/adminApi';

interface LicenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (license: Partial<License>) => Promise<void>;
  license?: License | null;
  mode: 'create' | 'edit' | 'view';
}

const LicenseFormModal: React.FC<LicenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  license,
  mode
}) => {
  const [formData, setFormData] = useState<Partial<License>>({
    numero: '',
    nombre: '',
    ruc: '',
    email: '',
    telefono: '',
    descripcion: '',
    estado: 'ACTIVA',
    cupo_total: 0,
    cupo_disponible: 0,
    cupo_civil: 0,
    cupo_militar: 0,
    cupo_empresa: 0,
    cupo_deportista: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (license && (mode === 'edit' || mode === 'view')) {
      setFormData(license);
    } else {
      setFormData({
        numero: '',
        nombre: '',
        ruc: '',
        email: '',
        telefono: '',
        descripcion: '',
        estado: 'ACTIVA',
        cupo_total: 0,
        cupo_disponible: 0,
        cupo_civil: 0,
        cupo_militar: 0,
        cupo_empresa: 0,
        cupo_deportista: 0
      });
    }
  }, [license, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando licencia:', error);
      alert('Error al guardar la licencia');
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = mode === 'view';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' && '➕ Crear Nueva Licencia'}
            {mode === 'edit' && '✏️ Editar Licencia'}
            {mode === 'view' && '👁️ Ver Licencia'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✖️</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Información Básica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Licencia *</label>
                <input type="text" value={formData.numero || ''} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre/Razón Social *</label>
                <input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                <input type="text" value={formData.ruc || ''} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={formData.telefono || ''} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <select value={formData.estado || 'ACTIVA'} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly}>
                  <option value="ACTIVA">Activa</option>
                  <option value="VENCIDA">Vencida</option>
                  <option value="SUSPENDIDA">Suspendida</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cupos */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Cupos de Importación</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Total</label>
                <input type="number" value={formData.cupo_total || 0} onChange={(e) => setFormData({ ...formData, cupo_total: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Disponible</label>
                <input type="number" value={formData.cupo_disponible || 0} onChange={(e) => setFormData({ ...formData, cupo_disponible: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Civil</label>
                <input type="number" value={formData.cupo_civil || 0} onChange={(e) => setFormData({ ...formData, cupo_civil: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Militar</label>
                <input type="number" value={formData.cupo_militar || 0} onChange={(e) => setFormData({ ...formData, cupo_militar: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Empresa</label>
                <input type="number" value={formData.cupo_empresa || 0} onChange={(e) => setFormData({ ...formData, cupo_empresa: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Deportista</label>
                <input type="number" value={formData.cupo_deportista || 0} onChange={(e) => setFormData({ ...formData, cupo_deportista: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} min={0} />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción/Observaciones</label>
            <textarea value={formData.descripcion || ''} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} disabled={isReadOnly} />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </button>
            {mode !== 'view' && (
              <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear Licencia' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicenseFormModal;

