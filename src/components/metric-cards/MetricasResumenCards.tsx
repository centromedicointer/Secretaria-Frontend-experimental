import React from 'react';
import { Brain, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MetricasResumenData {
  fecha: string;
  total_mensajes: number;
  modelo_usado: string;
  costo_total: number;
  promedio_longitud: number;
  tasa_exito: number;
  casos_urgentes: number;
  casos_multiples: number;
}

export const MetricasResumenCards: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metricasResumen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_metricas_resumen' as any)
        .select('*')
        .order('fecha', { ascending: false })
        .limit(5); // Obtener datos de diferentes modelos
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          total_mensajes: 0,
          costo_total: 0,
          tasa_exito_promedio: 0,
          casos_urgentes_total: 0,
          modelos_usados: 0,
          promedio_longitud: 0
        };
      }
      
      // Agregar datos de todos los modelos
      const resumenData = data as any[];
      const totalMensajes = resumenData.reduce((sum, item) => sum + (item.total_mensajes || 0), 0);
      const costoTotal = resumenData.reduce((sum, item) => sum + (item.costo_total || 0), 0);
      const casosUrgentesTotal = resumenData.reduce((sum, item) => sum + (item.casos_urgentes || 0), 0);
      const tasaExitoPromedio = resumenData.length > 0 ? 
        resumenData.reduce((sum, item) => sum + (item.tasa_exito || 0), 0) / resumenData.length : 0;
      const promedioLongitud = resumenData.length > 0 ?
        resumenData.reduce((sum, item) => sum + (parseFloat(item.promedio_longitud) || 0), 0) / resumenData.length : 0;
      
      return {
        total_mensajes: totalMensajes,
        costo_total: costoTotal,
        tasa_exito_promedio: tasaExitoPromedio,
        casos_urgentes_total: casosUrgentesTotal,
        modelos_usados: new Set(resumenData.map(item => item.modelo_usado)).size,
        promedio_longitud: promedioLongitud
      };
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-center flex-1">Sin Datos</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">0</div>
            <p className="text-sm text-muted-foreground text-center">
              No hay métricas de IA
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Mensajes IA</CardTitle>
                <Brain className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-purple-600">
                  {metrics.total_mensajes.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Procesados por IA
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Mensajes Procesados por IA</p>
            <p className="text-sm">Total de mensajes que han sido analizados y procesados por los modelos de inteligencia artificial del sistema para generar respuestas automáticas.</p>
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
                  Costo de API
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Costo Total de APIs de IA</p>
            <p className="text-sm">Costo acumulado de las llamadas a las APIs de inteligencia artificial (OpenAI, Claude, etc.) utilizadas para procesar mensajes y generar respuestas.</p>
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
                  {metrics.tasa_exito_promedio.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Respuestas exitosas
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Tasa de Éxito de IA</p>
            <p className="text-sm">Porcentaje de mensajes que la IA logró procesar exitosamente y generar una respuesta apropiada. Una tasa alta indica un buen rendimiento del modelo.</p>
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
                  {metrics.casos_urgentes_total.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Prioridad alta
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Casos Urgentes Detectados</p>
            <p className="text-sm">Mensajes que la IA ha clasificado como urgentes o de alta prioridad. Estos casos requieren atención inmediata y pueden incluir emergencias médicas o situaciones críticas.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Modelos Activos</CardTitle>
                <Brain className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-indigo-600">
                  {metrics.modelos_usados.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Modelos diferentes
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Modelos de IA Activos</p>
            <p className="text-sm">Número de diferentes modelos de IA que están siendo utilizados actualmente en el sistema (GPT-4, Claude, etc.). La diversidad de modelos mejora la calidad de respuestas.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Longitud Prom.</CardTitle>
                <Brain className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-amber-600">
                  {metrics.promedio_longitud.toFixed(1)} chars
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Tamaño promedio mensaje
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Longitud Promedio de Mensajes</p>
            <p className="text-sm">Número promedio de caracteres en los mensajes procesados por la IA. Esta métrica ayuda a optimizar el uso de tokens y costos de API.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};