import React from 'react';
import { MessageSquare, Clock, Users, Calendar, Brain, Zap, Target, TrendingUp, DollarSign, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const ClasificadorMetricsCards: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['clasificadorMetrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_metricas_clasificador')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          total_clasificaciones: 0,
          conversaciones_complejas: 0,
          multiples_personas: 0,
          quiere_cita: 0,
          menciona_tiempo: 0,
          casos_urgentes: 0,
          tiempo_respuesta_promedio: 0,
          cambios_contexto_promedio: 0,
          costo_total: 0,
          longitud_promedio: 0,
          tokens_promedio: 0,
          respuestas_exitosas: 0,
          mensajes_historial_promedio: 0,
          advertencias_horario: 0,
          errores_total: 0,
          tasa_exito: 0
        };
      }
      
      const totalClasificaciones = data.length;
      const conversacionesComplejas = data.filter(item => item.conversacion_compleja).length;
      const multiplesPersonas = data.filter(item => item.multiples_personas).length;
      const quiereCita = data.filter(item => item.quiere_cita).length;
      const mencionaTiempo = data.filter(item => item.menciona_hora || item.menciona_dia).length;
      const casosUrgentes = data.filter(item => item.es_urgente).length;
      const respuestasExitosas = data.filter(item => item.respuesta_exitosa).length;
      const erroresTotal = data.filter(item => item.error_mensaje).length;
      const advertenciasHorario = data.filter(item => item.advertencias_horario && Object.keys(item.advertencias_horario).length > 0).length;
      
      const tiempoData = data.filter(item => item.tiempo_respuesta_real);
      const tiempoPromedio = tiempoData.length > 0 ? 
        tiempoData.reduce((sum, item) => {
          const tiempo = typeof item.tiempo_respuesta_real === 'string' 
            ? parseFloat(item.tiempo_respuesta_real) 
            : (item.tiempo_respuesta_real || 0);
          return sum + tiempo;
        }, 0) / tiempoData.length : 0;
        
      const cambiosContextoPromedio = data.reduce((sum, item) => 
        sum + (item.cambios_de_contexto || 0), 0) / totalClasificaciones;
        
      const costoTotal = data.reduce((sum, item) => 
        sum + (item.costo_estimado || 0), 0);
        
      const longitudPromedio = data.reduce((sum, item) => 
        sum + (item.longitud_mensaje || 0), 0) / totalClasificaciones;
        
      const tokensPromedio = data.reduce((sum, item) => 
        sum + (item.max_tokens || 0), 0) / totalClasificaciones;
        
      const mensajesHistorialPromedio = data.reduce((sum, item) => 
        sum + (item.mensajes_en_historial || 0), 0) / totalClasificaciones;
      
      const tasaExito = totalClasificaciones > 0 ? (respuestasExitosas / totalClasificaciones) * 100 : 0;
      
      return {
        total_clasificaciones: totalClasificaciones,
        conversaciones_complejas: conversacionesComplejas,
        multiples_personas: multiplesPersonas,
        quiere_cita: quiereCita,
        menciona_tiempo: mencionaTiempo,
        casos_urgentes: casosUrgentes,
        tiempo_respuesta_promedio: tiempoPromedio,
        cambios_contexto_promedio: cambiosContextoPromedio,
        costo_total: costoTotal,
        longitud_promedio: longitudPromedio,
        tokens_promedio: tokensPromedio,
        respuestas_exitosas: respuestasExitosas,
        mensajes_historial_promedio: mensajesHistorialPromedio,
        advertencias_horario: advertenciasHorario,
        errores_total: erroresTotal,
        tasa_exito: tasaExito
      };
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-center flex-1">Sin Datos</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">0</div>
            <p className="text-sm text-muted-foreground text-center">
              No hay clasificaciones
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Total Clasificado</CardTitle>
                <Brain className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-blue-600">
                  {metrics.total_clasificaciones.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Mensajes procesados
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Total Mensajes Clasificados</p>
            <p className="text-sm">Número total de mensajes que han pasado por el sistema de clasificación de IA en las últimas 24 horas. Cada mensaje es analizado para determinar su intención y prioridad.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Conversaciones Complejas</CardTitle>
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-orange-600">
                  {metrics.conversaciones_complejas.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Requieren atención
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Conversaciones Complejas</p>
            <p className="text-sm">Mensajes clasificados como complejos por la IA. Estas conversaciones pueden requerir intervención humana debido a su naturaleza técnica o emocional.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Múltiples Personas</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-purple-600">
                  {metrics.multiples_personas.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Conversaciones grupales
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Conversaciones con Múltiples Personas</p>
            <p className="text-sm">Mensajes donde la IA ha detectado que participan varias personas. Esto ayuda a personalizar las respuestas y manejar la complejidad de conversaciones grupales.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Solicitudes Cita</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-green-600">
                  {metrics.quiere_cita.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Intención de agendar
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Solicitudes de Cita Detectadas</p>
            <p className="text-sm">Mensajes donde la IA ha identificado la intención del usuario de agendar una cita médica. Esta clasificación automática acelera el proceso de agenda.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Menciones Tiempo</CardTitle>
                <Clock className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-indigo-600">
                  {metrics.menciona_tiempo.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Fechas/horarios mencionados
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Menciones de Tiempo</p>
            <p className="text-sm">Mensajes que incluyen referencias temporales como fechas, horas o días. Esto ayuda al sistema a entender la urgencia y programar respuestas apropiadas.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Casos Urgentes</CardTitle>
                <Zap className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-red-600">
                  {metrics.casos_urgentes.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Alta prioridad
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Casos Urgentes Clasificados</p>
            <p className="text-sm">Mensajes identificados como urgentes por el clasificador de IA. Estos casos reciben prioridad máxima en la atención y pueden activar alertas especiales.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Tiempo Respuesta</CardTitle>
                <Target className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-teal-600">
                  {metrics.tiempo_respuesta_promedio.toFixed(1)}s
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Promedio real
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Tiempo de Respuesta Promedio</p>
            <p className="text-sm">Tiempo promedio real que toma el sistema de IA en procesar y generar una respuesta. Este KPI ayuda a monitorear el rendimiento del clasificador.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Cambios Contexto</CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-amber-600">
                  {metrics.cambios_contexto_promedio.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Promedio por conversación
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Cambios de Contexto Promedio</p>
            <p className="text-sm">Número promedio de veces que cambia el tema de conversación dentro de un mismo chat. Valores altos pueden indicar confusión o múltiples consultas.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Costo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-green-600">
                  ${metrics.costo_total.toFixed(4)}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  API clasificador
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Costo Total del Clasificador</p>
            <p className="text-sm">Costo acumulado en las últimas 24h por el uso de APIs de IA específicamente para clasificación de mensajes. Incluye tokens de análisis y procesamiento.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Longitud Prom.</CardTitle>
                <FileText className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-cyan-600">
                  {metrics.longitud_promedio.toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Caracteres promedio
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Longitud Promedio de Mensajes</p>
            <p className="text-sm">Número promedio de caracteres en los mensajes procesados por el clasificador. Mensajes más largos requieren más procesamiento y tokens.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Tokens Prom.</CardTitle>
                <Brain className="h-4 w-4 text-violet-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-violet-600">
                  {metrics.tokens_promedio.toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Tokens por mensaje
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Tokens Promedio por Clasificación</p>
            <p className="text-sm">Número promedio de tokens utilizados por el modelo de IA para clasificar cada mensaje. Directamente relacionado con el costo de procesamiento.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Respuestas Exitosas</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-emerald-600">
                  {metrics.respuestas_exitosas.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Clasificaciones OK
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Respuestas Exitosas del Clasificador</p>
            <p className="text-sm">Número de mensajes que fueron clasificados exitosamente sin errores. Una métrica clave para evaluar la confiabilidad del sistema.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Tasa de Éxito</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-blue-600">
                  {metrics.tasa_exito.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Clasificaciones exitosas
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Tasa de Éxito del Clasificador</p>
            <p className="text-sm">Porcentaje de mensajes clasificados exitosamente versus el total procesado. Una tasa alta indica un clasificador confiable y bien entrenado.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Historial Prom.</CardTitle>
                <MessageSquare className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-slate-600">
                  {metrics.mensajes_historial_promedio.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Mensajes en contexto
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Mensajes en Historial Promedio</p>
            <p className="text-sm">Número promedio de mensajes previos que el clasificador considera como contexto para cada clasificación. Más contexto puede mejorar la precisión.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Advertencias Horario</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-yellow-600">
                  {metrics.advertencias_horario.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Fuera de horario
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Advertencias de Horario</p>
            <p className="text-sm">Número de mensajes donde el clasificador detectó solicitudes fuera del horario de atención. Estas advertencias ayudan a manejar expectativas del usuario.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Errores Total</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-red-600">
                  {metrics.errores_total.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Clasificaciones fallidas
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Errores Totales del Clasificador</p>
            <p className="text-sm">Número de mensajes que el clasificador no pudo procesar correctamente. Los errores pueden deberse a contenido no válido, límites de API o problemas técnicos.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};