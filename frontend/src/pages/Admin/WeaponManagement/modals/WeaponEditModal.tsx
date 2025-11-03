import React, { useState, useEffect } from 'react';
import type { Weapon } from '../../../../services/adminApi';

interface WeaponEditModalProps {
  weapon: Weapon;
  categories: Array<{id: number, nombre: string}>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
}

interface EditFormData {
  nombre: string;
  codigo: string;
  calibre: string;
  capacidad: number;
  precioReferencia: number;
  categoriaId: number;
  estado: boolean;
  urlImagen: string;
}

const WeaponEditModal: React.FC<WeaponEditModalProps> = ({
  weapon,
  categories,
  isOpen,
  onClose,
  onSave
}) => {
  const [editForm, setEditForm] = useState<EditFormData>({
    nombre: '',
    codigo: '',
    calibre: '',
    capacidad: 0,
    precioReferencia: 0,
    categoriaId: 0,
    estado: true,
    urlImagen: ''
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (weapon && isOpen) {
      setEditForm({
        nombre: weapon.nombre || '',
        codigo: weapon.codigo || '',
        calibre: weapon.calibre || '',
        capacidad: weapon.capacidad || 0,
        precioReferencia: weapon.precioReferencia || 0,
        categoriaId: weapon.categoriaId || 1,
        estado: weapon.estado !== undefined ? weapon.estado : true,
        urlImagen: weapon.urlImagen || ''
      });
      setSelectedImageFile(null);
      setImagePreview('');
    }
  }, [weapon, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof EditFormData, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, JPEG, WEBP, SVG)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. El tamaño máximo es 5MB');
        return;
      }
      
      setSelectedImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedImageFile(null);
    setImagePreview('');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('nombre', editForm.nombre);
      formData.append('codigo', editForm.codigo);
      formData.append('calibre', editForm.calibre);
      formData.append('capacidad', editForm.capacidad.toString());
      formData.append('precioReferencia', editForm.precioReferencia.toString());
      formData.append('categoriaId', editForm.categoriaId.toString());
      formData.append('estado', editForm.estado.toString());
      
      if (selectedImageFile) {
        formData.append('imagen', selectedImageFile);
      } else if (editForm.urlImagen && editForm.urlImagen.trim() !== '') {
        formData.append('urlImagen', editForm.urlImagen);
      }
      
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar los cambios: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Editar Arma: {weapon.nombre}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda - Información Básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Arma *</label>
              <input
                type="text"
                value={editForm.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: CZ 75 B"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código de la Arma *</label>
              <input
                type="text"
                value={editForm.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: CZ-75-B"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Calibre *</label>
              <input
                type="text"
                value={editForm.calibre}
                onChange={(e) => handleInputChange('calibre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 9MM"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad del Cargador</label>
              <input
                type="number"
                value={editForm.capacidad}
                onChange={(e) => handleInputChange('capacidad', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 16"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.precioReferencia}
                  onChange={(e) => handleInputChange('precioReferencia', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
              <select
                value={editForm.categoriaId}
                onChange={(e) => handleInputChange('categoriaId', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="estado"
                    value="true"
                    checked={editForm.estado === true}
                    onChange={() => handleInputChange('estado', true)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="estado"
                    value="false"
                    checked={editForm.estado === false}
                    onChange={() => handleInputChange('estado', false)}
                    className="mr-2 text-red-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Inactivo</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Columna Derecha - Imagen */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen Actual</label>
              <div className="flex justify-center">
                <img
                  src={weapon.urlImagen || '/images/weapons/placeholder.png'}
                  alt={weapon.nombre}
                  className="h-48 w-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/weapons/placeholder.png';
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cargar Nueva Imagen</label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500">
                  Formatos soportados: PNG, JPG, JPEG, WEBP, SVG. Máximo 5MB.
                </p>
              </div>
            </div>
            
            {/* Preview de la nueva imagen */}
            {imagePreview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vista Previa de la Nueva Imagen</label>
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="h-48 w-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={clearImageSelection}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Eliminar imagen seleccionada"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  La imagen se guardará como: <strong>weapon_{weapon.id}.{selectedImageFile?.name.split('.').pop()}</strong>
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de Imagen (Alternativa)</label>
              <input
                type="url"
                value={editForm.urlImagen}
                onChange={(e) => handleInputChange('urlImagen', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa esta opción si prefieres especificar una URL en lugar de cargar un archivo
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📝 Información del Sistema</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>ID:</strong> {weapon.id}</p>
                <p><strong>Fecha de Creación:</strong> {weapon.fechaCreacion || 'No disponible'}</p>
                <p><strong>Última Modificación:</strong> {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-8 space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? '💾 Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeaponEditModal;
