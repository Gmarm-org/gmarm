import React, { useState, useEffect } from 'react';
import type { License } from '../../../services/adminApi';
import { useClientCatalogs } from '../../Vendedor/hooks/useClientCatalogs';

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
  // Reutilizar hook de Cliente para provincias/cantones
  const {
    provincias,
    availableCantons,
    loadCantones,
    setAvailableCantons
  } = useClientCatalogs();

  const [formData, setFormData] = useState<Partial<License>>({
    numero: '',
    nombre: '',
    titulo: '', // Nuevo campo
    ruc: '',
    email: '',
    telefono: '',
    provincia: '',
    canton: '',
    descripcion: '',
    estado: true,
    cupo_total: 0,
    cupo_disponible: 0,
    cupo_civil: 0,
    cupo_militar: 0,
    cupo_empresa: 0,
    cupo_deportista: 0,
    cuenta_bancaria: '',
    nombre_banco: '',
    tipo_cuenta: '',
    cedula_cuenta: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (license && (mode === 'edit' || mode === 'view')) {
      setFormData(license);
      // Cargar cantones si hay provincia
      if (license.provincia) {
        const prov = provincias.find(p => p.nombre === license.provincia);
        if (prov) {
          loadCantones(prov.codigo, false);
        }
      }
    } else {
      setFormData({
        numero: '',
        nombre: '',
        titulo: '',
        ruc: '',
        email: '',
        telefono: '',
        provincia: '',
        canton: '',
        descripcion: '',
        estado: true,
        cupo_total: 0,
        cupo_disponible: 0,
        cupo_civil: 0,
        cupo_militar: 0,
        cupo_empresa: 0,
        cupo_deportista: 0,
        cuenta_bancaria: '',
        nombre_banco: '',
        tipo_cuenta: '',
        cedula_cuenta: ''
      });
      setAvailableCantons([]);
    }
  }, [license, mode, isOpen, provincias, loadCantones, setAvailableCantons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    // Validaciones
    if (formData.ruc && formData.ruc.length > 13) {
      alert('El RUC no puede tener más de 13 dígitos');
      return;
    }
    
    if (formData.telefono && formData.telefono.length > 10) {
      alert('El teléfono no puede tener más de 10 dígitos');
      return;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('El email no es válido');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      // El error ya se maneja en handleSave de LicenseList.tsx
      // No mostrar alert aquí para evitar doble mensaje
      console.error('Error guardando licencia:', error);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input type="text" value={formData.titulo || ''} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} placeholder="Título de la licencia" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUC (máx. 13 dígitos)</label>
                <input type="text" value={formData.ruc || ''} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" maxLength={13} pattern="[0-9]*" disabled={isReadOnly} placeholder="1234567890001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} placeholder="licencia@ejemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (máx. 10 dígitos)</label>
                <input type="tel" value={formData.telefono || ''} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" maxLength={10} pattern="[0-9]*" disabled={isReadOnly} placeholder="0987654321" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <select
                  value={formData.provincia || ''}
                  onChange={(e) => {
                    const selectedProvincia = e.target.value;
                    setFormData({ ...formData, provincia: selectedProvincia, canton: '' });
                    const prov = provincias.find(p => p.nombre === selectedProvincia);
                    if (prov) {
                      loadCantones(prov.codigo, false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isReadOnly}
                >
                  <option value="">Seleccionar provincia</option>
                  {provincias.map((prov) => (
                    <option key={prov.codigo} value={prov.nombre}>{prov.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantón</label>
                <select
                  value={formData.canton || ''}
                  onChange={(e) => setFormData({ ...formData, canton: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isReadOnly || !formData.provincia}
                >
                  <option value="">Seleccionar cantón</option>
                  {availableCantons.map((canton) => (
                    <option key={canton} value={canton}>{canton}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.estado || false}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md"
                    disabled={isReadOnly}
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información Bancaria */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Información Bancaria</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                <input type="text" value={formData.cuenta_bancaria || ''} onChange={(e) => setFormData({ ...formData, cuenta_bancaria: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} placeholder="1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco</label>
                <input type="text" value={formData.nombre_banco || ''} onChange={(e) => setFormData({ ...formData, nombre_banco: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} placeholder="Banco Pichincha" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
                <select value={formData.tipo_cuenta || ''} onChange={(e) => setFormData({ ...formData, tipo_cuenta: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly}>
                  <option value="">Seleccionar tipo</option>
                  <option value="AHORRO">Ahorros</option>
                  <option value="CORRIENTE">Corriente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula del Titular</label>
                <input type="text" value={formData.cedula_cuenta || ''} onChange={(e) => setFormData({ ...formData, cedula_cuenta: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" maxLength={10} pattern="[0-9]*" disabled={isReadOnly} placeholder="1234567890" />
              </div>
            </div>
          </div>

          {/* Cupos - Solo lectura, valores FIJOS inicializados automáticamente */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Cupos de Importación</h3>
              <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded font-medium">
                🔒 Valores FIJOS - No editables
              </span>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-xs text-blue-700 font-medium mb-2">
                ℹ️ Los cupos se inicializan automáticamente con valores FIJOS al crear la licencia:
              </p>
              <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
                <li><strong>Civil:</strong> 25 armas</li>
                <li><strong>Uniformados (Militar/Policía):</strong> 1,000 armas</li>
                <li><strong>Empresas de Seguridad:</strong> 1,000 armas</li>
                <li><strong>Deportistas:</strong> 1,000 armas</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2 italic">
                🔄 Los cupos se resetean automáticamente cuando la licencia se libera de un grupo de importación completado.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cupo Total
                  <span className="ml-2 text-xs text-gray-500">(suma de todos)</span>
                </label>
                <input type="number" value={formData.cupo_total || 3025} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" disabled={true} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cupo Disponible
                  <span className="ml-2 text-xs text-gray-500">(restante)</span>
                </label>
                <input type="number" value={formData.cupo_disponible || 3025} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" disabled={true} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cupo Civil
                  <span className="ml-2 text-xs text-blue-600 font-medium">(fijo: 25)</span>
                </label>
                <input type="number" value={formData.cupo_civil || 25} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" disabled={true} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cupo Uniformados
                  <span className="ml-2 text-xs text-blue-600 font-medium">(fijo: 1000)</span>
                </label>
                <input type="number" value={formData.cupo_militar || 1000} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" disabled={true} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cupo Empresas
                  <span className="ml-2 text-xs text-blue-600 font-medium">(fijo: 1000)</span>
                </label>
                <input type="number" value={formData.cupo_empresa || 1000} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" disabled={true} min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cupo Deportistas
                  <span className="ml-2 text-xs text-blue-600 font-medium">(fijo: 1000)</span>
                </label>
                <input type="number" value={formData.cupo_deportista || 1000} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" disabled={true} min={0} />
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

