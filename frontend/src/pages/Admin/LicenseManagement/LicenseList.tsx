import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { licenseApi, type License } from '../../../services/adminApi';
import LicenseFormModal from './LicenseFormModal';

const LicenseList: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

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
        (license.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (license.ruc || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLicenses(filtered);
  };

  const handleCreate = () => {
    setSelectedLicense(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (license: License) => {
    setSelectedLicense(license);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (license: License) => {
    setSelectedLicense(license);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<License>) => {
    try {
      if (modalMode === 'create') {
        await licenseApi.create(data);
      } else if (modalMode === 'edit' && selectedLicense) {
        await licenseApi.update(selectedLicense.id, data);
      }
      // Recargar lista
      await loadLicenses();
      // Cerrar modal y limpiar selección
      setModalOpen(false);
      setSelectedLicense(null);
      alert(modalMode === 'create' ? 'Licencia creada exitosamente' : 'Licencia actualizada exitosamente');
    } catch (error) {
      console.error('Error guardando licencia:', error);
      alert('Error al guardar la licencia. Verifique que el número sea único.');
      throw error;
    }
  };

  const handleDelete = async (license: License) => {
    if (window.confirm(`¿Desactivar la licencia "${license.numero}"? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        // No eliminar, solo cambiar estado a false (inactivo)
        await licenseApi.update(license.id, { ...license, estado: false });
        await loadLicenses();
        alert('Licencia desactivada exitosamente');
      } catch (error) {
        console.error('Error desactivando licencia:', error);
        alert('Error al desactivar la licencia');
      }
    }
  };

  const getStatusColor = (status: boolean) => {
    return status 
      ? 'bg-green-100 text-green-800'  // Activo
      : 'bg-red-100 text-red-800';      // Inactivo
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
      key: 'nombre',
      label: 'Nombre/Razón Social',
      render: (value) => (
        <div className="text-sm text-gray-900">{value || 'N/A'}</div>
      )
    },
    {
      key: 'ruc',
      label: 'RUC',
      render: (value) => (
        <div className="text-sm text-gray-900 font-mono">{value || 'N/A'}</div>
      )
    },
    {
      key: 'cupo_total',
      label: 'Cupo Total',
      render: (value) => (
        <div className="text-sm font-semibold text-gray-900">{value || 0}</div>
      )
    },
    {
      key: 'cupo_disponible',
      label: 'Disponible',
      render: (value) => (
        <div className="text-sm font-semibold text-blue-600">{value || 0}</div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
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
      value: licenses.filter(l => l.estado === true).length,
      icon: '✅',
      color: 'green',
      description: 'Licencias activas'
    },
    {
      label: 'Inactivas',
      value: licenses.filter(l => l.estado === false).length,
      icon: '❌',
      color: 'red',
      description: 'Licencias inactivas'
    }
  ];

  return (
    <>
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

      <LicenseFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedLicense(null);
        }}
        onSave={handleSave}
        license={selectedLicense}
        mode={modalMode}
      />
    </>
  );
};

export default LicenseList;
