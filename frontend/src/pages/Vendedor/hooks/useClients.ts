import { useState } from 'react';
import type { Client, Weapon } from '../types';
import { clientTypeLabels, clientTypeOrder, isCupoCivil } from '../utils/clientUtils';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      numeroIdentificacion: '1234567890',
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
      numeroIdentificacion: '1712345678',
      nombres: 'María Elena',
      apellidos: 'González Rodríguez',
      email: 'maria.gonzalez@email.com',
      fechaNacimiento: '1982-11-15',
      direccion: 'Av. 9 de Octubre N123-456',
      telefonoPrincipal: '0987654324',
      tipoCliente: 'Compañía de Seguridad',
      tipoIdentificacion: 'Cedula',
      representanteLegal: 'MARÍA ELENA GONZÁLEZ RODRÍGUEZ',
      ruc: '0991234567001',
      nombreEmpresa: 'SEGURIDAD INTEGRAL S.A.',
      direccionFiscal: 'AV. 9 DE OCTUBRE N123-456, OFICINA 45',
      telefonoReferencia: '0987654325',
      correoEmpresa: 'info@seguridadintegral.com',
      provinciaEmpresa: 'Guayas',
      cantonEmpresa: 'Guayaquil'
    },
    {
      id: '3',
      numeroIdentificacion: '1100110011',
      nombres: 'Carlos',
      apellidos: 'Ramírez',
      email: 'c.ramirez@militar.com',
      fechaNacimiento: '1992-08-10',
      direccion: 'Base Militar',
      telefonoPrincipal: '099888777',
      tipoCliente: 'Uniformado',
      tipoIdentificacion: 'Cedula',
      estadoMilitar: 'ACTIVO'
    },
    {
      id: '4',
      numeroIdentificacion: '0808080808',
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
      numeroIdentificacion: '',
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