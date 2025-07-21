import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Vendedor.css';
import UsuarioForm from '../Usuario/UsuarioForm';

interface Client {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  direccion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  tipoCliente: string;
  tipoIdentificacion: string;
}

interface Weapon {
  id: string;
  modelo: string;
  calibre: string;
  capacidad: number;
  precio: number;
  imagen: string;
  disponible: boolean;
}

type Page = 'dashboard' | 'clientForm' | 'reserve' | 'userPhoto' | 'userUpdate' | 'userPassword';
type ClientFormMode = 'create' | 'view' | 'edit';

function Vendedor() {
  const [page, setPage] = useState<Page>('dashboard');
  const [clientFormMode, setClientFormMode] = useState<ClientFormMode>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      cedula: '1234567890',
      nombres: 'Juan',
      apellidos: 'Pérez',
      email: 'juan.perez@email.com',
      direccion: 'Calle Principal 123',
      telefonoPrincipal: '0987654321',
      tipoCliente: 'Civil',
      tipoIdentificacion: 'Cedula'
    },
    {
      id: '2',
      cedula: '0999999999',
      nombres: 'Seguridad S.A.',
      apellidos: '',
      email: 'contacto@seguridad.com',
      direccion: 'Av. Empresa 456',
      telefonoPrincipal: '022345678',
      tipoCliente: 'Empresa',
      tipoIdentificacion: 'RUC'
    },
    {
      id: '3',
      cedula: '1100110011',
      nombres: 'Carlos',
      apellidos: 'Ramírez',
      email: 'c.ramirez@militar.com',
      direccion: 'Base Militar',
      telefonoPrincipal: '099888777',
      tipoCliente: 'Uniformado',
      tipoIdentificacion: 'Cedula'
    },
    {
      id: '4',
      cedula: '0808080808',
      nombres: 'Ana',
      apellidos: 'Gómez',
      email: 'ana.gomez@deporte.com',
      direccion: 'Club Deportivo',
      telefonoPrincipal: '098123456',
      tipoCliente: 'Deportista',
      tipoIdentificacion: 'Cedula'
    }
  ]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tipoCliente, setTipoCliente] = useState('Civil');
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [weapons, setWeapons] = useState<Weapon[]>([
    {
      id: '1',
      modelo: 'Modelo A',
      calibre: '55',
      capacidad: 12,
      precio: 1000,
      imagen: '/weapon1.png',
      disponible: true
    },
    {
      id: '2',
      modelo: 'Modelo B',
      calibre: '45',
      capacidad: 15,
      precio: 1200,
      imagen: '/weapon2.png',
      disponible: true
    }
  ]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const closeUserMenu = () => {
    setShowUserMenu(false);
  };

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Hardcoded documents/questions by tipoCliente
  const docsByTipo: Record<string, string[]> = {
    Civil: ['Cédula', 'Certificado de antecedentes'],
    Empresa: ['RUC', 'Permiso de funcionamiento', 'Representante legal'],
    Uniformado: ['Cédula', 'Credencial policial'],
    Deportista: ['Cédula', 'Credencial club', 'Permiso deportivo']
  };
  const preguntasByTipo: Record<string, string[]> = {
    Civil: ['¿Ha tenido antecedentes?', '¿Motivo de compra?'],
    Empresa: ['¿Tipo de empresa?', '¿Cantidad de armas requeridas?'],
    Uniformado: ['¿Rango?', '¿Unidad?'],
    Deportista: ['¿Disciplina?', '¿Participa en competencias?']
  };

  // Remove static clientTypes and compute counts dynamically
  const clientTypeLabels: Record<string, string> = {
    Civil: 'Civiles',
    Empresa: 'Empresas de seguridad',
    Uniformado: 'Uniformados',
    Deportista: 'Deportistas'
  };
  const clientTypeOrder = ['Civil', 'Empresa', 'Uniformado', 'Deportista'];
  const clientTypeCounts = clientTypeOrder.map(type => ({
    type,
    label: clientTypeLabels[type],
    count: clients.filter(c => c.tipoCliente === type).length
  }));

  // Simulación: asignar un arma a algunos clientes
  const armaPorCliente: Record<string, Weapon | null> = {
    '1': weapons[0], // Juan tiene arma 1
    '2': null,       // Seguridad S.A. sin arma
    '3': weapons[1], // Carlos tiene arma 2
    '4': null        // Ana sin arma
  };

  // Identificar si un cliente es 'Cupo Civil'
  const isCupoCivil = (client: Client) => client.nombres.startsWith('Cupo Civil');

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simular creación de cliente
    const newClient: Client = {
      id: Date.now().toString(),
      cedula: '1234567890',
      nombres: 'Juan',
      apellidos: 'Pérez',
      email: 'juan.perez@email.com',
      direccion: 'Calle Principal 123',
      telefonoPrincipal: '0987654321',
      tipoCliente,
      tipoIdentificacion: 'Cedula'
    };
    setCurrentClient(newClient);
    setClients(prev => [...prev, newClient]);
    setPage('reserve');
  };

  const handleReserveWithoutClient = () => {
    setCurrentClient(null);
    setPage('reserve');
  };

  // Nueva función para asignar arma a cliente real
  const handleAssignWeaponToClient = (client: Client, weapon: Weapon) => {
    setArmasPorCliente(prev => ({ ...prev, [client.id]: weapon }));
    setPage('dashboard');
  };

  // Nueva función para asignar arma a cupo civil
  const handleAssignWeaponToCupoCivil = (weapon: Weapon) => {
    // Contar cuántos cupos civiles existen
    const cupoCivilCount = clients.filter(c => isCupoCivil(c)).length;
    const newCupoCivil: Client = {
      id: `cupo-civil-${Date.now()}`,
      cedula: '',
      nombres: `Cupo Civil #${cupoCivilCount + 1}`,
      apellidos: '',
      email: '',
      direccion: '',
      telefonoPrincipal: '',
      tipoCliente: 'Civil',
      tipoIdentificacion: 'Cedula',
    };
    setClients(prev => [...prev, newCupoCivil]);
    setArmasPorCliente(prev => ({ ...prev, [newCupoCivil.id]: weapon }));
    setPage('dashboard');
  };

  // When opening the form, set formData accordingly
  const openClientForm = (mode: ClientFormMode, client?: Client) => {
    setClientFormMode(mode);
    if (client) {
      setFormData({ ...client });
      setTipoCliente(client.tipoCliente);
    } else {
      setFormData({});
      setTipoCliente('Civil');
    }
    setPage('clientForm');
  };

  // Estado para armas por cliente
  const [armasPorCliente, setArmasPorCliente] = useState<Record<string, Weapon | null>>({});
  const [reservaParaCliente, setReservaParaCliente] = useState<Client | null>(null);

  return (
    <div className="vendedor-container">
      {/* Header */}
      <header className="vendedor-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="gear-icon">
              <img 
                src="/gear-icon.png" 
                alt="GMARM Gear Icon" 
                width="24" 
                height="24"
                style={{ objectFit: 'contain' }}
              />
            </span>
            <h1>GMARM - Vendedor</h1>
          </div>
          <div className="user-menu">
            <button onClick={toggleUserMenu} className="user-icon" aria-label="Menú de usuario">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
              </svg>
            </button>
            <div className={`user-dropdown ${showUserMenu ? 'show' : ''}`}>
              <a href="#" className="user-dropdown-item" onClick={() => { closeUserMenu(); setPage('userUpdate'); }}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146 2.854a.5.5 0 0 1 .708 0l.292.292a.5.5 0 0 1 0 .708l-8.5 8.5a.5.5 0 0 1-.168.11l-3 1a.5.5 0 0 1-.637-.637l1-3a.5.5 0 0 1 .11-.168l8.5-8.5zM11.207 3.5L12.5 4.793 11.793 5.5 10.5 4.207 11.207 3.5z"/>
                </svg>
                Actualizar datos
              </a>
              <a href="#" className="user-dropdown-item" onClick={() => { closeUserMenu(); setPage('userPassword'); }}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13A6 6 0 1 1 8 2a6 6 0 0 1 0 12z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3.793l2.146 2.147a.5.5 0 0 1-.708.708l-2.292-2.292A.5.5 0 0 1 7.5 8.5V4.5A.5.5 0 0 1 8 4z"/>
                </svg>
                Actualizar contraseña
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="vendedor-main">
        {page === 'dashboard' && (
          <div className="dashboard-section">
            <h2>Manejo de clientes y asignación de armas</h2>
            {/* Client Type Counts */}
            <div className="client-counts">
              {clientTypeCounts.map((clientType, index) => (
                <div key={index} className={`client-count-card badge-${clientType.type.toLowerCase()}`}>
                  <h3>{clientType.count}</h3>
                  <p>{clientType.label}</p>
                </div>
              ))}
            </div>
            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                onClick={() => openClientForm('create')} 
                className="action-btn primary"
              >
                Crear Cliente
              </button>
              <button 
                onClick={handleReserveWithoutClient} 
                className="action-btn secondary"
              >
                Reserva armas sin cliente
              </button>
            </div>
            {/* Client List Table */}
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
                          <td>{client.tipoCliente === 'Empresa' ? '' : client.apellidos}</td>
                          <td>{client.email}</td>
                          <td>{client.telefonoPrincipal}</td>
                          <td>
                            <span className={`badge badge-${client.tipoCliente.toLowerCase()}`}>
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
                                    openClientForm('view', client);
                                  }}
                                >
                                  Ver Detalle
                                </button>
                                <button
                                  className="action-menu-item"
                                  onClick={() => {
                                    setActionMenuOpen(null);
                                    openClientForm('edit', client);
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
          </div>
        )}

        {page === 'clientForm' && (
          <div className="create-section">
            <button className="action-btn secondary" style={{ marginBottom: 16 }} onClick={() => setPage('dashboard')}>
              ← Volver
            </button>
            <h2>
              {clientFormMode === 'create' && 'Creación de Cliente'}
              {clientFormMode === 'view' && 'Detalle de Cliente'}
              {clientFormMode === 'edit' && 'Editar Cliente'}
            </h2>
            <form className="client-form" onSubmit={clientFormMode === 'view' ? e => e.preventDefault() : handleClientSubmit}>
              {/* Client Type Selection */}
              <div className="form-group">
                <label htmlFor="tipoCliente">* Tipo de cliente:</label>
                <select id="tipoCliente" value={tipoCliente} onChange={e => setTipoCliente(e.target.value)} required disabled={clientFormMode !== 'create'}>
                  <option value="Civil">Civil</option>
                  <option value="Uniformado">Uniformado</option>
                  <option value="Empresa">Empresa</option>
                  <option value="Deportista">Deportista</option>
                </select>
              </div>

              {/* Identification Type */}
              <div className="form-group">
                <label htmlFor="tipoIdentificacion">* Tipo identificación:</label>
                <select id="tipoIdentificacion" value={formData.tipoIdentificacion || ''} onChange={e => setFormData(f => ({...f, tipoIdentificacion: e.target.value}))} required disabled={clientFormMode !== 'create'}>
                  <option value="Cedula">Cédula</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>

              {/* Basic Information */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="identificacion">* Número de Identificación:</label>
                  <input type="text" id="identificacion" value={formData.cedula || ''} onChange={e => setFormData(f => ({...f, cedula: e.target.value}))} required readOnly={clientFormMode !== 'create'} />
                </div>
                <div className="form-group">
                  <label htmlFor="nombres">* Nombres:</label>
                  <input type="text" id="nombres" value={formData.nombres || ''} onChange={e => setFormData(f => ({...f, nombres: e.target.value}))} required readOnly={clientFormMode !== 'create'} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="apellidos">* Apellidos:</label>
                  <input type="text" id="apellidos" value={formData.apellidos || ''} onChange={e => setFormData(f => ({...f, apellidos: e.target.value}))} required readOnly={clientFormMode !== 'create' || tipoCliente === 'Empresa'} />
                </div>
                <div className="form-group">
                  <label htmlFor="email">* Email:</label>
                  <input type="email" id="email" value={formData.email || ''} onChange={e => setFormData(f => ({...f, email: e.target.value}))} required readOnly={clientFormMode === 'view'} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="direccion">* Dirección:</label>
                <input type="text" id="direccion" value={formData.direccion || ''} onChange={e => setFormData(f => ({...f, direccion: e.target.value}))} required readOnly={clientFormMode === 'view'} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefonoPrincipal">* Teléfono Principal:</label>
                  <input type="tel" id="telefonoPrincipal" value={formData.telefonoPrincipal || ''} onChange={e => setFormData(f => ({...f, telefonoPrincipal: e.target.value}))} required readOnly={clientFormMode === 'view'} />
                </div>
                <div className="form-group">
                  <label htmlFor="telefonoSecundario">Teléfono Secundario:</label>
                  <input type="tel" id="telefonoSecundario" value={formData.telefonoSecundario || ''} onChange={e => setFormData(f => ({...f, telefonoSecundario: e.target.value}))} readOnly={clientFormMode === 'view'} />
                </div>
              </div>

              {/* Documents Section */}
              <div className="documents-section">
                <h3>Documentos requeridos</h3>
                {(docsByTipo[tipoCliente] || []).map((doc, index) => (
                  <div key={index} className="document-item">
                    <span className="document-name">{doc}</span>
                    <div className="document-upload">
                      <input type="file" id={`doc-${index}`} disabled={clientFormMode === 'view'} />
                      <span className="status valid">✓</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Questions Section */}
              <div className="questions-section">
                <h3>Preguntas</h3>
                {(preguntasByTipo[tipoCliente] || []).map((preg, idx) => (
                  <div className="form-group" key={idx}>
                    <label>{preg}</label>
                    <input type="text" readOnly={clientFormMode === 'view'} />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {clientFormMode !== 'view' && (
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {clientFormMode === 'create' ? 'Guardar información cliente' : 'Guardar cambios'}
                  </button>
                  <button 
                    type="button" 
                    className="reserve-btn"
                    onClick={() => {
                      setReservaParaCliente({ ...formData, id: formData.id || '' } as Client);
                      setPage('reserve');
                    }}
                  >
                    Reservar arma
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {page === 'reserve' && (
          <div className="reserve-section">
            <button className="action-btn secondary" style={{ marginBottom: 16 }} onClick={() => setPage('dashboard')}>
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
                      className={`assign-btn available`}
                      onClick={() => {
                        if (!currentClient && !reservaParaCliente) {
                          handleAssignWeaponToCupoCivil(weapon);
                        } else {
                          handleAssignWeaponToClient((currentClient || reservaParaCliente) as Client, weapon);
                          setReservaParaCliente(null);
                        }
                      }}
                    >
                      Asignar
                    </button>
                  </div>
                ))}
              </div>
              <button className="finish-btn">
                Terminar proceso
              </button>
            </div>
          </div>
        )}

        {page === 'userUpdate' && (
          <UsuarioForm onBack={() => setPage('dashboard')} />
        )}

        {/* Weapon Detail Modal */}
        {selectedWeapon && (
          <div className="weapon-detail-modal">
            <div className="modal-content">
              <h3>Detalle del Arma</h3>
              <img src={selectedWeapon.imagen} alt={selectedWeapon.modelo} />
              <p><strong>Modelo:</strong> {selectedWeapon.modelo}</p>
              <p><strong>Calibre:</strong> {selectedWeapon.calibre}</p>
              <p><strong>Capacidad:</strong> {selectedWeapon.capacidad}</p>
              <p><strong>Precio:</strong> ${selectedWeapon.precio}</p>
              <button onClick={() => setSelectedWeapon(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Vendedor; 