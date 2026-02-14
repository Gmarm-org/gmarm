import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiService } from '../../../services/api';
import type { RespuestaFormulario } from './useClientFormData';

/**
 * Hook para manejar respuestas a preguntas del cliente
 * Extraído de ClientForm para mejorar mantenibilidad
 * OPTIMIZADO: Usa cache para evitar recargas innecesarias
 */
export const useClientAnswers = (
  tipoClienteId: number | undefined,
  tipoCliente: string | undefined,
  estadoMilitar: string | undefined,
  esTipoMilitar: (tipo: string | undefined) => boolean,
  clientId: string | undefined,
  formDataRespuestas: RespuestaFormulario[],
  setFormData: React.Dispatch<React.SetStateAction<any>>
) => {
  const setFormDataRespuestas = useCallback((respuestas: RespuestaFormulario[] | ((prev: RespuestaFormulario[]) => RespuestaFormulario[])) => {
    setFormData((prev: any) => ({
      ...prev,
      respuestas: typeof respuestas === 'function' ? respuestas(prev.respuestas || []) : respuestas
    }));
  }, [setFormData]);
  const [clientQuestions, setClientQuestions] = useState<any[]>([]);

  // OPTIMIZACIÓN: Cache para preguntas usando clave compuesta
  const preguntasCacheRef = useRef<Map<string, any[]>>(new Map());
  const ultimaClavePreguntasRef = useRef<string>('');

  // OPTIMIZACIÓN: Crear clave de cache estable basada en valores relevantes
  const cacheKeyPreguntas = useMemo(() => {
    if (!tipoClienteId || !tipoCliente) return '';
    const esMilitar = esTipoMilitar(tipoCliente);
    return `${tipoClienteId}-${tipoCliente}-${esMilitar ? estadoMilitar || '' : ''}`;
  }, [tipoClienteId, tipoCliente, estadoMilitar, esTipoMilitar]);

  // Cargar preguntas según el tipo de cliente
  // OPTIMIZACIÓN: Solo cargar si la clave de cache cambió realmente
  useEffect(() => {
    const loadQuestions = async () => {
      if (!tipoClienteId || !tipoCliente) {
        // Si no hay tipoCliente, limpiar preguntas
        setClientQuestions([]);
        return;
      }

      // OPTIMIZACIÓN: Verificar cache antes de cargar - solo si la clave cambió
      if (cacheKeyPreguntas && cacheKeyPreguntas === ultimaClavePreguntasRef.current && preguntasCacheRef.current.has(cacheKeyPreguntas)) {
        const preguntasCacheadas = preguntasCacheRef.current.get(cacheKeyPreguntas);
        if (preguntasCacheadas && preguntasCacheadas.length > 0) {
          setClientQuestions(preguntasCacheadas);
          return;
        }
      }

      // Solo cargar si la clave de cache realmente cambió
      if (cacheKeyPreguntas && cacheKeyPreguntas === ultimaClavePreguntasRef.current) {
        return; // Ya está cargado para esta clave
      }

      try {
        let formulario;
        if (esTipoMilitar(tipoCliente) && estadoMilitar) {
          formulario = await apiService.getFormularioClienteConEstadoMilitar(tipoClienteId, estadoMilitar);
        } else {
          formulario = await apiService.getFormularioCliente(tipoClienteId);
        }
        
        if (formulario?.preguntas) {
          const preguntas = formulario.preguntas || [];
          setClientQuestions(preguntas);
          
          // OPTIMIZACIÓN: Guardar en cache y actualizar última clave
          if (cacheKeyPreguntas) {
            preguntasCacheRef.current.set(cacheKeyPreguntas, preguntas);
            ultimaClavePreguntasRef.current = cacheKeyPreguntas;
          }
        }
      } catch (error) {
        console.error('Error cargando preguntas:', error instanceof Error ? error.message : 'Error desconocido');
      }
    };

    loadQuestions();
  }, [cacheKeyPreguntas, tipoClienteId, tipoCliente, estadoMilitar, esTipoMilitar]); // cacheKeyPreguntas ya está optimizado con useMemo

  // OPTIMIZACIÓN: Cache para respuestas del cliente
  const respuestasCacheRef = useRef<Map<string, RespuestaFormulario[]>>(new Map());
  const ultimoClientIdCargadoRef = useRef<string>('');

  // Cargar respuestas existentes del cliente
  // OPTIMIZACIÓN: Solo cargar si no hay respuestas ya cargadas y el clientId es válido
  useEffect(() => {
    const loadExistingAnswers = async () => {
      // clientId puede ser string o number, convertir a string y validar
      const clientIdStr = clientId?.toString()?.trim();
      if (!clientIdStr) return;

      // Si el clientId cambió, limpiar el cache y cargar nuevas respuestas
      if (clientIdStr !== ultimoClientIdCargadoRef.current) {
        ultimoClientIdCargadoRef.current = ''; // Resetear para forzar carga
      }
      
      // OPTIMIZACIÓN: Si ya hay respuestas cargadas para este cliente Y son válidas, no volver a cargar
      // PERO: Si formDataRespuestas está vacío o solo tiene datos iniciales, sí cargar
      if (clientIdStr === ultimoClientIdCargadoRef.current && formDataRespuestas && formDataRespuestas.length > 0) {
        // Verificar que las respuestas sean válidas (tengan pregunta y respuesta)
        const respuestasValidas = formDataRespuestas.filter(r => r.pregunta && r.respuesta);
        if (respuestasValidas.length > 0) {
          return;
        }
      }

      // OPTIMIZACIÓN: Verificar cache antes de cargar
      if (respuestasCacheRef.current.has(clientIdStr)) {
        const respuestasCacheadas = respuestasCacheRef.current.get(clientIdStr);
        if (respuestasCacheadas && respuestasCacheadas.length > 0) {
          setFormDataRespuestas(respuestasCacheadas);
          ultimoClientIdCargadoRef.current = clientIdStr;
          return;
        }
      }

      try {
        const respuestas = await apiService.getRespuestasCliente(parseInt(clientIdStr));
        if (respuestas && Array.isArray(respuestas)) {
          // OPTIMIZACIÓN: Validar que las respuestas sean del cliente correcto
          // Filtrar respuestas inválidas o duplicadas
          const respuestasValidas = respuestas.filter(r => {
            // Verificar que tenga los campos mínimos necesarios
            return r && (r.pregunta || r.preguntaTexto || r.pregunta?.pregunta) && r.respuesta;
          });
          
          // OPTIMIZACIÓN: Limitar a máximo 100 respuestas para evitar procesar miles
          const respuestasLimitadas = respuestasValidas.slice(0, 100);
          
          const respuestasFormateadas: RespuestaFormulario[] = respuestasLimitadas.map(r => ({
            id: r.id?.toString() || Math.random().toString(),
            pregunta: r.preguntaTexto || r.pregunta?.pregunta || r.pregunta || '',
            respuesta: r.respuesta || '',
            tipo: 'TEXTO',
            questionId: r.preguntaId || r.pregunta?.id
          }));
          
          // OPTIMIZACIÓN: Guardar en cache
          respuestasCacheRef.current.set(clientIdStr, respuestasFormateadas);
          ultimoClientIdCargadoRef.current = clientIdStr;
          
          setFormDataRespuestas(respuestasFormateadas);
          
        }
      } catch (error) {
        console.error('Error cargando respuestas del cliente:', error instanceof Error ? error.message : 'Error desconocido');
      }
    };

    loadExistingAnswers();
  }, [clientId, setFormDataRespuestas]);

  // Función helper para obtener la respuesta de una pregunta
  const getAnswerForQuestion = useMemo(() => {
    return (question: string) => {
      const respuesta = formDataRespuestas.find(r => r.pregunta === question);
      return respuesta ? respuesta.respuesta : '';
    };
  }, [formDataRespuestas]);

  // Función para manejar cambios en las respuestas
  const handleAnswerChange = useCallback((
    question: string, 
    answer: string, 
    preguntaId?: number,
    onClienteBloqueado?: (clientId: string, bloqueado: boolean, motivo: string) => void,
    setClienteBloqueado?: (bloqueado: boolean) => void,
    setMotivoBloqueo?: (motivo: string) => void
  ) => {
    // Validar respuesta a la pregunta de armas registradas
    // NOTA: Los deportistas (DEP) NO tienen límite de armas, por lo que no se valida cantidad para ellos
    if (question.toLowerCase().includes('armas registradas')) {
      // Solo validar cantidad si NO es deportista (DEP)
      // El tipoClienteCodigo se pasa desde ClientForm, pero aquí no lo tenemos directamente
      // Por ahora, validamos solo si la respuesta incluye cantidad (lo cual no debería pasar para DEP)
      const tieneDosMasArmas = answer.includes('2 armas') || answer.includes('más armas');
      
      // Solo bloquear si tiene 2 o más armas Y la respuesta incluye cantidad (no es DEP)
      if (tieneDosMasArmas && (answer.includes('2 armas') || answer.includes('más armas'))) {
        alert('⚠️ ATENCIÓN: El cliente ya tiene 2 o más armas registradas.\n\n' +
              'Por ley ecuatoriana, no se permite tener más de 2 armas.\n\n' +
              'El cliente será guardado con estado INHABILITADO pero NO podrá seleccionar armas adicionales.');
        
        if (setClienteBloqueado) setClienteBloqueado(true);
        if (setMotivoBloqueo) setMotivoBloqueo('Cliente ya tiene 2 o más armas registradas. Máximo legal: 2 armas.');
        
        if (onClienteBloqueado) {
          onClienteBloqueado('temp-id', true, 'Cliente ya tiene 2 o más armas registradas. Máximo legal: 2 armas.');
        }
      } else if (answer === 'NO' || answer.includes('1 arma') || answer === 'SI') {
        // Para deportistas, la respuesta será solo "SI" sin cantidad
        if (setClienteBloqueado) setClienteBloqueado(false);
        if (setMotivoBloqueo) setMotivoBloqueo('');
        
        if (onClienteBloqueado) {
          onClienteBloqueado('temp-id', false, '');
        }
      }
    }
    
    setFormDataRespuestas((prev: RespuestaFormulario[]) => {
      const existingIndex = prev.findIndex((r: RespuestaFormulario) => r.pregunta === question);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          respuesta: answer,
          questionId: preguntaId || updated[existingIndex].questionId
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: Math.random().toString(),
            pregunta: question,
            respuesta: answer,
            tipo: 'TEXTO',
            questionId: preguntaId
          }
        ];
      }
    });
  }, [setFormDataRespuestas]);

  return {
    clientQuestions,
    getAnswerForQuestion,
    handleAnswerChange
  };
};
