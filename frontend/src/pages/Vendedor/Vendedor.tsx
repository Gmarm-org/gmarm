import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Vendedor.css';
import UsuarioForm from '../Usuario/UsuarioForm';
import UserMenu from '../../components/UserMenu';
import Dashboard from './components/Dashboard';
import ClientForm from './components/ClientForm';
import WeaponReserve from './components/WeaponReserve';
import ClientSummary from './components/ClientSummary';
import {
  clientes as initialClients,
  weapons as initialWeapons,
  clientTypeLabels,
  clientTypeOrder,
  tiposDeIdentificacion,
  docsByTipo,
  preguntasByTipo,
  armasPorCliente as initialArmasPorCliente
} from './HardcodedData';
import type { Client, Weapon } from './types';

type Page = 'dashboard' | 'clientForm' | 'reserve' | 'summary' | 'userPhoto' | 'userUpdate' | 'userPassword';
type ClientFormMode = 'create' | 'view' | 'edit';

export interface ContratoCliente {
  id: string;
  nombres: string;
  apellidos: string;
  tipoCliente: string;
  tipoIdentificacion: string;
  cedula: string;
  email: string;
  provincia: string;
  canton: string;
  ciudad: string;
  direccion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
}

export interface ContratoCompania {
  ruc: string;
  nombre: string;
  provincia: string;
  canton: string;
  ciudad: string;
  direccionFiscal: string;
  telefonoReferencia: string;
  correoElectronico: string;
}

export interface ContratoArma {
  id: string;
  modelo: string;
  precioBase: number;
  cantidad: number;
  iva: number;
  precioFinal: number;
}

export interface ContratoRegistroCliente {
  cliente: ContratoCliente;
  compania?: ContratoCompania; // Solo si es Compañía de Seguridad
  armas: ContratoArma[]; // Puede ser más de una para empresas
  total: number;
}

function Vendedor() {
  const [page, setPage] = useState<Page>('dashboard');
  const [clientFormMode, setClientFormMode] = useState<ClientFormMode>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [weapons, setWeapons] = useState<Weapon[]>(initialWeapons);
  const [armasPorCliente, setArmasPorCliente] = useState<Record<string, Weapon | null>>(initialArmasPorCliente);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tipoCliente, setTipoCliente] = useState('Civil');
  const [estadoUniformado, setEstadoUniformado] = useState<'Activo' | 'Pasivo'>('Activo');
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [reservaParaCliente, setReservaParaCliente] = useState<Client | null>(null);
  const [clienteParaResumen, setClienteParaResumen] = useState<Client | null>(null);
  const [armaSeleccionada, setArmaSeleccionada] = useState<Weapon | null>(null);
  const [armaSeleccionadaEnReserva, setArmaSeleccionadaEnReserva] = useState<Weapon | null>(null);
  const [editandoResumen, setEditandoResumen] = useState(false);
  const [datosEditables, setDatosEditables] = useState<Partial<Client>>({});
  // Estado para cantidades de armas por id
  const [cantidadesArmas, setCantidadesArmas] = useState<Record<string, number>>({});

  // Estado para menú contextual (actionMenu)
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

  // Usa clientTypeLabels, clientTypeOrder, tiposDeIdentificacion, docsByTipo, preguntasByTipo donde sea necesario
  const clientTypeCounts = clientTypeOrder.map(type => ({
    type,
    label: clientTypeLabels[type],
    count: clients.filter(c => c.tipoCliente === type).length
  }));

  // Simulación: asignar un arma a algunos clientes
  // const armaPorCliente: Record<string, Weapon | null> = {
  //   '1': weapons[0], // Juan tiene arma 1
  //   '2': null,       // Seguridad S.A. sin arma
  //   '3': weapons[1], // Carlos tiene arma 2
  //   '4': null        // Ana sin arma
  // };

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
        provincia: client.provincia || '',
        canton: client.canton || '',
        direccion: client.direccion || '',
        telefonoPrincipal: client.telefonoPrincipal || '',
        telefonoSecundario: client.telefonoSecundario || '',
        tipoCliente: client.tipoCliente,
        tipoIdentificacion: client.tipoIdentificacion || 'Cedula',
        ruc: client.ruc,
        telefonoReferencia: client.telefonoReferencia,
        direccionFiscal: client.direccionFiscal,
        correoElectronico: client.correoElectronico,
        provinciaCompania: client.provinciaCompania,
        cantonCompania: client.cantonCompania,
        estadoUniformado: client.estadoUniformado
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
      
      // Limpiar estados y volver al dashboard
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

  // Función para manejar selección de arma en modo edición
  const handleWeaponSelectionInEdit = (weapon: Weapon | null) => {
    if (weapon) {
      setArmaSeleccionadaEnReserva(weapon);
    } else {
      setArmaSeleccionadaEnReserva(null);
    }
  };

  // Función para actualizar el precio de un arma
  const handleUpdateWeaponPrice = (weaponId: string, newPrice: number) => {
    setWeapons(prev => prev.map(weapon => 
      weapon.id === weaponId ? { ...weapon, precio: newPrice } : weapon
    ));
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
    setSelectedClient(client || null); // Actualizar selectedClient
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

  // Función para actualizar la cantidad de un arma
  const handleUpdateWeaponQuantity = (weaponId: string, newQuantity: number) => {
    setCantidadesArmas(prev => ({ ...prev, [weaponId]: newQuantity }));
  };

  const [provincia, setProvincia] = useState('');
  const [canton, setCanton] = useState('');
  const [ciudad, setCiudad] = useState('');

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
            actionMenuOpen={actionMenuOpen}
            setActionMenuOpen={setActionMenuOpen}
            actionMenuRef={actionMenuRef}
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
            onWeaponSelection={clientFormMode === 'edit' ? handleWeaponSelectionInEdit : handleWeaponSelectionInReserve}
            onUpdateWeaponPrice={handleUpdateWeaponPrice}
            onUpdateWeaponQuantity={handleUpdateWeaponQuantity}
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
            onUpdateWeaponPrice={handleUpdateWeaponPrice}
            onUpdateWeaponQuantity={handleUpdateWeaponQuantity}
          />
        )}

        {page === 'summary' && (
          <ClientSummary
            clienteParaResumen={clienteParaResumen}
            armaSeleccionada={armaSeleccionada}
            onBack={() => setPage('reserve')}
            onSaveClient={handleSaveClient}
            cantidadesArmas={cantidadesArmas}
          />
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