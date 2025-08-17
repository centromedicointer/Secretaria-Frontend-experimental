import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Clock, FileText, Users, Calendar, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

export function TimelineMetricsCards() {
  const { data: timelineData } = useQuery({
    queryKey: ['timeline-raw-data'],
    queryFn: async () => {
      const response = await fetch('/api/supabase-read-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            SELECT 
              evento_tipo,
              usuario_origen,
              fecha_evento,
              google_event_id,
              created_at
            FROM appointment_timeline 
            WHERE fecha_evento >= NOW() - INTERVAL '7 days'
          `
        })
      });
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Use appointments table as fallback data
  const { data: appointmentsStats, isLoading } = useQuery({
    queryKey: ['appointments-timeline-stats'],
    queryFn: async () => {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const totalEventos = appointments?.length || 0;
      const citasCreadas = appointments?.filter(item => item.created_at).length || 0;
      const citasConfirmadas = appointments?.filter(item => item.estado === 'confirmado').length || 0;
      const recordatoriosEnviados = appointments?.filter(item => item.fecha_recordatorio).length || 0;
      const citasCanceladas = appointments?.filter(item => item.estado === 'cancelado').length || 0;
      const citasModificadas = appointments?.filter(item => item.updated_at !== item.created_at).length || 0;
      const notificacionesEnviadas = appointments?.filter(item => item.tipo_recordatorio).length || 0;
      const citasReagendadas = appointments?.filter(item => item.estado === 'reagendado').length || 0;

      // Calcular eventos de hoy
      const hoy = new Date().toDateString();
      const eventosHoy = appointments?.filter(item => 
        new Date(item.created_at).toDateString() === hoy
      ).length || 0;

      // Eventos únicos por cita
      const citasUnicas = new Set(appointments?.map(item => item.google_event_id)).size;

      return {
        totalEventos,
        citasCreadas,
        citasConfirmadas,
        recordatoriosEnviados,
        citasCanceladas,
        citasModificadas,
        notificacionesEnviadas,
        citasReagendadas,
        eventosHoy,
        citasUnicas
      };
    },
    refetchInterval: 30000,
  });

  const timelineStats = appointmentsStats;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Eventos */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineStats?.totalEventos || 0}</div>
                <p className="text-xs text-muted-foreground">Últimos 7 días</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total de eventos registrados en el timeline de citas en los últimos 7 días</p>
          </TooltipContent>
        </Tooltip>

        {/* Citas Creadas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Creadas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineStats?.citasCreadas || 0}</div>
                <p className="text-xs text-muted-foreground">Nuevas citas registradas</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Número de citas que han sido creadas en el sistema</p>
          </TooltipContent>
        </Tooltip>

        {/* Citas Confirmadas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineStats?.citasConfirmadas || 0}</div>
                <p className="text-xs text-muted-foreground">Confirmaciones recibidas</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Citas que han sido confirmadas por los pacientes</p>
          </TooltipContent>
        </Tooltip>

        {/* Recordatorios Enviados */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recordatorios</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineStats?.recordatoriosEnviados || 0}</div>
                <p className="text-xs text-muted-foreground">Enviados a pacientes</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recordatorios automáticos enviados a pacientes sobre sus citas</p>
          </TooltipContent>
        </Tooltip>

        {/* Eventos Hoy */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventos Hoy</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineStats?.eventosHoy || 0}</div>
                <p className="text-xs text-muted-foreground">Actividad del día</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Número de eventos registrados en el timeline el día de hoy</p>
          </TooltipContent>
        </Tooltip>

        {/* Notificaciones Enviadas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineStats?.notificacionesEnviadas || 0}</div>
                <p className="text-xs text-muted-foreground">Enviadas por sistema</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notificaciones automáticas enviadas por el sistema</p>
          </TooltipContent>
        </Tooltip>

        {/* Citas Reagendadas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reagendadas</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineStats?.citasReagendadas || 0}</div>
                <p className="text-xs text-muted-foreground">Cambios de fecha/hora</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Citas que han sido reagendadas a nueva fecha u hora</p>
          </TooltipContent>
        </Tooltip>

        {/* Citas Únicas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Únicas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineStats?.citasUnicas || 0}</div>
                <p className="text-xs text-muted-foreground">Con actividad registrada</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Número de citas únicas que tienen actividad registrada en el timeline</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}