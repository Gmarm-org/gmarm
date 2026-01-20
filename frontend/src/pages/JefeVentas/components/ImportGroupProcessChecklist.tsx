import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../../services/api';

interface ProcesoImportacion {
  id: number;
  etapa: string;
  etapaLabel: string;
  fechaPlanificada: string | null;
  completado: boolean;
  enAlerta: boolean;
  diasRestantes: number | null;
}

interface ImportGroupProcessChecklistProps {
  grupoId: number;
}

const etapaOrden: string[] = [
  'INGRESO_DOCUMENTACION',
  'INSPECCION',
  'RESOLUCION',
  'PREVIA_IMPORTACION_INICIO',
  'PREVIA_IMPORTACION_FINALIZADA',
  'PAGO_FABRICA',
  'AWB',
  'GUIA_AVIANCA',
  'AFORO',
  'GUIA_LIBRE_TRANSITO',
  'SALIDA_AEROPUERTO',
  'LIBERACION_CUPO',
  'LIQUIDACION'
];

const ImportGroupProcessChecklist: React.FC<ImportGroupProcessChecklistProps> = ({ grupoId }) => {
  const [procesos, setProcesos] = useState<ProcesoImportacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [estadoGrupo, setEstadoGrupo] = useState<string | null>(null);

  const procesosOrdenados = useMemo(() => {
    const ordenMap = new Map(etapaOrden.map((etapa, index) => [etapa, index]));
    return [...procesos].sort((a, b) => {
      const ordenA = ordenMap.get(a.etapa) ?? 999;
      const ordenB = ordenMap.get(b.etapa) ?? 999;
      return ordenA - ordenB;
    });
  }, [procesos]);

  useEffect(() => {
    const cargarProcesos = async () => {
      setLoading(true);
      try {
        const grupo = await apiService.getGrupoImportacion(grupoId);
        setEstadoGrupo(grupo?.estado || null);
        const data = await apiService.getProcesosGrupoImportacion(grupoId);
        setProcesos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error cargando procesos de importación:', error);
        setProcesos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarProcesos();
  }, [grupoId]);

  const actualizarProceso = async (etapa: string, cambios: Partial<ProcesoImportacion>) => {
    try {
      setGuardando(true);
      const updates = [
        {
          etapa,
          fechaPlanificada: cambios.fechaPlanificada ?? null,
          completado: typeof cambios.completado === 'boolean' ? cambios.completado : null
        }
      ];
      const data = await apiService.actualizarProcesosGrupoImportacion(grupoId, updates);
      setProcesos(Array.isArray(data) ? data : procesos);
    } catch (error) {
      console.error('Error actualizando proceso:', error);
      alert('No se pudo actualizar el proceso');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 text-center text-gray-500">
        Cargando procesos...
      </div>
    );
  }

  const checklistHabilitado = estadoGrupo !== null && !['BORRADOR', 'EN_PREPARACION', 'EN_PROCESO_ASIGNACION_CLIENTES'].includes(estadoGrupo);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">📌 Proceso de Importación</h3>
        {guardando && <span className="text-xs text-gray-500">Guardando...</span>}
      </div>
      {!checklistHabilitado && (
        <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          El checklist estará habilitado después de definir el pedido del grupo.
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OK</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Alerta</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {procesosOrdenados.map((proceso) => (
              <tr key={proceso.id} className={proceso.enAlerta ? 'bg-red-50' : ''}>
                <td className="px-3 py-2 text-sm text-gray-800 whitespace-nowrap">
                  {proceso.etapaLabel || proceso.etapa}
                </td>
                <td className="px-3 py-2 text-center text-sm text-gray-700">
                  <input
                    type="date"
                    value={proceso.fechaPlanificada ?? ''}
                    onChange={(event) => actualizarProceso(proceso.etapa, { fechaPlanificada: event.target.value || null })}
                    disabled={!checklistHabilitado}
                    className="border border-gray-300 rounded px-2 py-1 text-xs disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={!!proceso.completado}
                    onChange={(event) => actualizarProceso(proceso.etapa, { completado: event.target.checked })}
                    disabled={!checklistHabilitado}
                    className="h-4 w-4 text-blue-600 disabled:opacity-50"
                  />
                </td>
                <td className="px-3 py-2 text-center text-xs">
                  {proceso.enAlerta ? (
                    <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                      ⚠️ {proceso.diasRestantes !== null ? `${proceso.diasRestantes} días` : 'Pendiente'}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImportGroupProcessChecklist;
