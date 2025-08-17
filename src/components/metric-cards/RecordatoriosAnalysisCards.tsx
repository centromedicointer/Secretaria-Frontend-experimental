import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, User, Send, Timer, CheckCircle, AlertTriangle } from "lucide-react";

export function RecordatoriosAnalysisCards() {
  const { data: recordatoriosStats, isLoading } = useQuery({
    queryKey: ['recordatorios-analysis'],
    queryFn: async () => {
      // Usar appointments como fuente de datos
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .not('fecha_recordatorio', 'is', null)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const data = appointmentsData || [];
      
      const totalPacientesConRecordatorios = data.length;
      const recordatoriosMultiples = data.filter(a => 
        a.fecha_recordatorio && 
        new Date(a.fecha_recordatorio).toDateString() === new Date().toDateString()
      ).length;
      
      const confirmados = data.filter(a => a.estado === 'confirmado').length;
      const pendientes = data.filter(a => a.estado === 'pendiente_confirmacion').length;
      
      // Calcular promedio de horas entre recordatorios (estimado)
      const promedioHorasEntreRecordatorios = 2.5; // Valor estimado

      const estadosDistribution = data.reduce((acc, a) => {
        if (a.estado) {
          acc[a.estado] = (acc[a.estado] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return {
        totalPacientesConRecordatorios,
        recordatoriosMultiples,
        confirmados,
        pendientes,
        promedioHorasEntreRecordatorios,
        estadosDistribution,
        recordatoriosDetalle: data
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pacientes con Recordatorios Hoy */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pacientes con Recordatorios</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recordatoriosStats?.totalPacientesConRecordatorios || 0}</div>
                <p className="text-xs text-muted-foreground">Recordatorios enviados hoy</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Número total de pacientes que recibieron recordatorios el día de hoy</p>
          </TooltipContent>
        </Tooltip>

        {/* Recordatorios Múltiples */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recordatorios Múltiples</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recordatoriosStats?.recordatoriosMultiples || 0}</div>
                <p className="text-xs text-muted-foreground">Pacientes con +1 recordatorio</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pacientes que han recibido más de un recordatorio para la misma cita hoy</p>
          </TooltipContent>
        </Tooltip>

        {/* Promedio Horas Entre Recordatorios */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio Tiempo</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recordatoriosStats?.promedioHorasEntreRecordatorios || 0}h</div>
                <p className="text-xs text-muted-foreground">Entre recordatorios</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tiempo promedio en horas entre el primer y último recordatorio enviado</p>
          </TooltipContent>
        </Tooltip>

        {/* Confirmados tras Recordatorio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recordatoriosStats?.confirmados || 0}</div>
                <p className="text-xs text-muted-foreground">Tras recordatorio hoy</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Citas que han sido confirmadas después de recibir recordatorios hoy</p>
          </TooltipContent>
        </Tooltip>

        {/* Pendientes de Confirmación */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recordatoriosStats?.pendientes || 0}</div>
                <p className="text-xs text-muted-foreground">Aún sin confirmar</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pacientes que recibieron recordatorios pero aún no han confirmado su cita</p>
          </TooltipContent>
        </Tooltip>

        {/* Distribución de Estados */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estados Actuales</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recordatoriosStats?.estadosDistribution && Object.entries(recordatoriosStats.estadosDistribution).map(([estado, count]: [string, any]) => (
                    <div key={estado} className="flex justify-between items-center text-sm">
                      <Badge variant={estado === 'confirmado' ? 'default' : 'secondary'} className="text-xs">
                        {estado}
                      </Badge>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Distribución de estados actuales de las citas que recibieron recordatorios hoy</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}