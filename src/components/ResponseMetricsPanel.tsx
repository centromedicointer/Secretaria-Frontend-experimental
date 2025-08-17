import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, Target } from 'lucide-react';

const ResponseMetricsPanel = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['responseMetrics'],
    queryFn: async () => {
      // Get response times from n8n_mensajes
      const { data: messages } = await supabase
        .from('n8n_mensajes')
        .select('fecha_recibido, fecha_respuesta')
        .not('fecha_respuesta', 'is', null)
        .not('fecha_recibido', 'is', null)
        .gte('fecha_recibido', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!messages || messages.length === 0) {
        return {
          avgResponseTime: 0,
          totalResponses: 0,
          fastResponses: 0,
          slowResponses: 0
        };
      }

      // Calculate response times
      const responseTimes = messages.map(msg => {
        const received = new Date(msg.fecha_recibido!).getTime();
        const responded = new Date(msg.fecha_respuesta!).getTime();
        return (responded - received) / (1000 * 60); // minutes
      }).filter(time => time > 0 && time < 1440); // Filter out invalid times (> 24h)

      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;
      
      const fastResponses = responseTimes.filter(time => time <= 5).length;
      const slowResponses = responseTimes.filter(time => time > 30).length;

      return {
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        totalResponses: messages.length,
        fastResponses,
        slowResponses
      };
    },
    refetchInterval: 30000,
  });

  const { data: totalMessages } = useQuery({
    queryKey: ['totalMessages'],
    queryFn: async () => {
      const { data: messages } = await supabase
        .from('n8n_mensajes')
        .select('id')
        .gte('fecha_recibido', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return messages?.length || 0;
    },
    refetchInterval: 30000,
  });

  const { data: errorCount } = useQuery({
    queryKey: ['errorCount'],
    queryFn: async () => {
      const { data } = await supabase
        .from('n8n_errores_whatsapp')
        .select('id')
        .gte('fecha_error', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return data?.length || 0;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Métricas de Respuesta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getResponseTimeBadge = (avgTime: number) => {
    if (avgTime <= 5) return { variant: 'default' as const, label: 'Excelente' };
    if (avgTime <= 15) return { variant: 'secondary' as const, label: 'Bueno' };
    if (avgTime <= 30) return { variant: 'outline' as const, label: 'Regular' };
    return { variant: 'destructive' as const, label: 'Lento' };
  };

  const responseTimeBadge = getResponseTimeBadge(metrics?.avgResponseTime || 0);
  const successRate = totalMessages && metrics?.totalResponses 
    ? (metrics.totalResponses / totalMessages) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Métricas de Respuesta (Últimos 7 días)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Response Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Tiempo Promedio</span>
              </div>
              <Badge variant={responseTimeBadge.variant}>
                {responseTimeBadge.label}
              </Badge>
            </div>
            <div className="text-2xl font-bold">
              {metrics?.avgResponseTime || 0} min
            </div>
            <div className="text-sm text-muted-foreground">
              De {metrics?.totalResponses || 0} respuestas
            </div>
          </div>

          {/* Success Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Tasa de Respuesta</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Mensajes respondidos
            </div>
          </div>

          {/* Fast Responses */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Respuestas Rápidas</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.fastResponses || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              ≤ 5 minutos
            </div>
          </div>

          {/* Errors (24h) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Errores (24h)</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {errorCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Errores recientes
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="mt-6 pt-4 border-t space-y-3">
          <h4 className="font-semibold">Indicadores de Rendimiento</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Respuestas lentas (&gt;30 min)</span>
              <span className="text-sm font-medium text-red-600">
                {metrics?.slowResponses || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Eficiencia general</span>
              <Badge variant={
                (metrics?.fastResponses || 0) > (metrics?.slowResponses || 0) 
                  ? 'default' 
                  : 'outline'
              }>
                {(metrics?.fastResponses || 0) > (metrics?.slowResponses || 0) 
                  ? 'Óptima' 
                  : 'Mejorable'
                }
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponseMetricsPanel;