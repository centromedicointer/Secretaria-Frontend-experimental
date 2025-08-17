import React from 'react';
import { Bell, MessageCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NotificationStats {
  total_notificaciones: number;
  recordatorios_dia_siguiente: number;
  nuevas_citas: number;
  otras_notificaciones: number;
}

export const NotificationMetricsCards: React.FC = () => {
  const { data: notificationStats, isLoading } = useQuery({
    queryKey: ['notificationStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_logs_notificaciones')
        .select('tipo_notificacion')
        .gte('fecha_notificacion', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      const stats = {
        total_notificaciones: data?.length || 0,
        recordatorios_dia_siguiente: data?.filter(n => n.tipo_notificacion === 'recordatorio_dia_siguiente').length || 0,
        nuevas_citas: data?.filter(n => n.tipo_notificacion === 'nueva_cita').length || 0,
        otras_notificaciones: data?.filter(n => n.tipo_notificacion && 
          !['recordatorio_dia_siguiente', 'nueva_cita'].includes(n.tipo_notificacion)).length || 0,
      };

      return stats as NotificationStats;
    },
    refetchInterval: 30000
  });

  const { data: remindersStats } = useQuery({
    queryKey: ['remindersStats'],
    queryFn: async () => {
      // Use appointments table as fallback since appointments_recordatorios might not be available
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      const totalWithReminders = data?.filter(a => a.tipo_recordatorio).length || 0;
      const confirmed = data?.filter(a => a.estado === 'confirmada' && a.tipo_recordatorio).length || 0;

      return {
        total_recordatorios: totalWithReminders,
        con_respuesta: confirmed,
      };
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Total Notificaciones</CardTitle>
                <Bell className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-blue-600">
                  {(notificationStats?.total_notificaciones || 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Últimos 7 días
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Total de Notificaciones</p>
            <p className="text-sm">Número total de notificaciones enviadas en los últimos 7 días, incluyendo recordatorios de citas, confirmaciones y otros tipos de mensajes automáticos.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Recordatorios</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-purple-600">
                  {(notificationStats?.recordatorios_dia_siguiente || 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Recordatorios día siguiente
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Recordatorios del Día Siguiente</p>
            <p className="text-sm">Recordatorios automáticos enviados a pacientes el día anterior a su cita programada. Ayudan a reducir las inasistencias y mejorar la puntualidad.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Nuevas Citas</CardTitle>
                <MessageCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-green-600">
                  {(notificationStats?.nuevas_citas || 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Notificaciones de citas nuevas
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Notificaciones de Citas Nuevas</p>
            <p className="text-sm">Notificaciones enviadas cuando se programa una nueva cita. Incluyen detalles de la cita y confirmación de recepción por parte del paciente.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Respuestas a Recordatorios</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-orange-600">
                  {(remindersStats?.con_respuesta || 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  De {remindersStats?.total_recordatorios || 0} recordatorios enviados
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Respuestas a Recordatorios</p>
            <p className="text-sm">Número de pacientes que han respondido a los recordatorios enviados, ya sea confirmando, cancelando o solicitando cambios en sus citas.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};