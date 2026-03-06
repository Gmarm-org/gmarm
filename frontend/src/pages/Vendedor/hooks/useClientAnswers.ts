import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiService } from '../../../services/api';
import type { RespuestaFormulario } from './useClientFormData';

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

  const preguntasCacheRef = useRef<Map<string, any[]>>(new Map());
  const ultimaClavePreguntasRef = useRef<string>('');

  const cacheKeyPreguntas = useMemo(() => {
    if (!tipoClienteId || !tipoCliente) return '';
    const esMilitar = esTipoMilitar(tipoCliente);
    return `${tipoClienteId}-${tipoCliente}-${esMilitar ? estadoMilitar || '' : ''}`;
  }, [tipoClienteId, tipoCliente, estadoMilitar, esTipoMilitar]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!tipoClienteId || !tipoCliente) {
        setClientQuestions([]);
        return;
      }

      if (cacheKeyPreguntas && cacheKeyPreguntas === ultimaClavePreguntasRef.current && preguntasCacheRef.current.has(cacheKeyPreguntas)) {
        const preguntasCacheadas = preguntasCacheRef.current.get(cacheKeyPreguntas);
        if (preguntasCacheadas && preguntasCacheadas.length > 0) {
          setClientQuestions(preguntasCacheadas);
          return;
        }
      }

      if (cacheKeyPreguntas && cacheKeyPreguntas === ultimaClavePreguntasRef.current) {
        return;
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
  }, [cacheKeyPreguntas, tipoClienteId, tipoCliente, estadoMilitar, esTipoMilitar]);

  const respuestasCacheRef = useRef<Map<string, RespuestaFormulario[]>>(new Map());
  const ultimoClientIdCargadoRef = useRef<string>('');

  useEffect(() => {
    const loadExistingAnswers = async () => {
      const clientIdStr = clientId?.toString()?.trim();
      if (!clientIdStr) return;

      if (clientIdStr !== ultimoClientIdCargadoRef.current) {
        ultimoClientIdCargadoRef.current = '';
      }
      
      if (clientIdStr === ultimoClientIdCargadoRef.current && formDataRespuestas && formDataRespuestas.length > 0) {
        const respuestasValidas = formDataRespuestas.filter(r => r.pregunta && r.respuesta);
        if (respuestasValidas.length > 0) {
          return;
        }
      }

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
          const respuestasValidas = respuestas.filter(r => {
            return r && (r.pregunta || r.preguntaTexto || r.pregunta?.pregunta) && r.respuesta;
          });
          
          // Limitar para evitar procesamiento excesivo
          const respuestasLimitadas = respuestasValidas.slice(0, 100);
          
          const respuestasFormateadas: RespuestaFormulario[] = respuestasLimitadas.map(r => ({
            id: r.id?.toString() || Math.random().toString(),
            pregunta: r.preguntaTexto || r.pregunta?.pregunta || r.pregunta || '',
            respuesta: r.respuesta || '',
            tipo: 'TEXTO',
            questionId: r.preguntaId || r.pregunta?.id
          }));
          
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

  const getAnswerForQuestion = useMemo(() => {
    return (question: string) => {
      const respuesta = formDataRespuestas.find(r => r.pregunta === question);
      return respuesta ? respuesta.respuesta : '';
    };
  }, [formDataRespuestas]);

  const handleAnswerChange = useCallback((
    question: string, 
    answer: string, 
    preguntaId?: number,
    onClienteBloqueado?: (clientId: string, bloqueado: boolean, motivo: string) => void,
    setClienteBloqueado?: (bloqueado: boolean) => void,
    setMotivoBloqueo?: (motivo: string) => void
  ) => {
    // Deportistas (DEP) no tienen límite de armas, así que solo se valida si la respuesta incluye cantidad
    if (question.toLowerCase().includes('armas registradas')) {
      const tieneDosMasArmas = answer.includes('2 armas') || answer.includes('más armas');

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
