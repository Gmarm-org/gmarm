import React, { useCallback } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { licenseApi, type License } from '../../../services/adminApi';
import LicenseFormModal from './LicenseFormModal';
import StatusBadge, { estadoVariant } from '../../../components/common/StatusBadge';
import { useModalState } from '../../../hooks/useModalState';
import { useCrudList } from '../../../hooks/useCrudList';

const filterLicenses = (licenses: License[], term: string) =>
  licenses.filter(license =>
    license.numero.toLowerCase().includes(term.toLowerCase()) ||
    (license.nombre || '').toLowerCase().includes(term.toLowerCase()) ||
    (license.ruc || '').toLowerCase().includes(term.toLowerCase())
  );

const LicenseList: React.FC = () => {
  const fetchLicenses = useCallback(() => licenseApi.getAll(), []);
  const { items: licenses, filteredItems: filteredLicenses, searchTerm, setSearchTerm, isLoading, reload } = useCrudList<License>({
    fetchFn: fetchLicenses,
    filterFn: filterLicenses,
  });
  const modal = useModalState<License>();

  const handleSave = async (data: Partial<License>) => {
    try {
      if (modal.mode === 'create') {
        await licenseApi.create(data);
      } else if (modal.mode === 'edit' && modal.selectedItem) {
        await licenseApi.update(modal.selectedItem.id, data);
      }
      await reload();
      modal.close();
      alert(modal.mode === 'create' ? 'Licencia creada exitosamente' : 'Licencia actualizada exitosamente');
    } catch (error: any) {
      console.error('Error guardando licencia:', error);
      const errorMessage = error?.responseData?.error || error?.message || 'Error al guardar la licencia';
      alert(errorMessage);
      throw error;
    }
  };

  const handleDelete = async (license: License) => {
    if (window.confirm(`¿Desactivar la licencia "${license.numero}"? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        await licenseApi.update(license.id, { ...license, estado: false });
        await reload();
        alert('Licencia desactivada exitosamente');
      } catch (error) {
        console.error('Error desactivando licencia:', error);
        alert('Error al desactivar la licencia');
      }
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
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <StatusBadge label={value ? 'Activo' : 'Inactivo'} variant={estadoVariant(value)} />
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
        onCreate={() => modal.openCreate()}
        onEdit={(license: License) => modal.openEdit(license)}
        onDelete={handleDelete}
        onView={(license: License) => modal.openView(license)}
        searchPlaceholder="Buscar licencias..."
        stats={<AdminStats stats={stats} />}
      />

      <LicenseFormModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        onSave={handleSave}
        license={modal.selectedItem}
        mode={modal.mode}
      />
    </>
  );
};

export default LicenseList;
