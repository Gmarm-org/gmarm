import React from 'react';
import type { Client, Weapon, ClientFormMode } from '../types';
import { isCupoCivil } from '../utils/clientUtils';

interface ClientTableProps {
  clients: Client[];
  armasPorCliente: Record<string, Weapon | null>;
  actionMenuOpen: string | null;
  setActionMenuOpen: (id: string | null) => void;
  actionMenuRef: React.RefObject<HTMLDivElement>;
  onOpenClientForm: (mode: ClientFormMode, client?: Client) => void;
  onAssignWeaponToClient: (client: Client, weapon: Weapon) => void;
  onAssignWeaponToCupoCivil: (weapon: Weapon) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  armasPorCliente,
  actionMenuOpen,
  setActionMenuOpen,
  actionMenuRef,
  onOpenClientForm,
  onAssignWeaponToClient,
  onAssignWeaponToCupoCivil
}) => {
  return (
    <div className="client-table-container">
      <h3>Lista de Clientes</h3>
      <table className="client-table">
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Tipo Cliente</th>
            <th>Arma seleccionada</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-table">
                No hay clientes registrados
              </td>
            </tr>
          ) : (
            clients.map(client => {
              const arma = armasPorCliente[client.id] || null;
              return (
                <tr key={client.id}>
                  <td>{client.cedula}</td>
                  <td>{client.nombres}</td>
                  <td>{client.tipoCliente === 'Compañía de Seguridad' ? '' : client.apellidos}</td>
                  <td>{client.email}</td>
                  <td>{client.telefonoPrincipal}</td>
                  <td>
                    <span className={`badge badge-${client.tipoCliente.toLowerCase().replace(/\s+/g, '-')}`}>
                      {client.tipoCliente}
                    </span>
                  </td>
                  <td>
                    {arma ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={arma.imagen} alt={arma.modelo} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
                        <span style={{ fontSize: '0.95rem', color: '#374151' }}>{arma.modelo}</span>
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.95rem' }}>—</span>
                    )}
                  </td>
                  <td className="client-actions" style={{ position: 'relative' }}>
                    <button
                      className="action-menu-btn"
                      aria-label="Acciones"
                      onClick={e => {
                        e.stopPropagation();
                        setActionMenuOpen(actionMenuOpen === client.id ? null : client.id);
                      }}
                    >
                      <span className="action-menu-icon">⋯</span>
                    </button>
                    {actionMenuOpen === client.id && (
                      <div
                        ref={actionMenuRef}
                        className="action-menu-dropdown"
                      >
                        <button
                          className="action-menu-item"
                          onClick={() => {
                            setActionMenuOpen(null);
                            onOpenClientForm('view', client);
                          }}
                        >
                          Ver Detalle
                        </button>
                        <button
                          className="action-menu-item"
                          onClick={() => {
                            setActionMenuOpen(null);
                            onOpenClientForm('edit', client);
                          }}
                        >
                          Editar
                        </button>
                        {/* Inhabilitar: siempre para clientes reales, solo si tiene arma para cupo civil */}
                        {(!isCupoCivil(client) || (isCupoCivil(client) && arma)) && (
                          <button
                            className="action-menu-item danger"
                            onClick={() => {
                              setActionMenuOpen(null);
                              alert('Inhabilitar cliente (simulado)');
                            }}
                          >
                            Inhabilitar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable; 