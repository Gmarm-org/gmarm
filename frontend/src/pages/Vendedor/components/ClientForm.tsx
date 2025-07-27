import React, { useState, useEffect } from 'react';
import apiService from '../../../services/api';
import { ecuadorProvinces } from '../../../data/ecuadorLocations';
import { calcularEdad, validarEdadMinima, obtenerMensajeErrorEdad } from '../../../utils/ageValidation';
import './ClientForm.css';

interface Client {
  id?: number;
  nombres: string;
  apellidos: string;
  email: string;
  numeroIdentificacion: string;
  tipoCliente: string;
  tipoIdentificacion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  direccion: string;
  provincia?: string;
  canton?: string;
  fechaNacimiento?: string;
  representanteLegal?: string;
  ruc?: string;
  nombreEmpresa?: string;
  direccionFiscal?: string;
  telefonoReferencia?: string;
  correoEmpresa?: string;
  provinciaEmpresa?: string;
  cantonEmpresa?: string;
  estadoMilitar?: string;
}

interface ClientFormProps {
  mode: 'create' | 'edit' | 'view';
  client?: Client | null;
  onSave: () => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ mode, client, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Client>({
    nombres: '',
    apellidos: '',
    email: '',
    numeroIdentificacion: '',
    tipoCliente: '',
    tipoIdentificacion: '',
    telefonoPrincipal: '',
    telefonoSecundario: '',
    direccion: '',
    provincia: '',
    canton: '',
    fechaNacimiento: '',
    representanteLegal: '',
    ruc: '',
    nombreEmpresa: '',
    direccionFiscal: '',
    telefonoReferencia: '',
    correoEmpresa: '',
    provinciaEmpresa: '',
    cantonEmpresa: '',
    estadoMilitar: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableCantons, setAvailableCantons] = useState<string[]>([]);
  const [availableCantonsEmpresa, setAvailableCantonsEmpresa] = useState<string[]>([]);

  // Tipos de cliente y identificación
  const tiposCliente = [
    { id: 1, nombre: 'Civil', codigo: 'CIVIL' },
    { id: 2, nombre: 'Militar', codigo: 'MILITAR' },
    { id: 3, nombre: 'Empresa Seguridad', codigo: 'EMPRESA' },
    { id: 4, nombre: 'Deportista', codigo: 'DEPORTISTA' }
  ];

  const tiposIdentificacion = [
    { id: 1, nombre: 'Cédula', codigo: 'CEDULA' },
    { id: 2, nombre: 'RUC', codigo: 'RUC' },
    { id: 3, nombre: 'Pasaporte', codigo: 'PASAPORTE' }
  ];

  useEffect(() => {
    if (client && mode !== 'create') {
      setFormData(client);
    }
  }, [client, mode]);

  useEffect(() => {
    if (formData.provincia) {
      const cantons = ecuadorProvinces.find(p => p.nombre === formData.provincia)?.cantones || [];
      setAvailableCantons(cantons.map(c => c.nombre));
    }
  }, [formData.provincia]);

  useEffect(() => {
    if (formData.provinciaEmpresa) {
      const cantons = ecuadorProvinces.find(p => p.nombre === formData.provinciaEmpresa)?.cantones || [];
      setAvailableCantonsEmpresa(cantons.map(c => c.nombre));
    }
  }, [formData.provinciaEmpresa]);

  const handleInputChange = (field: keyof Client, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'create') {
        await apiService.createCliente(formData);
      } else if (mode === 'edit') {
        await apiService.updateCliente(client!.id!, formData);
      }
      onSave();
    } catch (error: any) {
      console.error('Error saving client:', error);
      setError(error.message || 'Error al guardar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpresa = formData.tipoCliente === 'Empresa Seguridad';
  const isUniformado = formData.tipoCliente === 'Militar';

  const getMaxLength = () => {
    if (formData.tipoIdentificacion === 'Cédula') return 10;
    if (formData.tipoIdentificacion === 'RUC') return 13;
    return 20;
  };

  const validateForm = () => {
    if (!formData.nombres.trim()) return false;
    if (!formData.apellidos.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!formData.numeroIdentificacion.trim()) return false;
    if (!formData.tipoCliente) return false;
    if (!formData.tipoIdentificacion) return false;
    if (!formData.telefonoPrincipal.trim()) return false;
    if (!formData.direccion.trim()) return false;
    if (!formData.provincia) return false;
    if (!formData.canton) return false;

    if (isEmpresa) {
      if (!formData.ruc?.trim()) return false;
      if (!formData.nombreEmpresa?.trim()) return false;
      if (!formData.direccionFiscal?.trim()) return false;
      if (!formData.telefonoReferencia?.trim()) return false;
      if (!formData.correoEmpresa?.trim()) return false;
      if (!formData.provinciaEmpresa) return false;
      if (!formData.cantonEmpresa) return false;
    }

    if (isUniformado && !formData.estadoMilitar) return false;

    return true;
  };

  return (
    <div className="client-form-container">
      <div className="form-header">
        <h2>
          {mode === 'create' && 'Crear Nuevo Cliente'}
          {mode === 'edit' && 'Editar Cliente'}
          {mode === 'view' && 'Ver Cliente'}
        </h2>
        <button onClick={onCancel} className="close-button">✕</button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="client-form">
        {/* Datos Personales */}
        <div className="form-section">
          <h3>Datos Personales</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Tipo de Cliente *</label>
              <select
                value={formData.tipoCliente}
                onChange={(e) => handleInputChange('tipoCliente', e.target.value)}
                disabled={mode === 'view'}
                required
              >
                <option value="">Seleccionar tipo</option>
                {tiposCliente.map(tipo => (
                  <option key={tipo.id} value={tipo.nombre}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Identificación *</label>
              <select
                value={formData.tipoIdentificacion}
                onChange={(e) => handleInputChange('tipoIdentificacion', e.target.value)}
                disabled={mode === 'view'}
                required
              >
                <option value="">Seleccionar tipo</option>
                {tiposIdentificacion.map(tipo => (
                  <option key={tipo.id} value={tipo.nombre}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {isUniformado && (
              <div className="form-group">
                <label>Estado Militar *</label>
                <select
                  value={formData.estadoMilitar}
                  onChange={(e) => handleInputChange('estadoMilitar', e.target.value)}
                  disabled={mode === 'view'}
                  required
                >
                  <option value="">Seleccionar estado</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="PASIVO">Pasivo</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Número de Identificación *</label>
              <input
                type="text"
                value={formData.numeroIdentificacion}
                onChange={(e) => handleInputChange('numeroIdentificacion', e.target.value)}
                maxLength={getMaxLength()}
                disabled={mode === 'view'}
                required
                placeholder={`Ingrese ${formData.tipoIdentificacion || 'identificación'}`}
              />
            </div>

            <div className="form-group">
              <label>Apellidos *</label>
              <input
                type="text"
                value={formData.apellidos}
                onChange={(e) => handleInputChange('apellidos', e.target.value.toUpperCase())}
                disabled={mode === 'view'}
                required
                placeholder="Ingrese apellidos"
              />
            </div>

            <div className="form-group">
              <label>Nombres *</label>
              <input
                type="text"
                value={formData.nombres}
                onChange={(e) => handleInputChange('nombres', e.target.value.toUpperCase())}
                disabled={mode === 'view'}
                required
                placeholder="Ingrese nombres"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                disabled={mode === 'view'}
                required
                placeholder="Ingrese email"
              />
            </div>

            <div className="form-group">
              <label>Fecha de Nacimiento *</label>
              <input
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                disabled={mode === 'view'}
                required
                max={new Date().toISOString().split('T')[0]}
                placeholder="Seleccione fecha de nacimiento"
              />
              {formData.fechaNacimiento && (
                <div className="age-validation">
                  {(() => {
                    const edad = calcularEdad(formData.fechaNacimiento);
                    const puedeComprar = validarEdadMinima(formData.fechaNacimiento);
                    const mensajeError = obtenerMensajeErrorEdad(formData.fechaNacimiento);
                    
                    return (
                      <div className={`age-info ${puedeComprar ? 'valid' : 'invalid'}`}>
                        <span>Edad: {edad} años</span>
                        {mensajeError && (
                          <span className="error-message">⚠️ {mensajeError}</span>
                        )}
                        {puedeComprar && (
                          <span className="success-message">✅ Puede comprar armas</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Provincia *</label>
              <select
                value={formData.provincia}
                onChange={(e) => {
                  handleInputChange('provincia', e.target.value);
                  handleInputChange('canton', '');
                }}
                disabled={mode === 'view'}
                required
              >
                <option value="">Seleccionar provincia</option>
                {ecuadorProvinces.map(province => (
                  <option key={province.nombre} value={province.nombre}>
                    {province.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Cantón *</label>
              <select
                value={formData.canton}
                onChange={(e) => handleInputChange('canton', e.target.value)}
                disabled={mode === 'view' || !formData.provincia}
                required
              >
                <option value="">Seleccionar cantón</option>
                {availableCantons.map(canton => (
                  <option key={canton} value={canton}>
                    {canton}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Dirección *</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                disabled={mode === 'view'}
                required
                placeholder="Ingrese dirección completa"
              />
            </div>

            <div className="form-group">
              <label>Teléfono Principal *</label>
              <input
                type="tel"
                value={formData.telefonoPrincipal}
                onChange={(e) => handleInputChange('telefonoPrincipal', e.target.value)}
                disabled={mode === 'view'}
                required
                maxLength={10}
                placeholder="Ingrese teléfono"
              />
            </div>

            <div className="form-group">
              <label>Teléfono Secundario</label>
              <input
                type="tel"
                value={formData.telefonoSecundario}
                onChange={(e) => handleInputChange('telefonoSecundario', e.target.value)}
                disabled={mode === 'view'}
                maxLength={10}
                placeholder="Teléfono secundario (opcional)"
              />
            </div>
          </div>
        </div>

        {/* Datos de Compañía */}
        {isEmpresa && (
          <div className="form-section">
            <h3>Datos de Compañía</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>RUC *</label>
                <input
                  type="text"
                  value={formData.ruc}
                  onChange={(e) => handleInputChange('ruc', e.target.value)}
                  disabled={mode === 'view'}
                  required
                  maxLength={13}
                  placeholder="Ingrese RUC"
                />
              </div>

              <div className="form-group">
                <label>Correo Electrónico *</label>
                <input
                  type="email"
                  value={formData.correoEmpresa}
                  onChange={(e) => handleInputChange('correoEmpresa', e.target.value.toLowerCase())}
                  disabled={mode === 'view'}
                  required
                  placeholder="Ingrese correo de la empresa"
                />
              </div>

              <div className="form-group">
                <label>Provincia *</label>
                <select
                  value={formData.provinciaEmpresa}
                  onChange={(e) => {
                    handleInputChange('provinciaEmpresa', e.target.value);
                    handleInputChange('cantonEmpresa', '');
                  }}
                  disabled={mode === 'view'}
                  required
                >
                  <option value="">Seleccionar provincia</option>
                  {ecuadorProvinces.map(province => (
                    <option key={province.nombre} value={province.nombre}>
                      {province.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cantón *</label>
                <select
                  value={formData.cantonEmpresa}
                  onChange={(e) => handleInputChange('cantonEmpresa', e.target.value)}
                  disabled={mode === 'view' || !formData.provinciaEmpresa}
                  required
                >
                  <option value="">Seleccionar cantón</option>
                  {availableCantonsEmpresa.map(canton => (
                    <option key={canton} value={canton}>
                      {canton}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Dirección Fiscal *</label>
                <input
                  type="text"
                  value={formData.direccionFiscal}
                  onChange={(e) => handleInputChange('direccionFiscal', e.target.value)}
                  disabled={mode === 'view'}
                  required
                  placeholder="Ingrese dirección fiscal"
                />
              </div>

              <div className="form-group">
                <label>Teléfono de Referencia *</label>
                <input
                  type="tel"
                  value={formData.telefonoReferencia}
                  onChange={(e) => handleInputChange('telefonoReferencia', e.target.value)}
                  disabled={mode === 'view'}
                  required
                  maxLength={10}
                  placeholder="Ingrese teléfono de referencia"
                />
              </div>

              <div className="form-group">
                <label>Nombre de la Empresa *</label>
                <input
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={(e) => handleInputChange('nombreEmpresa', e.target.value.toUpperCase())}
                  disabled={mode === 'view'}
                  required
                  placeholder="Ingrese nombre de la empresa"
                />
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancelar
          </button>
          
          {mode !== 'view' && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !validateForm()}
            >
              {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ClientForm; 