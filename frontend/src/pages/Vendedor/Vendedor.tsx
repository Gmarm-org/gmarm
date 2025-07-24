import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Vendedor.css';
import UsuarioForm from '../Usuario/UsuarioForm';
import UserMenu from '../../components/UserMenu';
import Dashboard from './components/Dashboard';
import ClientForm from './components/ClientForm';
import WeaponReserve from './components/WeaponReserve';
import ClientSummary from './components/ClientSummary';

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
  ruc?: string;
  telefonoReferencia?: string;
  direccionFiscal?: string;
  correoElectronico?: string;
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

type Page = 'dashboard' | 'clientForm' | 'reserve' | 'summary' | 'userPhoto' | 'userUpdate' | 'userPassword';
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
      tipoCliente: 'Compañía de Seguridad',
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
  const [estadoUniformado, setEstadoUniformado] = useState<'Activo' | 'Pasivo'>('Activo');
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
    'Compañía de Seguridad': ['RUC', 'Permiso de funcionamiento', 'Representante legal'],
    Uniformado: ['Cédula', 'Credencial policial'],
    Deportista: ['Cédula', 'Credencial club', 'Permiso deportivo']
  };
  const preguntasByTipo: Record<string, string[]> = {
    Civil: ['¿Ha tenido antecedentes?', '¿Motivo de compra?'],
    'Compañía de Seguridad': ['¿Tipo de empresa?', '¿Cantidad de armas requeridas?'],
    Uniformado: ['¿Rango?', '¿Unidad?'],
    Deportista: ['¿Disciplina?', '¿Participa en competencias?']
  };

  // Remove static clientTypes and compute counts dynamically
  const clientTypeLabels: Record<string, string> = {
    Civil: 'Civiles',
    'Compañía de Seguridad': 'Compañías de seguridad',
    Uniformado: 'Uniformados',
    Deportista: 'Deportistas'
  };
  const clientTypeOrder = ['Civil', 'Compañía de Seguridad', 'Uniformado', 'Deportista'];
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

  const handleClientSubmit = (client: Client) => {
    if (clientFormMode === 'edit' && client.id) {
      // Modo edición: actualizar cliente existente
      const updatedClient: Client = {
        ...client,
        cedula: client.cedula || '',
        nombres: client.nombres || '',
        apellidos: client.apellidos || '',
        email: client.email || '',
        direccion: client.direccion || '',
        telefonoPrincipal: client.telefonoPrincipal || '',
        telefonoSecundario: client.telefonoSecundario || '',
        tipoCliente: client.tipoCliente,
        tipoIdentificacion: client.tipoIdentificacion || 'Cedula',
        ruc: client.ruc,
        telefonoReferencia: client.telefonoReferencia,
        direccionFiscal: client.direccionFiscal,
        correoElectronico: client.correoElectronico
      };
      
      // Actualizar cliente en la lista
      setClients(prev => prev.map(c => 
        c.id === client.id ? updatedClient : c
      ));
      
      // Actualizar arma asignada si se cambió
      if (armaSeleccionadaEnReserva && client.id) {
        setArmasPorCliente(prev => ({ 
          ...prev, 
          [client.id]: armaSeleccionadaEnReserva 
        }));
      }
      
      // Limpiar estados
      setArmaSeleccionadaEnReserva(null);
      setFormData({});
      setPage('dashboard');
    } else {
      // Modo creación: crear cliente temporal para el resumen
      setClienteParaResumen(client);
      setPage('reserve');
    }
  };

  const handleReserveWithoutClient = () => {
    setCurrentClient(null);
    setArmaSeleccionadaEnReserva(null); // Limpiar arma seleccionada
    setPage('reserve');
  };

  // Nueva función para asignar arma a cliente real
  const handleAssignWeaponToClient = (client: Client, weapon: Weapon) => {
    setArmasPorCliente(prev => ({ ...prev, [client.id]: weapon }));
    setPage('dashboard');
  };

  // Función para manejar selección de arma en el flujo de creación
  const handleWeaponSelection = (weapon: Weapon | null) => {
    if (weapon) {
      setArmaSeleccionada(weapon);
      setPage('summary');
    } else {
      // Si se pasa null, significa que se deseleccionó el arma
      setArmaSeleccionadaEnReserva(null);
    }
  };

  // Función para manejar selección/deselección de arma en reserva
  const handleWeaponSelectionInReserve = (weapon: Weapon | null) => {
    if (weapon) {
      setArmaSeleccionadaEnReserva(weapon);
    } else {
      setArmaSeleccionadaEnReserva(null);
    }
  };



  // Función para confirmar datos y ir al resumen
  const handleConfirmData = () => {
    if (armaSeleccionadaEnReserva) {
      if (clienteParaResumen) {
        // Para cliente en proceso de creación
        setArmaSeleccionada(armaSeleccionadaEnReserva);
        setDatosEditables({ ...clienteParaResumen });
        setPage('summary');
      } else {
        // Para reserva sin cliente - crear cupo civil
        handleAssignWeaponToCupoCivil(armaSeleccionadaEnReserva);
      }
    }
  };

  // Función para guardar cambios en el resumen
  const handleSaveChanges = () => {
    if (clienteParaResumen) {
      setClienteParaResumen({ ...clienteParaResumen, ...datosEditables });
      setEditandoResumen(false);
    }
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

  // Función para guardar cliente final
  const handleSaveClient = () => {
    if (clienteParaResumen && armaSeleccionada) {
      // Asignar el arma al cliente
      setArmasPorCliente(prev => ({ ...prev, [clienteParaResumen.id]: armaSeleccionada }));
      // Agregar el cliente a la lista
      setClients(prev => [...prev, clienteParaResumen]);
      // Limpiar estados temporales
      setClienteParaResumen(null);
      setArmaSeleccionada(null);
      setArmaSeleccionadaEnReserva(null);
      setFormData({});
      setEditandoResumen(false);
      setDatosEditables({});
      setPage('dashboard');
    }
  };

  // When opening the form, set formData accordingly
  const openClientForm = (mode: ClientFormMode, client?: Client) => {
    setClientFormMode(mode);
    if (client) {
      setFormData({ ...client });
      setTipoCliente(client.tipoCliente);
      // Si es modo edición, cargar el arma asignada
      if (mode === 'edit') {
        const armaAsignada = armasPorCliente[client.id];
        if (armaAsignada) {
          setArmaSeleccionadaEnReserva(armaAsignada);
        }
      }
    } else {
      setFormData({});
      setTipoCliente('Civil');
      setEstadoUniformado('Activo');
    }
    setPage('clientForm');
  };

  // Función para convertir texto a mayúsculas
  const toUpperCase = (text: string) => text.toUpperCase();
  
  // Función para validar que solo sean números
  const validateNumbersOnly = (text: string) => text.replace(/[^0-9]/g, '');
  
  // Función para obtener el tipo de cliente efectivo (considerando estado de uniformado)
  const getEffectiveClientType = () => {
    if (tipoCliente === 'Uniformado' && estadoUniformado === 'Pasivo') {
      return 'Civil';
    }
    return tipoCliente;
  };

  // Estado para armas por cliente
  const [armasPorCliente, setArmasPorCliente] = useState<Record<string, Weapon | null>>({});
  const [reservaParaCliente, setReservaParaCliente] = useState<Client | null>(null);
  const [clienteParaResumen, setClienteParaResumen] = useState<Client | null>(null);
  const [armaSeleccionada, setArmaSeleccionada] = useState<Weapon | null>(null);
  const [armaSeleccionadaEnReserva, setArmaSeleccionadaEnReserva] = useState<Weapon | null>(null);
  const [editandoResumen, setEditandoResumen] = useState(false);
  const [datosEditables, setDatosEditables] = useState<Partial<Client>>({});

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
          <UserMenu
            onUpdate={() => setPage('userUpdate')}
            onLogout={handleLogout}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="vendedor-main">
        {page === 'dashboard' && (
          <Dashboard
            clients={clients}
            armasPorCliente={armasPorCliente}
            clientTypeCounts={clientTypeCounts}
            onOpenClientForm={openClientForm}
            onReserveWithoutClient={handleReserveWithoutClient}
            onAssignWeaponToClient={handleAssignWeaponToClient}
            onAssignWeaponToCupoCivil={handleAssignWeaponToCupoCivil}
          />
        )}

        {page === 'clientForm' && (
          <ClientForm
            mode={clientFormMode}
            client={selectedClient || undefined}
            weapons={weapons}
            armaSeleccionadaEnReserva={armaSeleccionadaEnReserva}
            onBack={() => setPage('dashboard')}
            onSubmit={handleClientSubmit}
            onWeaponSelection={handleWeaponSelectionInReserve}
          />
        )}

        {page === 'reserve' && (
          <WeaponReserve
            weapons={weapons}
            currentClient={currentClient}
            reservaParaCliente={reservaParaCliente}
            clienteParaResumen={clienteParaResumen}
            armaSeleccionadaEnReserva={armaSeleccionadaEnReserva}
            onBack={() => setPage('dashboard')}
            onWeaponSelection={handleWeaponSelectionInReserve}
            onWeaponSelectionInReserve={handleWeaponSelectionInReserve}
            onAssignWeaponToClient={handleAssignWeaponToClient}
            onAssignWeaponToCupoCivil={handleAssignWeaponToCupoCivil}
            onConfirmData={handleConfirmData}
          />
        )}

        {page === 'summary' && (
          <div className="summary-section">
            <button className="action-btn secondary" style={{ marginBottom: 16 }} onClick={() => setPage('reserve')}>
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
                {clienteParaResumen && (
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
                          value={datosEditables.cedula || clienteParaResumen.cedula} 
                          onChange={e => setDatosEditables(prev => ({...prev, cedula: validateNumbersOnly(e.target.value)}))}
                          style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        />
                      ) : (
                        <span className="summary-value">{clienteParaResumen.cedula}</span>
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
                          onChange={e => setDatosEditables(prev => ({...prev, telefonoPrincipal: validateNumbersOnly(e.target.value)}))}
                          style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
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
                            onChange={e => setDatosEditables(prev => ({...prev, telefonoSecundario: validateNumbersOnly(e.target.value)}))}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                          />
                        ) : (
                          <span className="summary-value">{clienteParaResumen.telefonoSecundario}</span>
                        )}
                      </div>
                    )}
                    {(clienteParaResumen.tipoCliente === 'Compañía de Seguridad' || datosEditables.tipoCliente === 'Compañía de Seguridad') && (
                      <>
                        <div className="summary-row">
                          <span className="summary-label">RUC:</span>
                          {editandoResumen ? (
                            <input 
                              type="text" 
                              value={datosEditables.ruc || clienteParaResumen.ruc || ''} 
                              onChange={e => setDatosEditables(prev => ({...prev, ruc: validateNumbersOnly(e.target.value)}))}
                              style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
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
                              onChange={e => setDatosEditables(prev => ({...prev, telefonoReferencia: validateNumbersOnly(e.target.value)}))}
                              style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
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
                              value={datosEditables.correoElectronico || clienteParaResumen.correoElectronico || ''} 
                              onChange={e => setDatosEditables(prev => ({...prev, correoElectronico: e.target.value.toLowerCase()}))}
                              style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                          ) : (
                            <span className="summary-value">{clienteParaResumen.correoElectronico}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                    <img src={armaSeleccionada.imagen} alt={armaSeleccionada.modelo} />
                    <div className="weapon-details">
                      <p><strong>Modelo:</strong> {armaSeleccionada.modelo}</p>
                      <p><strong>Calibre:</strong> {armaSeleccionada.calibre}</p>
                      <p><strong>Capacidad:</strong> {armaSeleccionada.capacidad}</p>
                      <p><strong>Precio:</strong> ${armaSeleccionada.precio}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="summary-actions">
                <button className="submit-btn" onClick={handleSaveClient}>
                  Terminar Proceso
                </button>
              </div>
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