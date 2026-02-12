import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  DocumentIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { mockClients, mockImportGroups } from './HardcodedData';
import type { Client, ImportGroup } from './types';
import { formatNombreCompleto } from '../../utils/formatUtils';

interface AssignmentDocument {
  id: string;
  nombre: string;
  tipo: string;
  archivo: File | null;
  url: string;
  fechaCarga: string;
  estado: 'LISTO' | 'APROBADO' | 'RECHAZADO';
  observaciones?: string;
}

interface ClientAssignment {
  id: string;
  cliente: Client;
  fechaAsignacion: string;
  documentos: AssignmentDocument[];
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  observaciones?: string;
}

const ClientAssignmentPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [importGroup, setImportGroup] = useState<ImportGroup | null>(null);
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<ClientAssignment[]>([]);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [uploadingDocument, setUploadingDocument] = useState<boolean>(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [groupDocuments, setGroupDocuments] = useState<AssignmentDocument[]>([]);
  const [previewDocument, setPreviewDocument] = useState<AssignmentDocument | null>(null);

  useEffect(() => {
    if (groupId) {
      const group = mockImportGroups.find(g => g.id === parseInt(groupId));
      if (group) {
        setImportGroup(group);
        // Simular asignaciones existentes
        setAssignments([
          {
            id: '1',
            cliente: mockClients[0],
            fechaAsignacion: '2024-01-15',
            documentos: [],
            estado: 'PENDIENTE'
          }
        ]);
      }
    }
  }, [groupId]);

  const availableClients = mockClients.filter(client => 
    !assignments.some(assignment => assignment.cliente.id === client.id) &&
    client.estadoProcesoVentas === 'LISTO_IMPORTACION' &&
    client.aprobadoPorJefeVentas
  );

  const filteredClients = availableClients.filter(client => {
    const matchesSearch = client.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.cedula.includes(searchTerm);
    const matchesType = filterType === 'TODOS' || client.tipoCliente === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddClients = () => {
    if (selectedClients.length > 0) {
      const newAssignments = selectedClients.map(client => ({
        id: Date.now().toString() + Math.random(),
        cliente: client,
        fechaAsignacion: new Date().toISOString().split('T')[0],
        documentos: [],
        estado: 'PENDIENTE' as const
      }));
      
      setAssignments([...assignments, ...newAssignments]);
      setSelectedClients([]);
      setShowClientSelector(false);
    }
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  const handleUploadDocument = () => {
    if (documentName && documentType && selectedFile) {
      const newDocument: AssignmentDocument = {
        id: Date.now().toString(),
        nombre: documentName,
        tipo: documentType,
        archivo: selectedFile,
        url: URL.createObjectURL(selectedFile),
        fechaCarga: new Date().toISOString().split('T')[0],
        estado: 'LISTO'
      };

      setGroupDocuments([...groupDocuments, newDocument]);

      setDocumentName('');
      setDocumentType('');
      setSelectedFile(null);
      setUploadingDocument(false);
    }
  };

  const handleEditDocument = (documentId: string) => {
    const document = groupDocuments.find(d => d.id === documentId);
    if (document && document.estado !== 'APROBADO') {
      setEditingDocument(documentId);
      setDocumentName(document.nombre);
      setDocumentType(document.tipo);
      setSelectedFile(document.archivo);
      setUploadingDocument(true); // Abrir el modal para editar
    }
  };

  const handleUpdateDocument = () => {
    if (documentName && documentType && selectedFile && editingDocument) {
      setGroupDocuments(groupDocuments.map(d => 
        d.id === editingDocument 
          ? {
              ...d,
              nombre: documentName,
              tipo: documentType,
              archivo: selectedFile,
              url: URL.createObjectURL(selectedFile),
              fechaCarga: new Date().toISOString().split('T')[0]
            }
          : d
      ));

      setDocumentName('');
      setDocumentType('');
      setSelectedFile(null);
      setEditingDocument(null);
    }
  };

  const handlePreviewDocument = (document: AssignmentDocument) => {
    setPreviewDocument(document);
  };

  const handleDocumentStatusChange = (documentId: string, newStatus: 'APROBADO' | 'RECHAZADO') => {
    setGroupDocuments(groupDocuments.map(d => 
      d.id === documentId 
        ? { ...d, estado: newStatus }
        : d
    ));
  };

  const getCupoDisponible = (tipoCliente: string) => {
    if (!importGroup) return 0;
    
    switch (tipoCliente) {
      case 'CIVIL':
        return importGroup.cuposDisponibles.civil - assignments.filter(a => a.cliente.tipoCliente === 'CIVIL').length;
      case 'MILITAR':
        return importGroup.cuposDisponibles.militar - assignments.filter(a => a.cliente.tipoCliente === 'MILITAR').length;
      case 'EMPRESA':
        return importGroup.cuposDisponibles.empresa - assignments.filter(a => a.cliente.tipoCliente === 'EMPRESA').length;
      case 'DEPORTISTA':
        return importGroup.cuposDisponibles.deportista - assignments.filter(a => a.cliente.tipoCliente === 'DEPORTISTA').length;
      default:
        return 0;
    }
  };

  if (!importGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando grupo de importación...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Asignación de Clientes
                </h1>
                <p className="text-sm text-gray-500">
                  {importGroup.nombre} - {importGroup.codigo}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowClientSelector(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Clientes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen de Cupos */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen de Cupos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getCupoDisponible('CIVIL')}
              </div>
              <div className="text-sm text-gray-500">Cupos Civiles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getCupoDisponible('MILITAR')}
              </div>
              <div className="text-sm text-gray-500">Cupos Militares</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getCupoDisponible('EMPRESA')}
              </div>
              <div className="text-sm text-gray-500">Cupos Empresas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {getCupoDisponible('DEPORTISTA')}
              </div>
              <div className="text-sm text-gray-500">Cupos Deportistas</div>
            </div>
          </div>
        </div>

                 {/* Documentos del Grupo */}
         <div className="bg-white rounded-lg shadow p-6 mb-8">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-medium text-gray-900">Documentos del Grupo</h2>
             <button
               onClick={() => setUploadingDocument(true)}
               className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
             >
               <PlusIcon className="h-4 w-4 mr-2" />
               Agregar Documento
             </button>
           </div>
           
           {groupDocuments.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {groupDocuments.map((doc) => (
                 <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center space-x-2">
                       <DocumentIcon className="h-5 w-5 text-gray-400" />
                       <span className="text-sm font-medium text-gray-900">{doc.nombre}</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <button
                         onClick={() => handlePreviewDocument(doc)}
                         className="p-1 rounded hover:bg-blue-50 text-blue-600"
                         title="Previsualizar"
                       >
                         <EyeIcon className="h-3 w-3" />
                       </button>
                                               {doc.estado !== 'APROBADO' && (
                          <button
                            onClick={() => handleEditDocument(doc.id)}
                            className="p-1 rounded hover:bg-yellow-50 text-yellow-600"
                            title="Editar"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                        )}
                       <button
                         onClick={() => handleDocumentStatusChange(doc.id, 'APROBADO')}
                         className={`p-1 rounded ${
                           doc.estado === 'APROBADO' 
                             ? 'bg-green-100 text-green-600' 
                             : 'hover:bg-green-50'
                         }`}
                         title="Aprobar"
                       >
                         <CheckIcon className="h-3 w-3" />
                       </button>
                       <button
                         onClick={() => handleDocumentStatusChange(doc.id, 'RECHAZADO')}
                         className={`p-1 rounded ${
                           doc.estado === 'RECHAZADO' 
                             ? 'bg-red-100 text-red-600' 
                             : 'hover:bg-red-50'
                         }`}
                         title="Rechazar"
                       >
                         <XMarkIcon className="h-3 w-3" />
                       </button>
                     </div>
                   </div>
                   
                                         <div className="text-xs text-gray-500">
                        <div>Tipo: {doc.tipo}</div>
                        <div>Fecha: {doc.fechaCarga}</div>
                        <div className={`font-medium ${
                          doc.estado === 'APROBADO' ? 'text-green-600' :
                          doc.estado === 'RECHAZADO' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          Estado: {doc.estado}
                        </div>
                        {doc.estado === 'APROBADO' && (
                          <div className="mt-1 text-xs text-green-600 font-medium">
                            ✓ Documento aprobado - No editable
                          </div>
                        )}
                        {doc.archivo && (
                          <div className="mt-2">
                            <a
                              href={doc.url}
                              download={doc.archivo.name}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                            >
                              📄 Descargar PDF
                            </a>
                          </div>
                        )}
                      </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-gray-500 text-center py-8">
               <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
               <p>No hay documentos cargados para este grupo</p>
               <p className="text-sm">Haz clic en "Agregar Documento" para comenzar</p>
             </div>
           )}
         </div>

         {/* Lista de Clientes Asignados */}
         <div className="bg-white rounded-lg shadow">
           <div className="px-6 py-4 border-b border-gray-200">
             <h3 className="text-lg font-medium text-gray-900">
               Clientes Asignados ({assignments.length})
             </h3>
           </div>
          
          <div className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {formatNombreCompleto(assignment.cliente.nombres, assignment.cliente.apellidos)}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assignment.cliente.tipoCliente === 'CIVIL' ? 'bg-blue-100 text-blue-800' :
                        assignment.cliente.tipoCliente === 'MILITAR' ? 'bg-green-100 text-green-800' :
                        assignment.cliente.tipoCliente === 'EMPRESA' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {assignment.cliente.tipoCliente}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assignment.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                        assignment.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assignment.estado}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Cédula:</span> {assignment.cliente.cedula}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {assignment.cliente.email}
                      </div>
                      <div>
                        <span className="font-medium">Teléfono:</span> {assignment.cliente.telefono}
                      </div>
                      <div>
                        <span className="font-medium">Fecha Asignación:</span> {assignment.fechaAsignacion}
                      </div>
                    </div>

                                         {/* Información del Cliente */}
                     <div className="text-sm text-gray-600">
                       <p><span className="font-medium">Estado de Asignación:</span> {assignment.estado}</p>
                       {assignment.observaciones && (
                         <p><span className="font-medium">Observaciones:</span> {assignment.observaciones}</p>
                       )}
                     </div>

                    
                  </div>
                  
                  <button
                    onClick={() => handleRemoveAssignment(assignment.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            
            {assignments.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No hay clientes asignados a este grupo
              </div>
            )}
          </div>
        </div>
      </div>

             {/* Modal de Carga de Documento */}
       {uploadingDocument && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <h3 className="text-lg font-medium text-gray-900 mb-4">
                 {editingDocument ? 'Editar Documento' : 'Agregar Documento al Grupo'}
               </h3>
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Nombre del Documento
                   </label>
                   <input
                     type="text"
                     value={documentName}
                     onChange={(e) => setDocumentName(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Ej: Factura, Certificado..."
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Tipo de Documento
                   </label>
                   <select
                     value={documentType}
                     onChange={(e) => setDocumentType(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="">Seleccionar tipo</option>
                     <option value="FACTURA">Factura</option>
                     <option value="CERTIFICADO">Certificado</option>
                     <option value="AUTORIZACION">Autorización</option>
                     <option value="OTRO">Otro</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Archivo PDF *
                   </label>
                   <input
                     type="file"
                     accept=".pdf"
                     onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                   />
                   {selectedFile && (
                     <p className="text-sm text-green-600 mt-1">
                       ✓ Archivo seleccionado: {selectedFile.name}
                     </p>
                   )}
                 </div>
                 
                 <div className="flex justify-end space-x-3">
                   <button
                     onClick={() => {
                       setUploadingDocument(false);
                       setEditingDocument(null);
                       setDocumentName('');
                       setDocumentType('');
                       setSelectedFile(null);
                     }}
                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                   >
                     Cancelar
                   </button>
                   <button
                     onClick={editingDocument ? handleUpdateDocument : handleUploadDocument}
                     disabled={!documentName || !documentType || !selectedFile}
                     className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {editingDocument ? 'Actualizar' : 'Agregar'}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
                )}

         {/* Modal de Previsualización de Documento */}
         {previewDocument && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
               <div className="mt-3">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-medium text-gray-900">
                     Previsualización: {previewDocument.nombre}
                   </h3>
                   <button
                     onClick={() => setPreviewDocument(null)}
                     className="text-gray-400 hover:text-gray-600"
                   >
                     <XMarkIcon className="h-6 w-6" />
                   </button>
                 </div>
                 
                 <div className="mb-4 p-3 bg-gray-50 rounded-md">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                     <div><span className="font-medium">Tipo:</span> {previewDocument.tipo}</div>
                     <div><span className="font-medium">Fecha:</span> {previewDocument.fechaCarga}</div>
                     <div><span className="font-medium">Estado:</span> 
                       <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                         previewDocument.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                         previewDocument.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                         'bg-blue-100 text-blue-800'
                       }`}>
                         {previewDocument.estado}
                       </span>
                     </div>
                     <div><span className="font-medium">Archivo:</span> {previewDocument.archivo?.name}</div>
                   </div>
                 </div>
                 
                 {previewDocument.archivo && (
                   <div className="w-full h-96 border border-gray-300 rounded-md overflow-hidden">
                     <iframe
                       src={previewDocument.url}
                       className="w-full h-full"
                       title="Previsualización del PDF"
                     />
                   </div>
                 )}
                 
                 <div className="flex justify-end mt-4">
                   <button
                     onClick={() => setPreviewDocument(null)}
                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                   >
                     Cerrar
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Modal Selector de Clientes */}
       {showClientSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Seleccionar Clientes para Asignar
                </h3>
                <button
                  onClick={() => setShowClientSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Filtros */}
              <div className="flex space-x-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o cédula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="CIVIL">Civil</option>
                  <option value="MILITAR">Militar</option>
                  <option value="EMPRESA">Empresa</option>
                  <option value="DEPORTISTA">Deportista</option>
                </select>
              </div>
              
              {/* Lista de Clientes */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedClients.some(c => c.id === client.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      if (selectedClients.some(c => c.id === client.id)) {
                        setSelectedClients(selectedClients.filter(c => c.id !== client.id));
                      } else {
                        setSelectedClients([...selectedClients, client]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatNombreCompleto(client.nombres, client.apellidos)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Cédula: {client.cedula} | {client.tipoCliente}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          client.tipoCliente === 'CIVIL' ? 'bg-blue-100 text-blue-800' :
                          client.tipoCliente === 'MILITAR' ? 'bg-green-100 text-green-800' :
                          client.tipoCliente === 'EMPRESA' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {client.tipoCliente}
                        </span>
                        {selectedClients.some(c => c.id === client.id) && (
                          <CheckIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredClients.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron clientes disponibles
                  </div>
                )}
              </div>
              
              {/* Cupos Disponibles */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Cupos Disponibles:</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Civil:</span> {getCupoDisponible('CIVIL')}
                  </div>
                  <div>
                    <span className="font-medium">Militar:</span> {getCupoDisponible('MILITAR')}
                  </div>
                  <div>
                    <span className="font-medium">Empresa:</span> {getCupoDisponible('EMPRESA')}
                  </div>
                  <div>
                    <span className="font-medium">Deportista:</span> {getCupoDisponible('DEPORTISTA')}
                  </div>
                </div>
              </div>
              
              {/* Botones de Acción */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowClientSelector(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddClients}
                  disabled={selectedClients.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Asignar {selectedClients.length} Cliente{selectedClients.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAssignmentPage;
