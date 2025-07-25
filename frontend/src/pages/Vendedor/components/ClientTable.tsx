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
      
      {/* Tabla para Desktop */}
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

      {/* Tarjetas para Móvil */}
      <div className="client-cards">
        {clients.length === 0 ? (
          <div className="empty-table" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontStyle: 'italic' }}>
            No hay clientes registrados
          </div>
        ) : (
          clients.map(client => {
            const arma = armasPorCliente[client.id] || null;
            return (
              <div key={`card-${client.id}`} className="client-card">
                <div className="client-card-header">
                  <div className="client-card-name">
                    {client.nombres} {client.tipoCliente === 'Compañía de Seguridad' ? '' : client.apellidos}
                  </div>
                  <span className={`client-card-badge badge-${client.tipoCliente.toLowerCase().replace(/\s+/g, '-')}`}>
                    {client.tipoCliente}
                  </span>
                </div>
                
                <div className="client-card-details">
                  <div className="client-card-row">
                    <span className="client-card-label">Cédula:</span>
                    <span className="client-card-value">{client.cedula}</span>
                  </div>
                  <div className="client-card-row">
                    <span className="client-card-label">Email:</span>
                    <span className="client-card-value">{client.email}</span>
                  </div>
                  <div className="client-card-row">
                    <span className="client-card-label">Teléfono:</span>
                    <span className="client-card-value">{client.telefonoPrincipal}</span>
                  </div>
                  <div className="client-card-row">
                    <span className="client-card-label">Arma:</span>
                    <div className="client-card-value">
                      {arma ? (
                        <div className="client-card-weapon">
                          <img src={arma.imagen} alt={arma.modelo} />
                          <span>{arma.modelo}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="client-card-actions">
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
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: '2.5rem',
                        zIndex: 10000,
                        minWidth: '140px',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        padding: '0.3rem 0'
                      }}
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ClientTable; 