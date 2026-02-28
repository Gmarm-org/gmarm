import React, { useState, useEffect } from 'react';
import type { License } from '../../../services/adminApi';
import { licenseApi } from '../../../services/adminApi';
import { useClientCatalogs } from '../../Vendedor/hooks/useClientCatalogs';

interface CertificateData {
  file: File | null;
  password: string;
}

interface LicenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (license: Partial<License>, certData?: CertificateData) => Promise<void>;
  license?: License | null;
  mode: 'create' | 'edit' | 'view';
  onReload?: () => void;
}

const LicenseFormModal: React.FC<LicenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  license,
  mode,
  onReload
}) => {
  const {
    provincias,
    availableCantons,
    loadCantones,
    setAvailableCantons
  } = useClientCatalogs();

  const [formData, setFormData] = useState<Partial<License>>({
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
    cuenta_bancaria: '',
    nombre_banco: '',
    tipo_cuenta: '',
    cedula_cuenta: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Certificate state
  const [p12File, setP12File] = useState<File | null>(null);
  const [p12Password, setP12Password] = useState('');
  const [certUploading, setCertUploading] = useState(false);
  const [certMessage, setCertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (license && (mode === 'edit' || mode === 'view')) {
      setFormData(license);
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
        cuenta_bancaria: '',
        nombre_banco: '',
        tipo_cuenta: '',
        cedula_cuenta: ''
      });
      setAvailableCantons([]);
    }
    // Reset certificate state on open
    setP12File(null);
    setP12Password('');
    setCertMessage(null);
  }, [license, mode, isOpen, provincias, loadCantones, setAvailableCantons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    if (formData.ruc && formData.ruc.length > 13) {
      alert('El RUC no puede tener mas de 13 digitos');
      return;
    }
    if (formData.telefono && formData.telefono.length > 10) {
      alert('El telefono no puede tener mas de 10 digitos');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('El email no es valido');
      return;
    }
    if (p12File && !p12Password) {
      alert('Debe ingresar la contrasena del certificado .p12');
      return;
    }

    try {
      setIsSaving(true);
      const certData: CertificateData | undefined = p12File ? { file: p12File, password: p12Password } : undefined;
      await onSave(formData, certData);
      onClose();
    } catch (error) {
      console.error('Error guardando licencia:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.match(/\.(p12|pfx)$/i)) {
      alert('Solo se permiten archivos .p12 o .pfx');
      e.target.value = '';
      return;
    }
    setP12File(file);
    setCertMessage(null);
  };

  const handleUploadCertificate = async () => {
    if (!p12File || !p12Password || !license?.id) return;

    setCertUploading(true);
    setCertMessage(null);
    try {
      await licenseApi.uploadCertificate(license.id, p12File, p12Password);
      setCertMessage({ type: 'success', text: 'Certificado guardado exitosamente' });
      setP12File(null);
      setP12Password('');
      onReload?.();
    } catch (error: any) {
      const msg = error?.responseData?.error || error?.message || 'Error al subir el certificado';
      setCertMessage({ type: 'error', text: msg });
    } finally {
      setCertUploading(false);
    }
  };

  const handleDeleteCertificate = async () => {
    if (!license?.id) return;
    if (!window.confirm('Eliminar el certificado de firma electronica? Los documentos ya no se firmaran automaticamente.')) return;

    setCertUploading(true);
    setCertMessage(null);
    try {
      await licenseApi.deleteCertificate(license.id);
      setCertMessage({ type: 'success', text: 'Certificado eliminado' });
      onReload?.();
    } catch (error: any) {
      const msg = error?.responseData?.error || error?.message || 'Error al eliminar el certificado';
      setCertMessage({ type: 'error', text: msg });
    } finally {
      setCertUploading(false);
    }
  };

  const isReadOnly = mode === 'view';
  const hasCertificate = formData.tiene_certificado === true;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' && 'Crear Nueva Licencia'}
            {mode === 'edit' && 'Editar Licencia'}
            {mode === 'view' && 'Ver Licencia'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informacion Basica */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Informacion Basica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero de Licencia *</label>
                <input type="text" value={formData.numero || ''} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre/Razon Social *</label>
                <input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
                <input type="text" value={formData.titulo || ''} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} placeholder="Titulo de la licencia" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUC (max. 13 digitos)</label>
                <input type="text" value={formData.ruc || ''} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" maxLength={13} pattern="[0-9]*" disabled={isReadOnly} placeholder="1234567890001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" disabled={isReadOnly} placeholder="licencia@ejemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono (max. 10 digitos)</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Canton</label>
                <select
                  value={formData.canton || ''}
                  onChange={(e) => setFormData({ ...formData, canton: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isReadOnly || !formData.provincia}
                >
                  <option value="">Seleccionar canton</option>
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

          {/* Informacion Bancaria */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Informacion Bancaria</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero de Cuenta</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Cedula del Titular</label>
                <input type="text" value={formData.cedula_cuenta || ''} onChange={(e) => setFormData({ ...formData, cedula_cuenta: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" maxLength={10} pattern="[0-9]*" disabled={isReadOnly} placeholder="1234567890" />
              </div>
            </div>
          </div>

          {/* NOTA: Los cupos se manejan a nivel de Grupo de Importacion, no de Licencia */}

          {/* Descripcion */}
          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion/Observaciones</label>
            <textarea value={formData.descripcion || ''} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} disabled={isReadOnly} />
          </div>

          {/* Firma Electronica */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Firma Electronica</h3>

            {certMessage && (
              <div className={`mb-3 px-3 py-2 rounded-md text-sm ${certMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {certMessage.text}
              </div>
            )}

            {/* Current certificate status */}
            {hasCertificate && (
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Firma habilitada
                </span>
                {formData.certificado_huella && (
                  <span className="text-xs text-gray-500 font-mono">
                    SHA-256: {formData.certificado_huella.substring(0, 16)}...
                  </span>
                )}
              </div>
            )}

            {!hasCertificate && mode !== 'view' && (
              <p className="text-sm text-gray-500 mb-3">
                Si no se sube firma, los documentos no se firmaran electronicamente.
              </p>
            )}

            {!hasCertificate && mode === 'view' && (
              <p className="text-sm text-gray-400">Sin firma electronica configurada.</p>
            )}

            {/* Upload form (create or edit without cert, or edit to replace) */}
            {mode !== 'view' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Archivo .p12
                    </label>
                    <input
                      type="file"
                      accept=".p12,.pfx"
                      onChange={handleFileChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contrasena del certificado
                    </label>
                    <input
                      type="password"
                      value={p12Password}
                      onChange={(e) => setP12Password(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Contrasena del .p12"
                      disabled={!p12File}
                    />
                  </div>
                </div>

                {/* In edit mode with existing ID: upload immediately */}
                {mode === 'edit' && license?.id && p12File && p12Password && (
                  <button
                    type="button"
                    onClick={handleUploadCertificate}
                    disabled={certUploading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                  >
                    {certUploading ? 'Subiendo...' : 'Subir certificado'}
                  </button>
                )}

                {/* Delete certificate button */}
                {mode === 'edit' && hasCertificate && (
                  <button
                    type="button"
                    onClick={handleDeleteCertificate}
                    disabled={certUploading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm"
                  >
                    {certUploading ? 'Eliminando...' : 'Eliminar certificado'}
                  </button>
                )}

                {/* In create mode: info that cert will be uploaded after creation */}
                {mode === 'create' && p12File && (
                  <p className="text-xs text-blue-600">
                    El certificado se subira automaticamente al crear la licencia.
                  </p>
                )}
              </div>
            )}
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
