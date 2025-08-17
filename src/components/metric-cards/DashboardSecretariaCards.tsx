import React from 'react';
import { Users, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardSecretariaMetrics {
  fecha: string;
  solicitudes_cita: number;
  sin_respuesta: number;
  total_mensajes: number;
  usuarios_unicos: number;
  tiempo_respuesta_seg: number;
}

export const DashboardSecretariaCards: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboardSecretaria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_dashboard_secretaria' as any)
        .select('*')
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        return {
          fecha: new Date().toISOString().split('T')[0],
          solicitudes_cita: 0,
          sin_respuesta: 0,
          total_mensajes: 0,
          usuarios_unicos: 0,
          tiempo_respuesta_seg: 0
        } as DashboardSecretariaMetrics;
      }
      
      const secretariaData = data as any;
      return {
        fecha: secretariaData.fecha,
        solicitudes_cita: secretariaData.solicitudes_cita || 0,
        sin_respuesta: secretariaData.sin_respuesta || 0,
        total_mensajes: secretariaData.total_mensajes || 0,
        usuarios_unicos: secretariaData.usuarios_unicos || 0,
        tiempo_respuesta_seg: secretariaData.tiempo_respuesta_seg || 0
      } as DashboardSecretariaMetrics;
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-center flex-1">Sin Datos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">0</div>
            <p className="text-sm text-muted-foreground text-center">
              No hay métricas de secretaria
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tiempoRespuestaMin = Math.round(metrics.tiempo_respuesta_seg / 60);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Solicitudes de Cita</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-blue-600">
                  {metrics.solicitudes_cita.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Citas solicitadas hoy
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Solicitudes de Cita</p>
            <p className="text-sm">Número de pacientes que han solicitado una cita hoy. Incluye todas las solicitudes procesadas por la secretaria IA durante el día actual.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Sin Respuesta</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-red-600">
                  {metrics.sin_respuesta.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Mensajes pendientes
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Mensajes Sin Respuesta</p>
            <p className="text-sm">Mensajes de pacientes que aún no han recibido respuesta de la secretaria IA. Requieren atención inmediata para mantener la calidad del servicio.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Total Mensajes</CardTitle>
                <MessageSquare className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-green-600">
                  {metrics.total_mensajes.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Mensajes procesados hoy
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Total de Mensajes</p>
            <p className="text-sm">Número total de mensajes procesados por la secretaria IA hoy. Incluye consultas, solicitudes de cita, confirmaciones y otros tipos de interacciones.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Tiempo Respuesta</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-amber-600">
                  {tiempoRespuestaMin} min
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Promedio de respuesta
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Tiempo Promedio de Respuesta</p>
            <p className="text-sm">Tiempo promedio que tarda la secretaria IA en responder a los mensajes de los pacientes. Un tiempo bajo indica un servicio eficiente y satisfacción del paciente.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};