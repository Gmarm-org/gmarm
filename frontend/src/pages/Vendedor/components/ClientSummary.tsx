import React, { useState } from 'react';
import type { Client, Weapon } from '../types';
import { toUpperCase, validateCedula, validateRUC, validateTelefono } from '../utils/clientUtils';
import { useIVA } from '../../../hooks/useConfiguracion';
import { getWeaponImageUrl } from '../../../utils/imageUtils';

interface ClientSummaryProps {
  clienteParaResumen: Client | null;
  armaSeleccionada: Weapon | null;
  onBack: () => void;
  onSaveClient: () => void;
  cantidadesArmas?: Record<string, number>; // NUEVO
}

const ClientSummary: React.FC<ClientSummaryProps> = ({
  clienteParaResumen,
  armaSeleccionada,
  onBack,
  onSaveClient,
  cantidadesArmas
}) => {
  const [editandoResumen, setEditandoResumen] = useState(false);
  const [datosEditables, setDatosEditables] = useState<Partial<Client>>({});

  // Obtener IVA dinámicamente desde la BD
  const { iva, ivaPorcentaje } = useIVA();

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
    if (!clienteParaResumen) return;
    const tipoIdentificacion = datosEditables.tipoIdentificacion || clienteParaResumen.tipoIdentificacion;
    const validatedValue = validateIdentificacion(value, tipoIdentificacion || '');
    setDatosEditables(prev => ({ ...prev, cedula: validatedValue }));
  };

  // Función para manejar cambios en teléfonos
  const handleTelefonoChange = (field: 'telefonoPrincipal' | 'telefonoSecundario', value: string) => {
    const validatedValue = validateTelefono(value);
    setDatosEditables(prev => ({ ...prev, [field]: validatedValue }));
  };

  // Función para manejar cambios en RUC
  const handleRUCChange = (value: string) => {
    const validatedValue = validateRUC(value);
    setDatosEditables(prev => ({ ...prev, ruc: validatedValue }));
  };

  // Función para manejar cambios en teléfono de referencia
  const handleTelefonoReferenciaChange = (value: string) => {
    const validatedValue = validateTelefono(value);
    setDatosEditables(prev => ({ ...prev, telefonoReferencia: validatedValue }));
  };

  // Función para guardar cambios en el resumen
  const handleSaveChanges = () => {
    if (clienteParaResumen) {
      // Aquí se actualizaría el cliente con los datos editables
      setEditandoResumen(false);
    }
  };

  if (!clienteParaResumen || !armaSeleccionada) {
    return null;
  }

  const cantidad = (clienteParaResumen?.tipoClienteEsEmpresa && cantidadesArmas && armaSeleccionada) ? (cantidadesArmas[armaSeleccionada.id] || 1) : 1;
  const precioBase = armaSeleccionada.precioReferencia * cantidad;
  const ivaTotal = precioBase * iva;
  const precioFinal = precioBase + ivaTotal;

  return (
    <div className="summary-section">
      <button className="action-btn secondary" style={{ marginBottom: 16 }} onClick={onBack}>
        ← Volver
      </button>
      <h2>Resumen de Cliente</h2>
      <div className="summary-content">
        <div className="summary-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Datos del Cliente</h3>
            <button 
              className="action-btn secondary" 
              onClick={() => setEditandoResumen(!editandoResumen)}
              style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
            >
              {editandoResumen ? 'Cancelar' : 'Editar'}
            </button>
          </div>
          <div className="client-summary">
            <div className="summary-row">
              <span className="summary-label">Tipo de Cliente:</span>
              {editandoResumen ? (
                <select 
                  value={datosEditables.tipoCliente || clienteParaResumen.tipoCliente} 
                  onChange={e => setDatosEditables(prev => ({...prev, tipoCliente: e.target.value}))}
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  <option value="Civil">Civil</option>
                  <option value="Uniformado">Uniformado</option>
                  <option value="Compañía de Seguridad">Compañía de Seguridad</option>
                  <option value="Deportista">Deportista</option>
                </select>
              ) : (
                <span className="summary-value">{clienteParaResumen.tipoCliente}</span>
              )}
            </div>
            <div className="summary-row">
              <span className="summary-label">Identificación:</span>
              {editandoResumen ? (
                <input 
                  type="text" 
                  value={datosEditables.numeroIdentificacion || clienteParaResumen.numeroIdentificacion} 
                  onChange={e => handleIdentificacionChange(e.target.value)} 
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  maxLength={clienteParaResumen.tipoIdentificacion === 'RUC' ? 13 : 10}
                />
              ) : (
                <span className="summary-value">{clienteParaResumen.numeroIdentificacion}</span>
              )}
            </div>
            <div className="summary-row">
              <span className="summary-label">Nombres:</span>
              {editandoResumen ? (
                <input 
                  type="text" 
                  value={datosEditables.nombres || clienteParaResumen.nombres} 
                  onChange={e => setDatosEditables(prev => ({...prev, nombres: toUpperCase(e.target.value)}))} 
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              ) : (
                <span className="summary-value">{clienteParaResumen.nombres}</span>
              )}
            </div>
            <div className="summary-row">
              <span className="summary-label">Apellidos:</span>
              {editandoResumen ? (
                <input 
                  type="text" 
                  value={datosEditables.apellidos || clienteParaResumen.apellidos} 
                  onChange={e => setDatosEditables(prev => ({...prev, apellidos: toUpperCase(e.target.value)}))} 
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              ) : (
                <span className="summary-value">{clienteParaResumen.apellidos}</span>
              )}
            </div>
            <div className="summary-row">
              <span className="summary-label">Email:</span>
              {editandoResumen ? (
                <input 
                  type="email" 
                  value={datosEditables.email || clienteParaResumen.email} 
                  onChange={e => setDatosEditables(prev => ({...prev, email: e.target.value.toLowerCase()}))} 
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              ) : (
                <span className="summary-value">{clienteParaResumen.email}</span>
              )}
            </div>
            <div className="summary-row">
              <span className="summary-label">Dirección:</span>
              {editandoResumen ? (
                <input 
                  type="text" 
                  value={datosEditables.direccion || clienteParaResumen.direccion} 
                  onChange={e => setDatosEditables(prev => ({...prev, direccion: toUpperCase(e.target.value)}))} 
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              ) : (
                <span className="summary-value">{clienteParaResumen.direccion}</span>
              )}
            </div>
            <div className="summary-row">
              <span className="summary-label">Teléfono Principal:</span>
              {editandoResumen ? (
                <input 
                  type="tel" 
                  value={datosEditables.telefonoPrincipal || clienteParaResumen.telefonoPrincipal} 
                  onChange={e => handleTelefonoChange('telefonoPrincipal', e.target.value)} 
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  maxLength={10}
                />
              ) : (
                <span className="summary-value">{clienteParaResumen.telefonoPrincipal}</span>
              )}
            </div>
            {(clienteParaResumen.telefonoSecundario || editandoResumen) && (
              <div className="summary-row">
                <span className="summary-label">Teléfono Secundario:</span>
                {editandoResumen ? (
                  <input 
                    type="tel" 
                    value={datosEditables.telefonoSecundario || clienteParaResumen.telefonoSecundario || ''} 
                    onChange={e => handleTelefonoChange('telefonoSecundario', e.target.value)} 
                    style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    maxLength={10}
                  />
                ) : (
                  <span className="summary-value">{clienteParaResumen.telefonoSecundario}</span>
                )}
              </div>
            )}
            {(clienteParaResumen.tipoClienteEsMilitar || clienteParaResumen.tipoClienteEsPolicia) && (
              <>
                {clienteParaResumen.estadoMilitar && (
                  <div className="summary-row">
                    <span className="summary-label">Estado Militar:</span>
                    <span className="summary-value">{clienteParaResumen.estadoMilitar}</span>
                  </div>
                )}
                {clienteParaResumen.rango && (
                  <div className="summary-row">
                    <span className="summary-label">Rango:</span>
                    <span className="summary-value">{clienteParaResumen.rango}</span>
                  </div>
                )}
                {clienteParaResumen.codigoIssfa && (
                  <div className="summary-row">
                    <span className="summary-label">Código ISSFA:</span>
                    <span className="summary-value">{clienteParaResumen.codigoIssfa}</span>
                  </div>
                )}
              </>
            )}
            {clienteParaResumen.tipoClienteEsEmpresa && (
              <>
                <div className="summary-row">
                  <span className="summary-label">RUC:</span>
                  {editandoResumen ? (
                    <input 
                      type="text" 
                      value={datosEditables.ruc || clienteParaResumen.ruc || ''} 
                      onChange={e => handleRUCChange(e.target.value)} 
                      style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      maxLength={13}
                    />
                  ) : (
                    <span className="summary-value">{clienteParaResumen.ruc}</span>
                  )}
                </div>
                <div className="summary-row">
                  <span className="summary-label">Teléfono de Referencia:</span>
                  {editandoResumen ? (
                    <input 
                      type="tel" 
                      value={datosEditables.telefonoReferencia || clienteParaResumen.telefonoReferencia || ''} 
                      onChange={e => handleTelefonoReferenciaChange(e.target.value)} 
                      style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      maxLength={10}
                    />
                  ) : (
                    <span className="summary-value">{clienteParaResumen.telefonoReferencia}</span>
                  )}
                </div>
                <div className="summary-row">
                  <span className="summary-label">Dirección Fiscal:</span>
                  {editandoResumen ? (
                    <input 
                      type="text" 
                      value={datosEditables.direccionFiscal || clienteParaResumen.direccionFiscal || ''} 
                      onChange={e => setDatosEditables(prev => ({...prev, direccionFiscal: toUpperCase(e.target.value)}))} 
                      style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                  ) : (
                    <span className="summary-value">{clienteParaResumen.direccionFiscal}</span>
                  )}
                </div>
                <div className="summary-row">
                  <span className="summary-label">Correo Electrónico:</span>
                  {editandoResumen ? (
                    <input 
                      type="email" 
                      value={datosEditables.correoEmpresa || clienteParaResumen.correoEmpresa || ''} 
                      onChange={e => setDatosEditables(prev => ({...prev, correoEmpresa: e.target.value.toLowerCase()}))} 
                      style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                  ) : (
                    <span className="summary-value">{clienteParaResumen.correoEmpresa}</span>
                  )}
                </div>
              </>
            )}
          </div>
          {editandoResumen && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button className="action-btn primary" onClick={handleSaveChanges}>
                Guardar Cambios
              </button>
            </div>
          )}
        </div>
        
        <div className="summary-card">
          <h3>Arma Seleccionada</h3>
          {armaSeleccionada && (
            <div className="weapon-summary">
              <img src={`${getWeaponImageUrl(armaSeleccionada.urlImagen)}?t=${Date.now()}`} alt={armaSeleccionada.nombre} />
              <div className="weapon-details">
                <p style={{ 
                  margin: '0.2rem 0', 
                  fontSize: '1rem',
                  color: '#1f2937',
                  fontWeight: '600'
                }}><strong>Modelo:</strong> {armaSeleccionada.nombre}</p>
                <p><strong>Calibre:</strong> {armaSeleccionada.calibre}</p>
                <p><strong>Código:</strong> {armaSeleccionada.codigo}</p>
                {clienteParaResumen?.tipoClienteEsEmpresa && (
                  <p><strong>Cantidad:</strong> {cantidad}</p>
                )}
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                  <p style={{ 
                    margin: '0.2rem 0', 
                    fontSize: '0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      color: '#6b7280'
                    }}>Precio Base:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>${precioBase.toFixed(2)}</span>
                  </p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    <strong>IVA ({ivaPorcentaje}%):</strong> ${ivaTotal.toFixed(2)}
                  </p>
                  <p style={{ 
                    margin: '0.2rem 0', 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    color: '#059669',
                    padding: '0.3rem 0.5rem',
                    backgroundColor: '#d1fae5',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Precio Final:</span>
                    <span>${precioFinal.toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="summary-actions">
          <button className="submit-btn" onClick={onSaveClient}>
            Terminar Proceso
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientSummary; 