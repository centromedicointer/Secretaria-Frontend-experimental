import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, MessageSquare } from 'lucide-react';

const PatternAnalysisPanel = () => {
  const { data: messageStats, isLoading } = useQuery({
    queryKey: ['messageStats'],
    queryFn: async () => {
      // Get messages data to analyze patterns
      const { data: messages } = await supabase
        .from('n8n_mensajes')
        .select('pregunta, respuesta, fecha_recibido, fecha_respuesta')
        .gte('fecha_recibido', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(200);

      if (!messages) return { total: 0, withResponse: 0, avgLength: 0, patterns: [] };

      // Analyze message patterns
      const total = messages.length;
      const withResponse = messages.filter(m => m.respuesta).length;
      const avgLength = messages.reduce((sum, m) => sum + (m.pregunta?.length || 0), 0) / total;

      // Simple pattern analysis based on keywords
      const patterns = [
        { name: 'Consultas de Cita', count: messages.filter(m => 
          m.pregunta?.toLowerCase().includes('cita') || 
          m.pregunta?.toLowerCase().includes('turno') ||
          m.pregunta?.toLowerCase().includes('agendar')
        ).length },
        { name: 'Información General', count: messages.filter(m => 
          m.pregunta?.toLowerCase().includes('información') || 
          m.pregunta?.toLowerCase().includes('horario') ||
          m.pregunta?.toLowerCase().includes('ubicación')
        ).length },
        { name: 'Urgencias', count: messages.filter(m => 
          m.pregunta?.toLowerCase().includes('urgente') || 
          m.pregunta?.toLowerCase().includes('emergencia') ||
          m.pregunta?.toLowerCase().includes('dolor')
        ).length },
        { name: 'Otros', count: 0 }
      ];

      // Calculate "Otros"
      const categorized = patterns.slice(0, 3).reduce((sum, p) => sum + p.count, 0);
      patterns[3].count = total - categorized;

      return {
        total,
        withResponse,
        avgLength: Math.round(avgLength),
        patterns: patterns.filter(p => p.count > 0)
      };
    },
    refetchInterval: 30000,
  });

  const { data: errorCount } = useQuery({
    queryKey: ['recentErrors'],
    queryFn: async () => {
      const { data: errors } = await supabase
        .from('n8n_errores_whatsapp')
        .select('id')
        .gte('fecha_error', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return errors?.length || 0;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis de Patrones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Análisis de Patrones (Últimos 7 días)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{messageStats?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Mensajes Totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{messageStats?.withResponse || 0}</div>
            <div className="text-sm text-muted-foreground">Con Respuesta</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount || 0}</div>
            <div className="text-sm text-muted-foreground">Errores (24h)</div>
          </div>
        </div>

        {/* Message Pattern Distribution */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Distribución por Tipo de Consulta
          </h4>
          <div className="space-y-3">
            {messageStats?.patterns?.map((pattern) => {
              const percentage = messageStats.total > 0 ? (pattern.count / messageStats.total) * 100 : 0;
              return (
                <div key={pattern.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{pattern.name}</span>
                    <span className="text-muted-foreground">
                      {pattern.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Trends */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Métricas Generales
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Tasa de respuesta:</span>
              <span className="font-medium">
                {messageStats?.total ? ((messageStats.withResponse / messageStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Longitud promedio:</span>
              <span className="font-medium">{messageStats?.avgLength || 0} caracteres</span>
            </div>
            <div className="flex justify-between">
              <span>Tipo más común:</span>
              <span className="font-medium">
                {messageStats?.patterns?.[0]?.name || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatternAnalysisPanel;