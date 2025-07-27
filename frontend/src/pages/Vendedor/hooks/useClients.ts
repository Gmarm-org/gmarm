import { useState } from 'react';
import type { Client, Weapon } from '../types';
import { clientTypeLabels, clientTypeOrder, isCupoCivil } from '../utils/clientUtils';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      cedula: '1234567890',
      nombres: 'Juan',
      apellidos: 'Pérez',
      email: 'juan.perez@email.com',
      fechaNacimiento: '1990-05-15',
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
      fechaNacimiento: '1985-03-20',
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
      fechaNacimiento: '1992-08-10',
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
      fechaNacimiento: '2002-12-03',
      direccion: 'Club Deportivo',
      telefonoPrincipal: '098123456',
      tipoCliente: 'Deportista',
      tipoIdentificacion: 'Cedula'
    }
  ]);

  const [armasPorCliente, setArmasPorCliente] = useState<Record<string, Weapon | null>>({});

  // Calcular conteos de tipos de cliente
  const clientTypeCounts = clientTypeOrder.map(type => ({
    type,
    label: clientTypeLabels[type],
    count: clients.filter(c => c.tipoCliente === type).length
  }));

  // Agregar cliente
  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  // Actualizar cliente
  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
  };

  // Asignar arma a cliente
  const assignWeaponToClient = (clientId: string, weapon: Weapon) => {
    setArmasPorCliente(prev => ({ ...prev, [clientId]: weapon }));
  };

  // Crear cupo civil
  const createCupoCivil = (weapon: Weapon) => {
    const cupoCivilCount = clients.filter(c => isCupoCivil(c)).length;
    const newCupoCivil: Client = {
      id: `cupo-civil-${Date.now()}`,
      cedula: '',
      nombres: `Cupo Civil #${cupoCivilCount + 1}`,
      apellidos: '',
      email: '',
      fechaNacimiento: '1990-01-01', // Fecha por defecto para cupo civil
      direccion: '',
      telefonoPrincipal: '',
      tipoCliente: 'Civil',
      tipoIdentificacion: 'Cedula',
    };
    setClients(prev => [...prev, newCupoCivil]);
    setArmasPorCliente(prev => ({ ...prev, [newCupoCivil.id]: weapon }));
  };

  return {
    clients,
    armasPorCliente,
    clientTypeCounts,
    addClient,
    updateClient,
    assignWeaponToClient,
    createCupoCivil,
    setArmasPorCliente
  };
}; 