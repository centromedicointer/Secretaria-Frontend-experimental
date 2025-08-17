import React from 'react';
import { Database, Users, MessageCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardSistemaMetrics {
  usuarios_totales: number;
  sesiones_activas: number;
  errores_pendientes: number;
  mensajes_totales: number;
  ultimo_kpi: string;
  mensajes_sin_respuesta: number;
}

export const DashboardSistemaCards: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboardSistema'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_dashboard_sistema' as any)
        .select('*')
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        return {
          usuarios_totales: 0,
          sesiones_activas: 0,
          errores_pendientes: 0,
          mensajes_totales: 0,
          ultimo_kpi: new Date().toISOString(),
          mensajes_sin_respuesta: 0
        } as DashboardSistemaMetrics;
      }
      
      const sistemaData = data as any;
      return {
        usuarios_totales: sistemaData.usuarios_totales || 0,
        sesiones_activas: sistemaData.sesiones_activas || 0,
        errores_pendientes: sistemaData.errores_pendientes || 0,
        mensajes_totales: sistemaData.mensajes_totales || 0,
        ultimo_kpi: sistemaData.ultimo_kpi || new Date().toISOString(),
        mensajes_sin_respuesta: sistemaData.mensajes_sin_respuesta || 0
      } as DashboardSistemaMetrics;
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
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">0</div>
            <p className="text-sm text-muted-foreground text-center">
              No hay métricas del sistema
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
                <CardTitle className="text-base font-medium text-center flex-1">Usuarios Totales</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-blue-600">
                  {metrics.usuarios_totales.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Usuarios registrados
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Usuarios Totales del Sistema</p>
            <p className="text-sm">Número total de usuarios únicos registrados en el sistema. Incluye todos los usuarios que han interactuado con la plataforma.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Sesiones Activas</CardTitle>
                <MessageCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-green-600">
                  {metrics.sesiones_activas.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Conversaciones activas
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Sesiones de Chat Activas</p>
            <p className="text-sm">Conversaciones que están actualmente en progreso. Una sesión está activa si ha habido intercambio de mensajes recientemente.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Errores Pendientes</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-red-600">
                  {metrics.errores_pendientes.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Errores sin resolver
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Errores Pendientes de Resolución</p>
            <p className="text-sm">Errores del sistema que aún no han sido resueltos. Incluye errores de envío de mensajes, fallos de conectividad y otros problemas técnicos que requieren atención.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Mensajes Totales</CardTitle>
                <Database className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-purple-600">
                  {metrics.mensajes_totales.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Total procesados
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Mensajes Totales Procesados</p>
            <p className="text-sm">Número total de mensajes procesados por el sistema, incluyendo mensajes entrantes y salientes en todas las conversaciones.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Sin Respuesta</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-orange-600">
                  {metrics.mensajes_sin_respuesta.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Mensajes pendientes
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Mensajes Sin Respuesta</p>
            <p className="text-sm">Mensajes de usuarios que aún no han recibido respuesta del sistema. Es importante mantener este número bajo para asegurar una buena experiencia de usuario.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-center flex-1">Último KPI</CardTitle>
                <Database className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center text-gray-600">
                  {new Date(metrics.ultimo_kpi).toLocaleDateString()}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Actualización KPI
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Última Actualización de KPIs</p>
            <p className="text-sm">Fecha de la última actualización de los indicadores clave de rendimiento (KPIs) del sistema. Los KPIs se actualizan automáticamente de forma regular.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};