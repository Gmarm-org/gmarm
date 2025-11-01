import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { questionApi, type Question } from '../../../services/adminApi';

const GestionPreguntas: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
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
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = (question: Question) => {
    alert(`Editar pregunta: ${question.pregunta}`);
  };

  const handleDelete = async (question: Question) => {
    if (confirm(`¿Eliminar la pregunta "${question.pregunta}"?`)) {
      try {
        await questionApi.delete(question.id);
        await loadQuestions();
      } catch (error) {
        console.error('Error eliminando pregunta:', error);
        alert('Error al eliminar la pregunta');
      }
    }
  };

  const handleView = (question: Question) => {
    alert(`Pregunta: ${question.pregunta}\nTipo: ${question.tipoRespuesta}\nObligatoria: ${question.obligatoria ? 'Sí' : 'No'}`);
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

  return (
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
  );
};

export default GestionPreguntas;

