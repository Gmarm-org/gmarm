import React, { useState, useEffect } from 'react';
import type { Client, ClientFormMode, Weapon, LocationData } from '../types';
import { 
  toUpperCase, 
  validateCedula, 
  validateRUC, 
  validateTelefono,
  getEffectiveClientType
} from '../utils/clientUtils';
import {
  clientTypeLabels,
  clientTypeOrder,
  tiposDeCliente,
  tiposDeIdentificacion,
  docsByTipo,
  preguntasByTipo
} from '../HardcodedData';
import { ecuadorLocations } from '../../../data/ecuadorLocations';

interface ClientFormProps {
  mode: ClientFormMode;
  client?: Client;
  weapons: Weapon[];
  armaSeleccionadaEnReserva: Weapon | null;
  onBack: () => void;
  onSubmit: (client: Client) => void;
  onWeaponSelection: (weapon: Weapon) => void;
  onUpdateWeaponPrice: (weaponId: string, newPrice: number) => void;
  onUpdateWeaponQuantity: (weaponId: string, newQuantity: number) => void; // NUEVA PROP
}

const ClientForm: React.FC<ClientFormProps> = ({
  mode,
  client,
  weapons,
  armaSeleccionadaEnReserva,
  onBack,
  onSubmit,
  onWeaponSelection,
  onUpdateWeaponPrice,
  onUpdateWeaponQuantity
}) => {
  const [tipoCliente, setTipoCliente] = useState(client?.tipoCliente || 'Civil');
  const [estadoUniformado, setEstadoUniformado] = useState<'Activo' | 'Pasivo'>('Activo');
  const [formData, setFormData] = useState<Partial<Client>>(client || {});
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  const provincias = ecuadorLocations.map((l: any) => l.provincia);
  const cantones = formData.provincia
    ? ecuadorLocations.find((l: any) => l.provincia === formData.provincia)?.cantones || []
    : [];

  // Función para validar identificación según tipo
  const validateIdentificacion = (text: string, tipoIdentificacion: string) => {
    if (tipoIdentificacion === 'RUC') {
      return validateRUC(text);
    } else {
      return validateCedula(text);
    }
  };

  // Función para manejar cambios en identificación
  const handleIdentificacionChange = (value: string) => {
    const tipoIdentificacion = formData.tipoIdentificacion || 'Cedula';
    const validatedValue = validateIdentificacion(value, tipoIdentificacion);
    setFormData(prev => ({ ...prev, cedula: validatedValue }));
  };

  // Función para manejar cambios en teléfonos
  const handleTelefonoChange = (field: 'telefonoPrincipal' | 'telefonoSecundario', value: string) => {
    const validatedValue = validateTelefono(value);
    setFormData(prev => ({ ...prev, [field]: validatedValue }));
  };

  // Función para manejar cambios en RUC
  const handleRUCChange = (value: string) => {
    const validatedValue = validateRUC(value);
    setFormData(prev => ({ ...prev, ruc: validatedValue }));
  };

  // Función para manejar cambios en teléfono de referencia
  const handleTelefonoReferenciaChange = (value: string) => {
    const validatedValue = validateTelefono(value);
    setFormData(prev => ({ ...prev, telefonoReferencia: validatedValue }));
  };

  const handleCantidadChange = (weaponId: string, value: string) => {
    const cantidad = Math.max(1, parseInt(value.replace(/[^0-9]/g, '')) || 1);
    setCantidades(prev => ({ ...prev, [weaponId]: cantidad }));
    if (onUpdateWeaponQuantity) onUpdateWeaponQuantity(weaponId, cantidad);
  };
  const handlePrecioChange = (weaponId: string, value: string) => {
    const valid = value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    const match = valid.match(/^\d*(\.\d{0,2})?$/);
    if (match) {
      const newPrice = parseFloat(valid) || 0;
      onUpdateWeaponPrice(weaponId, newPrice);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newClient: Client = {
      id: formData.id || Date.now().toString(),
      cedula: formData.cedula || '',
      nombres: formData.nombres || '',
      apellidos: formData.apellidos || '',
      email: formData.email || '',
      direccion: formData.direccion || '',
      telefonoPrincipal: formData.telefonoPrincipal || '',
      telefonoSecundario: formData.telefonoSecundario || '',
      tipoCliente,
      tipoIdentificacion: formData.tipoIdentificacion || 'Cedula',
      ruc: formData.ruc,
      telefonoReferencia: formData.telefonoReferencia,
      direccionFiscal: formData.direccionFiscal,
      correoElectronico: formData.correoElectronico
    };
    
    onSubmit(newClient);
  };

  const esEmpresa = tipoCliente === 'Compañía de Seguridad';

  return (
    <div className="create-section">
      <button className="action-btn secondary" style={{ marginBottom: 16 }} onClick={onBack}>
        ← Volver
      </button>
      <h2>
        {mode === 'create' && 'Creación de Cliente'}
        {mode === 'view' && 'Detalle de Cliente'}
        {mode === 'edit' && 'Editar Cliente'}
      </h2>
      
      <form className="client-form" onSubmit={mode === 'view' ? e => e.preventDefault() : handleSubmit}>
        {/* Client Data Section */}
        {tipoCliente === 'Compañía de Seguridad' && (
          <div className="section-title">
            <h3>Datos de Representante Legal</h3>
          </div>
        )}

        {/* Fila 1 */}
        <div className="form-row">
          {/* 1. Tipo de cliente */}
          <div className="form-group">
            <label htmlFor="tipoCliente">* Tipo de cliente:</label>
            <select 
              id="tipoCliente" 
              value={tipoCliente} 
              onChange={e => setTipoCliente(e.target.value)} 
              required 
              disabled={mode !== 'create'}
            >
              {tiposDeCliente.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* 2. Tipo de identificación */}
          <div className="form-group">
            <label htmlFor="tipoIdentificacion">* Tipo identificación:</label>
            <select 
              id="tipoIdentificacion" 
              value={formData.tipoIdentificacion || ''} 
              onChange={e => setFormData(f => ({...f, tipoIdentificacion: e.target.value}))} 
              required 
              disabled={mode !== 'create'}
            >
              {tiposDeIdentificacion.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Militar en Estado Selection - Solo para Uniformado */}
        {tipoCliente === 'Uniformado' && (
          <div className="form-group">
            <label htmlFor="estadoUniformado">* Militar en Estado:</label>
            <select 
              id="estadoUniformado" 
              value={estadoUniformado} 
              onChange={e => setEstadoUniformado(e.target.value as 'Activo' | 'Pasivo')} 
              required 
              disabled={mode === 'view'}
            >
              <option value="Activo">Activo</option>
              <option value="Pasivo">Pasivo</option>
            </select>
            {estadoUniformado === 'Pasivo' && (
              <div className="info-message" style={{ 
                marginTop: '8px', 
                padding: '8px 12px', 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #0ea5e9', 
                borderRadius: '4px',
                color: '#0c4a6e',
                fontSize: '0.875rem'
              }}>
                ⓘ El proceso será como el de un cliente Civil
              </div>
            )}
          </div>
        )}

        {/* Fila 2 */}
        <div className="form-row">
          {/* 3. Número de identificación */}
          <div className="form-group">
            <label htmlFor="identificacion">* Número de Identificación{tipoCliente === 'Compañía de Seguridad' ? ' Representante Legal' : ''}:</label>
            <input 
              type="text" 
              id="identificacion" 
              value={formData.cedula || ''} 
              onChange={e => handleIdentificacionChange(e.target.value)} 
              required 
              readOnly={mode !== 'create'} 
              maxLength={formData.tipoIdentificacion === 'RUC' ? 13 : 10}
            />
          </div>

          {/* 4. Apellidos */}
          <div className="form-group">
            <label htmlFor="apellidos">* Apellidos{tipoCliente === 'Compañía de Seguridad' ? ' Representante Legal' : ''}:</label>
            <input 
              type="text" 
              id="apellidos" 
              value={formData.apellidos || ''} 
              onChange={e => setFormData(f => ({...f, apellidos: toUpperCase(e.target.value)}))} 
              required 
              readOnly={mode !== 'create' || tipoCliente === 'Compañía de Seguridad'} 
            />
          </div>
        </div>

        {/* Fila 3 */}
        <div className="form-row">
          {/* 5. Nombres */}
          <div className="form-group">
            <label htmlFor="nombres">* Nombres{tipoCliente === 'Compañía de Seguridad' ? ' Representante Legal' : ''}:</label>
            <input 
              type="text" 
              id="nombres" 
              value={formData.nombres || ''} 
              onChange={e => setFormData(f => ({...f, nombres: toUpperCase(e.target.value)}))} 
              required 
              readOnly={mode !== 'create'} 
            />
          </div>

          {/* 6. Email */}
          <div className="form-group">
            <label htmlFor="email">* Email{tipoCliente === 'Compañía de Seguridad' ? ' Representante Legal' : ''}:</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email || ''} 
              onChange={e => setFormData(f => ({...f, email: e.target.value.toLowerCase()}))} 
              required 
              readOnly={mode === 'view'} 
            />
          </div>
        </div>

        {/* Fila 4 */}
        <div className="form-row">
          {/* 7. Provincia */}
          <div className="form-group">
            <label htmlFor="provincia">* Provincia:</label>
            <select
              id="provincia"
              value={formData.provincia || ''}
              onChange={e => setFormData(f => ({ ...f, provincia: e.target.value, canton: '', ciudad: '' }))}
              required
            >
              <option value="">Seleccione provincia</option>
              {provincias.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* 8. Cantón */}
          <div className="form-group">
            <label htmlFor="canton">* Cantón:</label>
            <select
              id="canton"
              value={formData.canton || ''}
              onChange={e => setFormData(f => ({ ...f, canton: e.target.value, ciudad: '' }))}
              required
              disabled={!formData.provincia}
            >
              <option value="">Seleccione cantón</option>
              {cantones.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>



        {/* 10. Dirección - Ocupa ambos espacios */}
        <div className="form-group full-width">
          <label htmlFor="direccion">* Dirección{tipoCliente === 'Compañía de Seguridad' ? ' Representante Legal' : ''}:</label>
          <input 
            type="text" 
            id="direccion" 
            value={formData.direccion || ''} 
            onChange={e => setFormData(f => ({...f, direccion: toUpperCase(e.target.value)}))} 
            required 
            readOnly={mode === 'view'} 
            placeholder="Calle principal, calle secundaria, número"
          />
        </div>

        <div className="form-row">
          {/* 11. Teléfono principal */}
          <div className="form-group">
            <label htmlFor="telefonoPrincipal">* Teléfono Principal{tipoCliente === 'Compañía de Seguridad' ? ' Representante Legal' : ''}:</label>
            <input 
              type="tel" 
              id="telefonoPrincipal" 
              value={formData.telefonoPrincipal || ''} 
              onChange={e => handleTelefonoChange('telefonoPrincipal', e.target.value)} 
              required 
              readOnly={mode === 'view'} 
              maxLength={10}
            />
          </div>

          {/* 12. Teléfono secundario */}
          <div className="form-group">
            <label htmlFor="telefonoSecundario">Teléfono Secundario{tipoCliente === 'Compañía de Seguridad' ? ' Representante Legal' : ''}:</label>
            <input 
              type="tel" 
              id="telefonoSecundario" 
              value={formData.telefonoSecundario || ''} 
              onChange={e => handleTelefonoChange('telefonoSecundario', e.target.value)} 
              readOnly={mode === 'view'} 
              maxLength={10}
            />
          </div>
        </div>

        {/* Company Data Section - Only for Compañía de Seguridad */}
        {tipoCliente === 'Compañía de Seguridad' && (
          <div className="company-section">
            <div className="section-title">
              <h3>Datos de Compañía</h3>
            </div>
            
            {/* 1. RUC */}
            <div className="form-group">
              <label htmlFor="ruc">* RUC:</label>
              <input 
                type="text" 
                id="ruc" 
                value={formData.ruc || ''} 
                onChange={e => handleRUCChange(e.target.value)} 
                required 
                readOnly={mode === 'view'} 
                maxLength={13}
              />
            </div>

            {/* 2. Correo electrónico */}
            <div className="form-group">
              <label htmlFor="correoElectronico">* Correo electrónico:</label>
              <input 
                type="email" 
                id="correoElectronico" 
                value={formData.correoElectronico || ''} 
                onChange={e => setFormData(f => ({...f, correoElectronico: e.target.value.toLowerCase()}))} 
                required 
                readOnly={mode === 'view'} 
              />
            </div>

            {/* 3. Provincia, Cantón */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="provinciaCompania">* Provincia:</label>
                <select
                  id="provinciaCompania"
                  value={formData.provinciaCompania || ''}
                  onChange={e => setFormData(f => ({ ...f, provinciaCompania: e.target.value, cantonCompania: '' }))}
                  required
                >
                  <option value="">Seleccione provincia</option>
                  {provincias.map((p: string) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cantonCompania">* Cantón:</label>
                <select
                  id="cantonCompania"
                  value={formData.cantonCompania || ''}
                  onChange={e => setFormData(f => ({ ...f, cantonCompania: e.target.value }))}
                  required
                  disabled={!formData.provinciaCompania}
                >
                  <option value="">Seleccione cantón</option>
                  {cantones.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 4. Dirección fiscal */}
            <div className="form-group">
              <label htmlFor="direccionFiscal">* Dirección fiscal:</label>
              <input 
                type="text" 
                id="direccionFiscal" 
                value={formData.direccionFiscal || ''} 
                onChange={e => setFormData(f => ({...f, direccionFiscal: toUpperCase(e.target.value)}))} 
                required 
                readOnly={mode === 'view'} 
              />
            </div>

            {/* 5. Teléfono de referencia */}
            <div className="form-group">
              <label htmlFor="telefonoReferencia">* Teléfono de referencia:</label>
              <input 
                type="tel" 
                id="telefonoReferencia" 
                value={formData.telefonoReferencia || ''} 
                onChange={e => handleTelefonoReferenciaChange(e.target.value)} 
                required 
                readOnly={mode === 'view'} 
                maxLength={10}
              />
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div className="documents-section">
          <h3>Documentos requeridos</h3>
          {(docsByTipo[getEffectiveClientType(tipoCliente, estadoUniformado)] || []).map((doc: string, index: number) => (
            <div key={index} className="document-item">
              <span className="document-name">{doc}</span>
              <div className="document-upload">
                <input type="file" id={`doc-${index}`} disabled={mode === 'view'} />
                <span className="status valid">✓</span>
              </div>
            </div>
          ))}
        </div>

        {/* Questions Section */}
        <div className="questions-section">
          <h3>Preguntas</h3>
          {(preguntasByTipo[getEffectiveClientType(tipoCliente, estadoUniformado)] || []).map((preg: string, idx: number) => (
            <div className="form-group" key={idx}>
              <label>{preg}</label>
              <input type="text" readOnly={mode === 'view'} />
            </div>
          ))}
        </div>

        {/* Weapon Selection Section - Only for edit mode */}
        {mode === 'edit' && (
          <div className="weapon-selection-section">
            <h3>Arma Asignada</h3>
            <div style={{ 
              marginBottom: '1rem', 
              padding: '0.8rem', 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #0ea5e9', 
              borderRadius: '6px',
              color: '#0c4a6e',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              ⓘ Selecciona un nuevo modelo de arma si deseas cambiarlo
            </div>
            <div className="weapons-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {weapons.map(weapon => {
                const iva = 0.15;
                const cantidad = cantidades[weapon.id] || 1;
                const precioFinal = (weapon.precio * cantidad) * (1 + iva);
                return (
                  <div key={weapon.id} className="weapon-card" style={{ 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc'
                  }}>
                    <img src={weapon.imagen} alt={weapon.modelo} style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0.5rem 0', fontSize: '1rem' }}>{weapon.modelo}</h4>
                    <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#6b7280' }}>Calibre: {weapon.calibre}</p>
                    <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#6b7280' }}>Capacidad: {weapon.capacidad}</p>
                    <div style={{ margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Precio Base:</label>
                        <input
                          type="text"
                          value={weapon.precio.toFixed(2)}
                          onChange={e => handlePrecioChange(weapon.id, e.target.value)}
                          style={{
                            width: '70px',
                            padding: '0.2rem',
                            fontSize: '0.8rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '3px',
                            MozAppearance: 'textfield',
                            appearance: 'textfield'
                          }}
                          inputMode="decimal"
                          pattern="^\\d*(\\.\\d{0,2})?$"
                        />
                        {esEmpresa && (
                          <>
                            <label style={{ fontSize: '0.8rem', fontWeight: '500', marginLeft: 8 }}>Cantidad:</label>
                            <input
                              type="text"
                              value={cantidad}
                              onChange={e => handleCantidadChange(weapon.id, e.target.value)}
                              style={{
                                width: '50px',
                                padding: '0.2rem',
                                fontSize: '0.8rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '3px',
                                MozAppearance: 'textfield',
                                appearance: 'textfield'
                              }}
                              inputMode="numeric"
                              pattern="^\\d+$"
                            />
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
                        <span>IVA (15%):</span>
                        <span>${(weapon.precio * cantidad * iva).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', color: '#1f2937', marginTop: '0.25rem' }}>
                        <span>Precio Final:</span>
                        <span>${precioFinal.toFixed(2)}</span>
                      </div>
                    </div>
                    <button 
                      className={`assign-btn ${armaSeleccionadaEnReserva?.id === weapon.id ? 'assigned' : 'available'}`}
                      onClick={() => onWeaponSelection(weapon)}
                      style={{ 
                        marginTop: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      {armaSeleccionadaEnReserva?.id === weapon.id ? 'Seleccionado' : 'Seleccionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {mode !== 'view' && (
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {mode === 'create' ? 'Selección de modelo' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ClientForm; 