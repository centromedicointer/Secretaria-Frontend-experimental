
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { useSecureN8n } from '@/hooks/useSecureN8n';

interface WorkflowStatsProps {
  isConnected: boolean;
}

export const WorkflowStats: React.FC<WorkflowStatsProps> = ({ isConnected }) => {
  const { getWorkflows, getExecutions } = useSecureN8n();

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['n8n-workflows'],
    queryFn: getWorkflows,
    enabled: isConnected,
    refetchInterval: 30000,
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['n8n-executions'],
    queryFn: () => getExecutions(),
    enabled: isConnected,
    refetchInterval: 30000,
  });

  if (!isConnected) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No conectado</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Conecta con N8n para ver estadísticas
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (workflowsLoading || executionsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalWorkflows = workflows?.data?.length || 0;
  const activeWorkflows = workflows?.data?.filter((w: any) => w.active)?.length || 0;
  
  const totalExecutions = executions?.data?.length || 0;
  const successfulExecutions = executions?.data?.filter((e: any) => e.finished && !e.stoppedAt)?.length || 0;
  const failedExecutions = executions?.data?.filter((e: any) => e.stoppedAt)?.length || 0;
  const runningExecutions = executions?.data?.filter((e: any) => !e.finished && !e.stoppedAt)?.length || 0;

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workflows Totales</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkflows}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {activeWorkflows} activos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Workflows Totales</p>
            <p className="text-sm">Número total de workflows configurados en N8n. Los workflows activos están habilitados para ejecutarse automáticamente, mientras que los inactivos requieren ejecución manual.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ejecuciones Exitosas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{successfulExecutions}</div>
                <p className="text-xs text-muted-foreground">
                  {totalExecutions > 0 ? `${((successfulExecutions / totalExecutions) * 100).toFixed(1)}%` : '0%'} del total
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Ejecuciones Exitosas</p>
            <p className="text-sm">Workflows que se ejecutaron completamente sin errores. Una alta tasa de éxito indica que tus automatizaciones están funcionando correctamente.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ejecuciones Fallidas</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{failedExecutions}</div>
                <p className="text-xs text-muted-foreground">
                  {totalExecutions > 0 ? `${((failedExecutions / totalExecutions) * 100).toFixed(1)}%` : '0%'} del total
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Ejecuciones Fallidas</p>
            <p className="text-sm">Workflows que terminaron con errores. Pueden ser causadas por problemas de conectividad, datos incorrectos, o configuración errónea. Revisa los logs para identificar la causa.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Ejecución</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{runningExecutions}</div>
                <p className="text-xs text-muted-foreground">
                  Workflows ejecutándose ahora
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Ejecuciones en Progreso</p>
            <p className="text-sm">Workflows que están ejecutándose actualmente. Incluye tanto ejecuciones manuales como automáticas que aún no han terminado.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
