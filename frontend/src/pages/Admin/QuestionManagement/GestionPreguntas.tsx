import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { questionApi, tipoProcesoApi, type Question, type TipoProceso } from '../../../services/adminApi';
import SimpleFormModal from '../components/SimpleFormModal';

const GestionPreguntas: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [tiposProceso, setTiposProceso] = useState<TipoProceso[]>([]);

  useEffect(() => {
    loadQuestions();
    loadTiposProceso();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [searchTerm, questions]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const data = await questionApi.getAll();
      setQuestions(data);
      setFilteredQuestions(data);
    } catch (error) {
      console.error('Error cargando preguntas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTiposProceso = async () => {
    try {
      const data = await tipoProcesoApi.getAll();
      setTiposProceso(data);
    } catch (error) {
      console.error('Error cargando tipos de proceso:', error);
    }
  };

  const filterQuestions = () => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.pregunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tipoProcesoNombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQuestions(filtered);
  };

  const handleCreate = () => {
    setSelectedQuestion(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (question: Question) => {
    setSelectedQuestion(question);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<Question>) => {
    try {
      if (modalMode === 'create') {
        await questionApi.create(data);
      } else if (modalMode === 'edit' && selectedQuestion) {
        await questionApi.update(selectedQuestion.id, data);
      }
      // Recargar lista
      await loadQuestions();
      // Cerrar modal y limpiar selección
      setModalOpen(false);
      setSelectedQuestion(null);
      alert(modalMode === 'create' ? 'Pregunta creada exitosamente' : 'Pregunta actualizada exitosamente');
    } catch (error) {
      console.error('Error guardando pregunta:', error);
      alert('Error al guardar la pregunta.');
      throw error;
    }
  };

  const handleDelete = async (question: Question) => {
    if (confirm(`¿Desactivar la pregunta "${question.pregunta}"? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        // No eliminar, solo cambiar estado a false (inactivo)
        await questionApi.update(question.id, { ...question, estado: false });
        await loadQuestions();
        alert('Pregunta desactivada exitosamente');
      } catch (error) {
        console.error('Error desactivando pregunta:', error);
        alert('Error al desactivar la pregunta');
      }
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'pregunta',
      label: 'Pregunta',
      render: (value) => (
        <div className="text-sm text-gray-900 max-w-md">{value}</div>
      )
    },
    {
      key: 'tipoProcesoNombre',
      label: 'Tipo de Proceso',
      render: (value) => (
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {value}
        </span>
      )
    },
    {
      key: 'tipoRespuesta',
      label: 'Tipo Respuesta',
      render: (value) => (
        <span className="text-sm text-gray-700">{value}</span>
      )
    },
    {
      key: 'orden',
      label: 'Orden',
      render: (value) => (
        <span className="text-sm font-mono text-gray-700">{value}</span>
      )
    },
    {
      key: 'obligatoria',
      label: 'Obligatoria',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? '⚠️ Sí' : 'No'}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? '✅ Activo' : '❌ Inactivo'}
        </span>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Preguntas',
      value: questions.length,
      icon: '❓',
      color: 'blue',
      description: 'Todas las preguntas'
    },
    {
      label: 'Activas',
      value: questions.filter(q => q.estado).length,
      icon: '✅',
      color: 'green',
      description: 'Preguntas activas'
    },
    {
      label: 'Obligatorias',
      value: questions.filter(q => q.obligatoria).length,
      icon: '⚠️',
      color: 'red',
      description: 'Preguntas obligatorias'
    },
    {
      label: 'Opcionales',
      value: questions.filter(q => !q.obligatoria).length,
      icon: '📝',
      color: 'purple',
      description: 'Preguntas opcionales'
    }
  ];

  const formFields = [
    { key: 'pregunta', label: 'Pregunta', type: 'textarea' as const, required: true },
    { key: 'tipoProcesoId', label: 'Tipo de Proceso', type: 'select' as const, required: true, options: tiposProceso.map(tp => ({ value: tp.id, label: tp.nombre })) },
    { key: 'tipoRespuesta', label: 'Tipo de Respuesta', type: 'text' as const, required: true, placeholder: 'text, number, date, etc.' },
    { key: 'orden', label: 'Orden', type: 'number' as const, required: true },
    { key: 'obligatoria', label: 'Obligatoria', type: 'checkbox' as const },
    { key: 'estado', label: 'Estado', type: 'checkbox' as const }
  ];

  return (
    <>
      <AdminDataTable
        title="Gestión de Preguntas"
        description="Administra las preguntas para los formularios de clientes"
        columns={columns}
        data={filteredQuestions}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="Buscar preguntas..."
        stats={<AdminStats stats={stats} />}
      />

      <SimpleFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedQuestion(null);
        }}
        onSave={handleSave}
        data={selectedQuestion}
        mode={modalMode}
        title="Pregunta"
        fields={formFields}
      />
    </>
  );
};

export default GestionPreguntas;

