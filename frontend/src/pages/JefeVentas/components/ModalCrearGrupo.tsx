import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface Licencia {
  id: number;
  numero: string;
  nombre: string;
  cupoCivil?: number;
  cupoMilitar?: number;
  cupoEmpresa?: number;
  cupoDeportista?: number;
}

interface ModalCrearGrupoProps {
  onClose: () => void;
  onSuccess: () => void;
  grupoId?: number; // Si se proporciona, es modo edición
  modo?: 'crear' | 'editar';
}

interface Vendedor {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  nombreCompleto: string;
}

interface CategoriaArma {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
}

const ModalCrearGrupo: React.FC<ModalCrearGrupoProps> = ({ onClose, onSuccess, grupoId, modo = 'crear' }) => {
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [categorias, setCategorias] = useState<CategoriaArma[]>([]);
  const [loading, setLoading] = useState(false);
  const [creando, setCreando] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [licenciaId, setLicenciaId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [tipoGrupo, setTipoGrupo] = useState<'CUPO' | 'JUSTIFICATIVO'>('CUPO');
  const [tra, setTra] = useState('');
  const [vendedorIdsSeleccionados, setVendedorIdsSeleccionados] = useState<number[]>([]);
  const [limitesVendedores, setLimitesVendedores] = useState<Array<{ vendedorId: number; limiteArmas: number }>>([]);
  const [limitesCategoria, setLimitesCategoria] = useState<Array<{ categoriaArmaId: number; limiteMaximo: number }>>([]);

  useEffect(() => {
    cargarDatos();
    if (modo === 'editar' && grupoId) {
      cargarDatosGrupo();
    }
  }, [modo, grupoId]);
  
  const cargarDatosGrupo = async () => {
    if (!grupoId) return;
    
    try {
      setLoading(true);
      const grupo = await apiService.getGrupoImportacion(grupoId);
      
      console.log('📋 Datos del grupo cargados:', grupo);
      
      setNombre(grupo.nombre || '');
      setDescripcion(grupo.descripcion || '');
      setObservaciones((grupo as any).observaciones || '');
      setTipoGrupo((grupo as any).tipoGrupo || 'CUPO');
      setTra((grupo as any).tra || '');
      
      // Cargar licencia si existe
      if ((grupo as any).licencia && (grupo as any).licencia.id) {
        setLicenciaId((grupo as any).licencia.id);
      }
      
      // Cargar vendedores asignados con sus límites
      if ((grupo as any).vendedores && Array.isArray((grupo as any).vendedores)) {
        console.log('👥 Vendedores encontrados:', (grupo as any).vendedores);
        const vendedoresConLimites = (grupo as any).vendedores.map((v: any) => ({
          vendedorId: v.id,
          limiteArmas: v.limiteArmas || 0
        }));
        console.log('✅ Vendedores con límites procesados:', vendedoresConLimites);
        setLimitesVendedores(vendedoresConLimites);
        setVendedorIdsSeleccionados(vendedoresConLimites.map((v: any) => v.vendedorId));
      } else {
        console.warn('⚠️ No se encontraron vendedores en el grupo');
        setLimitesVendedores([]);
        setVendedorIdsSeleccionados([]);
      }
      
      // Cargar límites por categoría
      if ((grupo as any).limitesCategoria && Array.isArray((grupo as any).limitesCategoria)) {
        console.log('📊 Límites por categoría encontrados:', (grupo as any).limitesCategoria);
        const limites = (grupo as any).limitesCategoria.map((l: any) => ({
          categoriaArmaId: l.categoriaArmaId,
          limiteMaximo: l.limiteMaximo
        }));
        console.log('✅ Límites procesados:', limites);
        setLimitesCategoria(limites);
      } else {
        console.warn('⚠️ No se encontraron límites por categoría en el grupo');
        setLimitesCategoria([]);
      }
    } catch (error) {
      console.error('❌ Error cargando datos del grupo:', error);
      alert('Error al cargar datos del grupo para editar');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [licenciasData, vendedoresData, categoriasData] = await Promise.all([
        apiService.getLicenciasDisponibles(),
        apiService.getVendedoresParaGrupo(),
        apiService.getCategoriasArmasParaGrupo()
      ]);
      
      setLicencias(licenciasData);
      setVendedores(vendedoresData);
      setCategorias(categoriasData);
      
      // Si solo hay una licencia disponible, seleccionarla automáticamente
      if (licenciasData.length === 1) {
        setLicenciaId(licenciasData[0].id);
      }
      
      // Inicializar límites por categoría con valores por defecto para tipo CUPO
      const limitesIniciales = categoriasData.map(cat => {
        let limite = 0;
        // Valores por defecto según el requerimiento
        if (cat.codigo === 'PISTOLAS' || cat.codigo === 'PIST') limite = 25;
        else if (cat.codigo === 'ESCOPETAS' || cat.codigo === 'ESCO') limite = 50;
        else if (cat.codigo === 'CAR22') limite = 35;
        else if (cat.codigo === 'CAR9MM') limite = 35;
        return { categoriaArmaId: cat.id, limiteMaximo: limite };
      });
      setLimitesCategoria(limitesIniciales);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVendedorToggle = (vendedorId: number) => {
    setVendedorIdsSeleccionados(prev => {
      if (prev.includes(vendedorId)) {
        // Remover vendedor
        setLimitesVendedores(prevLimites => prevLimites.filter(l => l.vendedorId !== vendedorId));
        return prev.filter(id => id !== vendedorId);
      } else {
        // Agregar vendedor con límite 0 por defecto
        setLimitesVendedores(prevLimites => [...prevLimites, { vendedorId, limiteArmas: 0 }]);
        return [...prev, vendedorId];
      }
    });
  };

  const handleLimiteVendedorChange = (vendedorId: number, nuevoLimite: number) => {
    setLimitesVendedores(prev => {
      const index = prev.findIndex(l => l.vendedorId === vendedorId);
      if (index >= 0) {
        const nuevos = [...prev];
        nuevos[index] = { vendedorId, limiteArmas: nuevoLimite };
        return nuevos;
      } else {
        return [...prev, { vendedorId, limiteArmas: nuevoLimite }];
      }
    });
  };

  const getLimiteVendedor = (vendedorId: number): number => {
    const limite = limitesVendedores.find(l => l.vendedorId === vendedorId);
    return limite ? limite.limiteArmas : 0;
  };
  
  const handleLimiteChange = (categoriaId: number, nuevoLimite: number) => {
    setLimitesCategoria(prev => {
      const index = prev.findIndex(l => l.categoriaArmaId === categoriaId);
      if (index >= 0) {
        const nuevos = [...prev];
        nuevos[index] = { categoriaArmaId: categoriaId, limiteMaximo: nuevoLimite };
        return nuevos;
      } else {
        return [...prev, { categoriaArmaId: categoriaId, limiteMaximo: nuevoLimite }];
      }
    });
  };
  
  const getLimitePorCategoria = (categoriaId: number): number => {
    const limite = limitesCategoria.find(l => l.categoriaArmaId === categoriaId);
    return limite ? limite.limiteMaximo : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del grupo');
      return;
    }

    if (!licenciaId) {
      alert('Por favor selecciona una licencia');
      return;
    }

    // Validar TRA si se proporciona
    if (tra.trim() && !tra.match(/^TRA-\d+$/)) {
      alert('El formato de TRA debe ser TRA- seguido de números (ej: TRA-1212121212)');
      return;
    }

    // Validar límites de vendedores si es tipo CUPO
    if (tipoGrupo === 'CUPO' && limitesVendedores.length > 0) {
      // Obtener el límite de PISTOLAS desde límites por categoría
      const categoriaPistolas = categorias.find(cat => 
        cat.codigo === 'PISTOLAS' || cat.codigo === 'PIST'
      );
      const limitePistolas = categoriaPistolas 
        ? getLimitePorCategoria(categoriaPistolas.id)
        : 0;

      if (limitePistolas <= 0) {
        alert('Debe definir un límite de pistolas mayor a 0 en los límites por categoría');
        return;
      }

      // Validar que todos los vendedores seleccionados tengan límite definido (mínimo 1)
      const vendedoresSinLimite = limitesVendedores.filter(l => l.limiteArmas < 1);
      if (vendedoresSinLimite.length > 0) {
        alert('Todos los vendedores seleccionados deben tener un límite de armas mayor o igual a 1');
        return;
      }

      // Validar que la suma de límites no exceda el límite de pistolas
      const sumaLimites = limitesVendedores.reduce((suma, l) => suma + l.limiteArmas, 0);
      if (sumaLimites > limitePistolas) {
        alert(`La suma de límites de armas por vendedor (${sumaLimites}) excede el límite de pistolas (${limitePistolas})`);
        return;
      }
    }
    
    try {
      setCreando(true);
      
      // Preparar vendedores con límites para el payload
      const vendedoresPayload = limitesVendedores.length > 0 
        ? limitesVendedores.map(l => ({ vendedorId: l.vendedorId, limiteArmas: l.limiteArmas }))
        : undefined;
      
      if (modo === 'editar' && grupoId) {
        // Modo edición
        const resultado = await apiService.actualizarGrupoImportacion(grupoId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
          tipoGrupo,
          tra: tra.trim() || undefined,
          vendedores: vendedoresPayload,
          limitesCategoria: tipoGrupo === 'CUPO' && limitesCategoria.length > 0 ? limitesCategoria : []
        });
        
        alert(`Grupo de importación "${resultado.nombre}" actualizado exitosamente`);
      } else {
        // Modo creación
        if (!licenciaId) {
          alert('Por favor selecciona una licencia');
          return;
        }
        
        const resultado = await apiService.crearGrupoImportacion({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          licenciaId,
          observaciones: observaciones.trim() || undefined,
          tipoGrupo,
          tra: tra.trim() || undefined,
          vendedores: vendedoresPayload,
          limitesCategoria: tipoGrupo === 'CUPO' && limitesCategoria.length > 0 ? limitesCategoria : undefined
        });

        alert(`Grupo de importación "${resultado.nombre}" creado exitosamente`);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(`Error ${modo === 'editar' ? 'actualizando' : 'creando'} grupo:`, error);
      alert(error.message || `Error al ${modo === 'editar' ? 'actualizar' : 'crear'} el grupo de importación`);
    } finally {
      setCreando(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {modo === 'editar' ? '✏️ Editar Grupo de Importación' : '➕ Crear Grupo de Importación'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Grupo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Grupo Importación 2024-01"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción opcional del grupo"
            />
          </div>

          {/* Licencia - Solo en modo creación */}
          {modo === 'crear' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Licencia <span className="text-red-500">*</span>
              </label>
              <select
                value={licenciaId || ''}
                onChange={(e) => setLicenciaId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecciona una licencia</option>
                {licencias.map((licencia) => {
                  const cupoTotal = (licencia.cupoCivil || 0) + 
                                   (licencia.cupoMilitar || 0) + 
                                   (licencia.cupoEmpresa || 0) + 
                                   (licencia.cupoDeportista || 0);
                  return (
                    <option key={licencia.id} value={licencia.id}>
                      {licencia.numero} - {licencia.nombre} 
                      {cupoTotal > 0 && ` (Cupo Total: ${cupoTotal})`}
                    </option>
                  );
                })}
              </select>
              {licencias.length === 0 && (
                <p className="text-sm text-red-500 mt-1">No hay licencias disponibles</p>
              )}
              {licenciaId && (
                <p className="text-sm text-gray-600 mt-1">
                  💡 Los cupos se calcularán automáticamente desde la licencia seleccionada
                </p>
              )}
            </div>
          )}

          {/* Tipo de Grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Grupo <span className="text-red-500">*</span>
            </label>
            <select
              value={tipoGrupo}
              onChange={(e) => setTipoGrupo(e.target.value as 'CUPO' | 'JUSTIFICATIVO')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="CUPO">CUPO (con límites por categoría)</option>
              <option value="JUSTIFICATIVO">JUSTIFICATIVO (sin límites)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {tipoGrupo === 'CUPO' 
                ? 'Para: Civiles, Deportistas, Uniformados PASIVOS'
                : 'Para: Uniformados ACTIVOS, Compañías de Seguridad, Deportistas'}
            </p>
          </div>

          {/* TRA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TRA (TRA-XXXXXXXXXX)
            </label>
            <input
              type="text"
              value={tra}
              onChange={(e) => setTra(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="TRA-1212121212"
              pattern="TRA-\d+"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: TRA- seguido de números (ej: TRA-1212121212)
            </p>
          </div>

          {/* Vendedores Seleccionables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Vendedores Asignados al Grupo
              {tipoGrupo === 'CUPO' && licenciaId && (
                <span className="text-xs text-gray-500 ml-2">
                  (Límite de armas por vendedor)
                </span>
              )}
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {vendedores.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Cargando vendedores...</p>
              ) : (
                vendedores.map((vendedor) => {
                  const estaSeleccionado = vendedorIdsSeleccionados.includes(vendedor.id);
                  const limiteActual = getLimiteVendedor(vendedor.id);
                  
                  // Obtener el límite de PISTOLAS desde límites por categoría
                  const categoriaPistolas = categorias.find(cat => 
                    cat.codigo === 'PISTOLAS' || cat.codigo === 'PIST'
                  );
                  const limitePistolas = categoriaPistolas 
                    ? getLimitePorCategoria(categoriaPistolas.id)
                    : 0;
                  
                  // Calcular suma actual de límites de todos los vendedores
                  const sumaLimites = limitesVendedores.reduce((suma, l) => suma + l.limiteArmas, 0);
                  
                  // El máximo permitido para este vendedor es: límite de pistolas - (suma de otros vendedores)
                  // Restamos el límite actual de este vendedor para calcular cuánto pueden tener los demás
                  const limiteMaximoPermitido = limitePistolas - (sumaLimites - limiteActual);
                  
                  return (
                    <div
                      key={vendedor.id}
                      className={`p-3 rounded-lg transition-colors ${
                        estaSeleccionado ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={() => handleVendedorToggle(vendedor.id)}
                          className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">
                              {vendedor.nombreCompleto}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{vendedor.email}</p>
                          
                          {/* Campo de límite de armas - Solo visible si está seleccionado y es tipo CUPO */}
                          {estaSeleccionado && tipoGrupo === 'CUPO' && licenciaId && limitePistolas > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Límite de armas para este vendedor
                                <span className="text-gray-500 ml-1">
                                  (Máx: {limiteMaximoPermitido}, Límite pistolas: {limitePistolas})
                                </span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={limiteActual > 0 ? limiteActual : ''}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  // Permitir escribir cualquier número, incluso si excede el límite
                                  // La validación se mostrará como advertencia pero no bloqueará la entrada
                                  if (valor === '') {
                                    // Permitir campo vacío temporalmente mientras se escribe
                                    handleLimiteVendedorChange(vendedor.id, 0);
                                    return;
                                  }
                                  const nuevoLimite = parseInt(valor) || 0;
                                  handleLimiteVendedorChange(vendedor.id, nuevoLimite);
                                }}
                                onBlur={(e) => {
                                  // Al perder el foco, asegurar que tenga al menos 1
                                  const valor = parseInt(e.target.value) || 0;
                                  if (valor < 1) {
                                    handleLimiteVendedorChange(vendedor.id, 1);
                                  }
                                }}
                                onFocus={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="1"
                              />
                              {limiteActual > limiteMaximoPermitido && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ El límite excede el disponible. Máximo permitido: {limiteMaximoPermitido}
                                </p>
                              )}
                              {limiteActual < 1 && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ El límite mínimo es 1
                                </p>
                              )}
                              {sumaLimites > limitePistolas && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ La suma de límites ({sumaLimites}) excede el límite de pistolas ({limitePistolas})
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Vendedores seleccionados: {vendedorIdsSeleccionados.length} / {vendedores.length}
              {tipoGrupo === 'CUPO' && limitesVendedores.length > 0 && (
                <span className="ml-2">
                  | Suma de límites: {limitesVendedores.reduce((suma, l) => suma + l.limiteArmas, 0)}
                </span>
              )}
            </p>
            {vendedorIdsSeleccionados.length === 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  💡 Puede dejar sin vendedores asignados y agregarlos más tarde
                </p>
              </div>
            )}
            {tipoGrupo === 'CUPO' && vendedorIdsSeleccionados.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Para grupos tipo CUPO, debe asignar un límite de armas a cada vendedor. La suma de todos los límites no puede exceder el cupo total de la licencia.
                </p>
              </div>
            )}
          </div>

          {/* Límites por Categoría (solo para tipo CUPO) */}
          {tipoGrupo === 'CUPO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Límites por Categoría
              </label>
              <div className="border border-gray-300 rounded-lg p-4 space-y-3">
                {categorias.length === 0 ? (
                  <p className="text-sm text-gray-500">Cargando categorías...</p>
                ) : (
                  categorias.map((categoria) => (
                    <div key={categoria.id} className="flex items-center justify-between">
                      <label className="text-sm text-gray-700 flex-1">
                        {categoria.nombre} ({categoria.codigo})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={getLimitePorCategoria(categoria.id)}
                        onChange={(e) => handleLimiteChange(categoria.id, parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                        placeholder="0"
                      />
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Límites por defecto: 25 PISTOLAS, 50 ESCOPETAS, 35 CARABINAS .22, 35 CARABINAS 9MM
              </p>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Observaciones adicionales"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={creando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={creando}
            >
              {creando 
                ? (modo === 'editar' ? 'Actualizando...' : 'Creando...') 
                : (modo === 'editar' ? 'Actualizar Grupo' : 'Crear Grupo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCrearGrupo;

