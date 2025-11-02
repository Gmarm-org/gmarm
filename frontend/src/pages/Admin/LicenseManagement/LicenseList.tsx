import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { licenseApi, type License } from '../../../services/adminApi';

const LicenseList: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      setIsLoading(true);
      const data = await licenseApi.getAll();
      setLicenses(data);
      setFilteredLicenses(data);
    } catch (error) {
      console.error('Error cargando licencias:', error);
      setLicenses([]);
      setFilteredLicenses([]);
      alert('Error al cargar licencias. Por favor, recarga la página.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterLicenses();
  }, [searchTerm, licenses]);

  const filterLicenses = () => {
    let filtered = licenses;

    if (searchTerm) {
      filtered = filtered.filter(license =>
        license.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLicenses(filtered);
  };

  const handleCreate = async () => {
    console.log('Crear nueva licencia');
    // TODO: Implementar modal de creación
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = async (license: License) => {
    console.log('Editar licencia:', license);
    // TODO: Implementar modal de edición
    alert(`Funcionalidad de edición en desarrollo para: ${license.numero}`);
  };

  const handleDelete = async (license: License) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la licencia "${license.numero}"?`)) {
      try {
        await licenseApi.delete(license.id);
        // Recargar la lista después de eliminar
        await loadLicenses();
        alert('Licencia eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando licencia:', error);
        alert('Error al eliminar la licencia');
      }
    }
  };

  const handleView = async (license: License) => {
    console.log('Ver licencia:', license);
    // TODO: Implementar modal de vista detallada
    alert(`Vista detallada en desarrollo para: ${license.numero}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVA':
        return 'bg-green-100 text-green-800';
      case 'VENCIDA':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDIDA':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'numero',
      label: 'Número',
      render: (value) => (
        <div className="text-sm font-medium text-gray-900 font-mono">{value}</div>
      )
    },
    {
      key: 'cliente_nombre',
      label: 'Cliente',
      render: (value) => (
        <div className="text-sm text-gray-900">{value}</div>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value.includes('CIVIL') ? 'bg-blue-100 text-blue-800' :
          value.includes('MILITAR') ? 'bg-green-100 text-green-800' :
          value.includes('COMPAÑÍA') ? 'bg-purple-100 text-purple-800' :
          value.includes('DEPORTISTA') ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'fecha_emision',
      label: 'Emisión',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString('es-EC')}
        </div>
      )
    },
    {
      key: 'fecha_vencimiento',
      label: 'Vencimiento',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString('es-EC')}
        </div>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Licencias',
      value: licenses.length,
      icon: '📋',
      color: 'blue',
      description: 'Licencias registradas'
    },
    {
      label: 'Activas',
      value: licenses.filter(l => l.estado === 'ACTIVA').length,
      icon: '✅',
      color: 'green',
      description: 'Licencias activas'
    },
    {
      label: 'Vencidas',
      value: licenses.filter(l => l.estado === 'VENCIDA').length,
      icon: '❌',
      color: 'red',
      description: 'Licencias vencidas'
    },
    {
      label: 'Suspendidas',
      value: licenses.filter(l => l.estado === 'SUSPENDIDA').length,
      icon: '⚠️',
      color: 'orange',
      description: 'Licencias suspendidas'
    }
  ];

  return (
    <AdminDataTable
      title="Gestión de Licencias"
      description="Administra las licencias de importación del sistema"
      columns={columns}
      data={filteredLicenses}
      isLoading={isLoading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      searchPlaceholder="Buscar licencias..."
      stats={<AdminStats stats={stats} />}
    />
  );
};

export default LicenseList;
