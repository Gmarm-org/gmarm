import React from 'react';
import type { Weapon, Client } from '../types';

interface WeaponReserveProps {
  weapons: Weapon[];
  currentClient: Client | null;
  reservaParaCliente: Client | null;
  clienteParaResumen: Client | null;
  armaSeleccionadaEnReserva: Weapon | null;
  onBack: () => void;
  onWeaponSelection: (weapon: Weapon | null) => void;
  onWeaponSelectionInReserve: (weapon: Weapon | null) => void;
  onAssignWeaponToClient: (client: Client, weapon: Weapon) => void;
  onAssignWeaponToCupoCivil: (weapon: Weapon) => void;
  onConfirmData: () => void;
  onUpdateWeaponPrice: (weaponId: string, newPrice: number) => void;
  onUpdateWeaponQuantity: (weaponId: string, newQuantity: number) => void;
}

const WeaponReserve: React.FC<WeaponReserveProps> = ({
  weapons,
  currentClient,
  reservaParaCliente,
  clienteParaResumen,
  armaSeleccionadaEnReserva,
  onBack,
  onWeaponSelection,
  onWeaponSelectionInReserve,
  onAssignWeaponToClient,
  onAssignWeaponToCupoCivil,
  onConfirmData,
  onUpdateWeaponPrice,
  onUpdateWeaponQuantity
}) => {
  // Estado local para cantidades por arma
  const [cantidades, setCantidades] = React.useState<Record<string, number>>({});

  // Handler para cantidad
  const handleCantidadChange = (weaponId: string, value: string) => {
    const cantidad = Math.max(1, parseInt(value.replace(/[^0-9]/g, '')) || 1);
    setCantidades(prev => ({ ...prev, [weaponId]: cantidad }));
    if (onUpdateWeaponQuantity) onUpdateWeaponQuantity(weaponId, cantidad);
  };

  // Handler para precio
  const handlePrecioChange = (weaponId: string, value: string) => {
    // Solo números y máximo 2 decimales
    const valid = value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    const match = valid.match(/^\d*(\.\d{0,2})?$/);
    if (match) {
      const newPrice = parseFloat(valid) || 0;
      onUpdateWeaponPrice(weaponId, newPrice);
    }
  };

  // Determinar si es empresa
  const esEmpresa = (currentClient?.tipoCliente === 'Compañía de Seguridad' || reservaParaCliente?.tipoCliente === 'Compañía de Seguridad' || clienteParaResumen?.tipoCliente === 'Compañía de Seguridad');

  const handleWeaponClick = (weapon: Weapon) => {
    if (!currentClient && !reservaParaCliente && !clienteParaResumen) {
      // Para "Reserva armas sin cliente" - permitir selección/deselección
      if (armaSeleccionadaEnReserva?.id === weapon.id) {
        // Si ya está seleccionada, la deselecciona
        onWeaponSelectionInReserve(null);
      } else {
        // Si no está seleccionada, la selecciona
        onWeaponSelectionInReserve(weapon);
      }
    } else if (clienteParaResumen) {
      // Para cliente en proceso de creación
      if (armaSeleccionadaEnReserva?.id === weapon.id) {
        // Si ya está seleccionada, la deselecciona
        onWeaponSelectionInReserve(null);
      } else {
        // Si no está seleccionada, la selecciona
        onWeaponSelectionInReserve(weapon);
      }
    } else {
      // Para cliente existente - asignación directa
      onAssignWeaponToClient((currentClient || reservaParaCliente) as Client, weapon);
    }
  };

  return (
    <div className="reserve-section">
      <button className="action-btn secondary" style={{ marginBottom: 16 }} onClick={onBack}>
        ← Volver
      </button>
      <h2>Reserva de Armas</h2>
      <div className="reserve-content">
        {/* Mostrar campo de cliente solo si hay cliente seleccionado */}
        {(currentClient || reservaParaCliente) && (
          <div className="form-group">
            <label htmlFor="clientName">Nombre de cliente:</label>
            <input 
              type="text" 
              id="clientName" 
              value={`${(currentClient || reservaParaCliente)?.nombres || ''} ${(currentClient || reservaParaCliente)?.apellidos || ''}`}
              readOnly
              style={{ 
                backgroundColor: '#f0f9ff',
                color: '#1e40af'
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
              Cliente seleccionado automáticamente desde la creación
            </small>
          </div>
        )}

        {/* Mensaje informativo para cliente en proceso o reserva sin cliente */}
        {(clienteParaResumen || (!currentClient && !reservaParaCliente)) && (
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
            ⓘ Selecciona un modelo de arma para continuar
          </div>
        )}

        {/* Weapon Selection Grid */}
        <div className="weapons-grid">
          {weapons.map(weapon => {
            const iva = 0.15;
            const cantidad = cantidades[weapon.id] || 1;
            const precioFinal = (weapon.precio * cantidad) * (1 + iva);
            
            return (
              <div key={weapon.id} className="weapon-card">
                <img src={weapon.imagen} alt={weapon.modelo} />
                <h3>{weapon.modelo}</h3>
                <p>Calibre: {weapon.calibre}</p>
                <p>Capacidad: {weapon.capacidad}</p>
                
                {/* Sección de Precio Editable */}
                <div style={{ margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Precio Base:</label>
                    <input
                      type="text"
                      value={weapon.precio.toFixed(2)}
                      onChange={e => handlePrecioChange(weapon.id, e.target.value)}
                      style={{
                        width: '80px',
                        padding: '0.25rem',
                        fontSize: '0.85rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        MozAppearance: 'textfield',
                        appearance: 'textfield'
                      }}
                      inputMode="decimal"
                      pattern="^\\d*(\\.\\d{0,2})?$"
                    />
                    {/* Cantidad solo para empresas */}
                    {esEmpresa && (
                      <>
                        <label style={{ fontSize: '0.85rem', fontWeight: '500', marginLeft: 8 }}>Cantidad:</label>
                        <input
                          type="text"
                          value={cantidad}
                          onChange={e => handleCantidadChange(weapon.id, e.target.value)}
                          style={{
                            width: '50px',
                            padding: '0.25rem',
                            fontSize: '0.85rem',
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
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280' }}>
                    <span>IVA (15%):</span>
                    <span>${(weapon.precio * cantidad * iva).toFixed(2)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', marginTop: '0.25rem' }}>
                    <span>Precio Final:</span>
                    <span>${precioFinal.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  className={`assign-btn ${armaSeleccionadaEnReserva?.id === weapon.id ? 'assigned' : 'available'}`}
                  onClick={() => handleWeaponClick(weapon)}
                >
                  {armaSeleccionadaEnReserva?.id === weapon.id ? 'Seleccionado' : 'Asignar'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Botón Confirmar datos para cliente en proceso o reserva sin cliente */}
        {(clienteParaResumen || (!currentClient && !reservaParaCliente)) && (
          <button 
            className="finish-btn" 
            onClick={onConfirmData}
            disabled={!armaSeleccionadaEnReserva}
            style={{ 
              opacity: armaSeleccionadaEnReserva ? 1 : 0.5,
              cursor: armaSeleccionadaEnReserva ? 'pointer' : 'not-allowed'
            }}
          >
            Confirmar datos
          </button>
        )}
      </div>
    </div>
  );
};

export default WeaponReserve; 