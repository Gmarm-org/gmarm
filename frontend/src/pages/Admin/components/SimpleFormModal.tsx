import React, { useState, useEffect } from 'react';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: Array<{value: string | number, label: string}>; // Para select
}

interface SimpleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  data?: any;
  mode: 'create' | 'edit' | 'view';
  title: string;
  fields: Field[];
  hideHeader?: boolean; // Opcional: ocultar header (cuando se usa dentro de otro contenedor)
  customSection?: React.ReactNode | ((formData: any) => React.ReactNode); // Opcional: sección personalizada al final del formulario (puede ser función que recibe formData)
}

const SimpleFormModal: React.FC<SimpleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  data,
  mode,
  title,
  fields,
  hideHeader = false,
  customSection
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data && (mode === 'edit' || mode === 'view')) {
      setFormData(data);
    } else {
      const initialData: any = {};
      fields.forEach(field => {
        // Para checkboxes: estado = true por defecto, otros = false
        initialData[field.key] = field.type === 'checkbox' ? (field.key === 'estado' ? true : false) : '';
      });
      setFormData(initialData);
    }
  }, [data, mode, isOpen, fields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    try {
      setIsSaving(true);
      await onSave(formData);
      // Solo cerrar modal si onSave fue exitoso (no lanzó error)
      onClose();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar. Por favor revise los datos e intente nuevamente.');
      // NO cerrar modal aquí - dejar abierto para que usuario corrija datos
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = mode === 'view';

  if (!isOpen) return null;

  // Contenido del formulario (compartido entre ambos modos)
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && '*'}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required={field.required}
                  disabled={isReadOnly || field.disabled}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData[field.key] || false}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      const updatedData = { ...formData, [field.key]: newValue };
                      
                      // Si se marca gruposImportacion, limpiar tipoProcesoId automáticamente
                      if (field.key === 'gruposImportacion' && newValue) {
                        updatedData.tipoProcesoId = undefined;
                      }
                      
                      setFormData(updatedData);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isReadOnly || field.disabled}
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {field.key === 'estado' ? 'Activo' : (formData[field.key] ? 'Sí' : 'No')}
                  </span>
                  {field.key === 'gruposImportacion' && formData.gruposImportacion && (
                    <span className="ml-2 text-xs text-purple-600 font-medium">
                      (Tipo de Proceso se establecerá automáticamente como NULL)
                    </span>
                  )}
                </div>
              ) : field.type === 'select' ? (
                <div>
                  <select
                    value={formData.gruposImportacion ? '' : (formData[field.key] || '')}
                    onChange={(e) => {
                      // No permitir cambiar si gruposImportacion está marcado
                      if (!formData.gruposImportacion) {
                        const value = e.target.value;
                        const selectedValue = value === '' ? undefined : (isNaN(Number(value)) ? value : Number(value));
                        setFormData({ ...formData, [field.key]: selectedValue });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      formData.gruposImportacion 
                        ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'border-gray-300'
                    }`}
                    required={field.required && !formData.gruposImportacion} // No requerir si es para grupos
                    disabled={isReadOnly || field.disabled || formData.gruposImportacion} // Deshabilitar si es para grupos
                    style={formData.gruposImportacion ? { pointerEvents: 'none' } : {}}
                  >
                    <option value="">
                      {formData.gruposImportacion ? '🚫 N/A (Documento para Grupos de Importación)' : 'Seleccionar...'}
                    </option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formData.gruposImportacion && field.key === 'tipoProcesoId' && (
                    <p className="mt-1 text-xs text-purple-600 font-medium">
                      🔒 Este campo está bloqueado. El Tipo de Proceso se establecerá automáticamente como NULL porque el documento es para grupos de importación.
                    </p>
                  )}
                  {!formData.gruposImportacion && field.key === 'tipoProcesoId' && field.required && !formData[field.key] && (
                    <p className="mt-1 text-xs text-blue-600">
                      ⚠️ Este campo es requerido para documentos de clientes.
                    </p>
                  )}
                </div>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseInt(e.target.value) : e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required={field.required}
                  disabled={isReadOnly || field.disabled}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}

        {/* Sección personalizada (opcional) - puede ser función que recibe formData */}
        {typeof customSection === 'function' ? customSection(formData) : customSection}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {mode === 'view' ? 'Cerrar' : 'Cancelar'}
          </button>
          {mode !== 'view' && (
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar'}
            </button>
          )}
        </div>
      </form>
  );

  // Si se oculta el header, renderizar solo el formulario
  if (hideHeader) {
    return <div className="p-6">{formContent}</div>;
  }

  // Renderizar modal completo con header
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' && `➕ Crear ${title}`}
            {mode === 'edit' && `✏️ Editar ${title}`}
            {mode === 'view' && `👁️ Ver ${title}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✖️
          </button>
        </div>
        {formContent}
      </div>
    </div>
  );
};

export default SimpleFormModal;

