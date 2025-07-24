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
  onConfirmData
}) => {
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
          {weapons.map(weapon => (
            <div key={weapon.id} className="weapon-card">
              <img src={weapon.imagen} alt={weapon.modelo} />
              <h3>{weapon.modelo}</h3>
              <p>Calibre: {weapon.calibre}</p>
              <p>Capacidad: {weapon.capacidad}</p>
              <p>Precio: ${weapon.precio}</p>
              <button 
                className={`assign-btn ${armaSeleccionadaEnReserva?.id === weapon.id ? 'assigned' : 'available'}`}
                onClick={() => handleWeaponClick(weapon)}
              >
                {armaSeleccionadaEnReserva?.id === weapon.id ? 'Seleccionado' : 'Asignar'}
              </button>
            </div>
          ))}
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