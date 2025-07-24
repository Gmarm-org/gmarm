import React, { useState, useRef, useEffect } from 'react';
import type { Client, Weapon, ClientFormMode } from '../types';
import { isCupoCivil } from '../utils/clientUtils';
import ClientTable from './ClientTable';

interface DashboardProps {
  clients: Client[];
  armasPorCliente: Record<string, Weapon | null>;
  clientTypeCounts: Array<{ type: string; label: string; count: number }>;
  onOpenClientForm: (mode: ClientFormMode, client?: Client) => void;
  onReserveWithoutClient: () => void;
  onAssignWeaponToClient: (client: Client, weapon: Weapon) => void;
  onAssignWeaponToCupoCivil: (weapon: Weapon) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  clients,
  armasPorCliente,
  clientTypeCounts,
  onOpenClientForm,
  onReserveWithoutClient,
  onAssignWeaponToClient,
  onAssignWeaponToCupoCivil
}) => {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  // Cerrar el menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(null);
      }
    };
    if (actionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuOpen]);

  return (
    <div className="dashboard-section">
      <h2>Manejo de clientes y asignación de armas</h2>
      
      {/* Client Type Counts */}
      <div className="client-counts">
        {clientTypeCounts.map((clientType, index) => (
          <div key={index} className={`client-count-card badge-${clientType.type.toLowerCase().replace(/\s+/g, '-')}`}>
            <h3>{clientType.count}</h3>
            <p>{clientType.label}</p>
          </div>
        ))}
      </div>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={() => onOpenClientForm('create')} 
          className="action-btn primary"
        >
          Crear Cliente
        </button>
        <button 
          onClick={onReserveWithoutClient} 
          className="action-btn secondary"
        >
          Reserva armas sin cliente
        </button>
      </div>
      
      {/* Client List Table */}
      <ClientTable
        clients={clients}
        armasPorCliente={armasPorCliente}
        actionMenuOpen={actionMenuOpen}
        setActionMenuOpen={setActionMenuOpen}
        actionMenuRef={actionMenuRef}
        onOpenClientForm={onOpenClientForm}
        onAssignWeaponToClient={onAssignWeaponToClient}
        onAssignWeaponToCupoCivil={onAssignWeaponToCupoCivil}
      />
    </div>
  );
};

export default Dashboard; 