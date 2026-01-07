import React from 'react';
import type { Client, Weapon, ClientFormMode } from '../types';
import { isCupoCivil } from '../utils/clientUtils';
import { getWeaponImageUrlWithCacheBusting } from '../../../utils/imageUtils';

interface ClientTableProps {
  clients: Client[];
  armasPorCliente: Record<string, Weapon | null>;
  onOpenClientForm: (mode: ClientFormMode, client?: Client) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  armasPorCliente,
  onOpenClientForm
}) => {


  return (
    <div className="client-table-container">
      <h3>Lista de Clientes</h3>

      
      {/* Tabla para Desktop */}
      <table className="client-table">
        <thead>
          <tr>
            <th>Identificación</th>
            <th>Cliente / Empresa</th>
            <th>Contacto</th>
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
                  <td>{client.numeroIdentificacion}</td>
                  <td>
                    {client.tipoCliente === 'Compañía de Seguridad' ? (
                      <div>
                        <div><strong>{client.nombreEmpresa}</strong></div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          Rep: {client.nombres} {client.apellidos}
                        </div>
                      </div>
                    ) : (
                      `${client.nombres} ${client.apellidos}`
                    )}
                  </td>
                  <td>
                    {client.tipoCliente === 'Compañía de Seguridad' ? client.correoEmpresa : client.email}
                  </td>
                  <td>
                    {client.tipoCliente === 'Compañía de Seguridad' ? client.telefonoReferencia : client.telefonoPrincipal}
                  </td>
                  <td>
                    <span className={`badge badge-${(client.tipoClienteNombre || client.tipoProcesoNombre)?.toLowerCase().replace(/\s+/g, '-') || 'default'}`}>
                      {client.tipoClienteNombre || client.tipoProcesoNombre || 'Sin tipo'}
                    </span>
                  </td>
                  <td>
                    {arma ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img 
                          src={getWeaponImageUrlWithCacheBusting(arma.urlImagen)} 
                          alt={arma.nombre} 
                          style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, border: '1px solid #e5e7eb', background: '#f3f4f6' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <span style={{ fontSize: '0.95rem', color: '#374151' }}>{arma.nombre}</span>
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.95rem' }}>—</span>
                    )}
                  </td>
                  <td className="client-actions" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => onOpenClientForm('view', client)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.8rem',
                          background: '#0ea5e9',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => onOpenClientForm('edit', client)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.8rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Editar
                      </button>
                      {(!isCupoCivil(client) || (isCupoCivil(client) && arma)) && (
                        <button
                          onClick={() => alert('Inhabilitar cliente (simulado)')}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Inhabilitar
                        </button>
                      )}
                    </div>
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
                  <span className={`client-card-badge badge-${(client.tipoClienteNombre || client.tipoProcesoNombre)?.toLowerCase().replace(/\s+/g, '-') || 'default'}`}>
                    {client.tipoClienteNombre || client.tipoProcesoNombre || 'Sin tipo'}
                  </span>
                </div>
                
                <div className="client-card-details">
                  <div className="client-card-row">
                    <span className="client-card-label">Cédula:</span>
                    <span className="client-card-value">{client.numeroIdentificacion}</span>
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
                          <img 
                            src={getWeaponImageUrlWithCacheBusting(arma.urlImagen)} 
                            alt={arma.nombre}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <span>{arma.nombre}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="client-card-actions">
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => onOpenClientForm('view', client)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.8rem',
                        background: '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => onOpenClientForm('edit', client)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.8rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Editar
                    </button>
                    {(!isCupoCivil(client) || (isCupoCivil(client) && arma)) && (
                      <button
                        onClick={() => alert('Inhabilitar cliente (simulado)')}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.8rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Inhabilitar
                      </button>
                    )}
                  </div>
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