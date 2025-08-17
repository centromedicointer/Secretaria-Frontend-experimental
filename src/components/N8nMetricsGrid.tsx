
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  TrendingUp,
  Timer,
  Database,
  AlertTriangle
} from 'lucide-react';
import { useSecureN8n } from '@/hooks/useSecureN8n';

interface N8nMetricsGridProps {
  isConnected: boolean;
}

export const N8nMetricsGrid: React.FC<N8nMetricsGridProps> = ({ isConnected }) => {
  const { getWorkflows, getExecutions } = useSecureN8n();

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['n8n-workflows-metrics'],
    queryFn: getWorkflows,
    enabled: isConnected,
    refetchInterval: 30000,
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['n8n-executions-metrics'],
    queryFn: () => getExecutions(),
    enabled: isConnected,
    refetchInterval: 30000,
  });

  if (!isConnected) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <Card key={i} className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No conectado</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Conecta con N8n
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (workflowsLoading || executionsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
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

  // Calcular métricas avanzadas
  const totalWorkflows = workflows?.data?.length || 0;
  const activeWorkflows = workflows?.data?.filter((w: any) => w.active)?.length || 0;
  const inactiveWorkflows = totalWorkflows - activeWorkflows;
  
  const allExecutions = executions?.data || [];
  const totalExecutions = allExecutions.length;
  const successfulExecutions = allExecutions.filter((e: any) => e.finished && !e.stoppedAt).length;
  const failedExecutions = allExecutions.filter((e: any) => e.stoppedAt).length;
  const runningExecutions = allExecutions.filter((e: any) => !e.finished && !e.stoppedAt).length;
  
  // Métricas de tiempo
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentExecutions = allExecutions.filter((e: any) => new Date(e.startedAt) > last24Hours);
  const executionsLast24h = recentExecutions.length;
  
  // Duración promedio de ejecuciones exitosas
  const successfulWithDuration = allExecutions.filter((e: any) => 
    e.finished && !e.stoppedAt && e.finishedAt
  );
  const avgExecutionTime = successfulWithDuration.length > 0 
    ? successfulWithDuration.reduce((acc: number, e: any) => {
        const duration = new Date(e.finishedAt).getTime() - new Date(e.startedAt).getTime();
        return acc + duration;
      }, 0) / successfulWithDuration.length / 1000 // en segundos
    : 0;

  // Tasa de éxito
  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100) : 0;
  
  // Workflows más utilizados
  const workflowUsage = workflows?.data?.map((w: any) => {
    const workflowExecutions = allExecutions.filter((e: any) => e.workflowId === w.id);
    return {
      ...w,
      executionCount: workflowExecutions.length,
      lastExecution: workflowExecutions.length > 0 
        ? new Date(Math.max(...workflowExecutions.map((e: any) => new Date(e.startedAt).getTime())))
        : null
    };
  }).sort((a: any, b: any) => b.executionCount - a.executionCount) || [];

  const mostUsedWorkflow = workflowUsage[0];
  
  // Workflows inactivos (sin ejecuciones recientes)
  const inactiveWorkflowsCount = workflowUsage.filter((w: any) => 
    !w.lastExecution || new Date(w.lastExecution) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Workflows Totales */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workflows</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkflows}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    {activeWorkflows} activos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Workflows Totales</p>
            <p className="text-sm">Número total de workflows en tu instancia N8n. Los activos se ejecutan automáticamente según sus triggers.</p>
          </TooltipContent>
        </Tooltip>

        {/* Workflows Inactivos */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
                <Database className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{inactiveWorkflows}</div>
                <p className="text-xs text-muted-foreground">
                  Workflows deshabilitados
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Workflows Inactivos</p>
            <p className="text-sm">Workflows que están deshabilitados y no se ejecutarán automáticamente. Solo pueden ejecutarse manualmente.</p>
          </TooltipContent>
        </Tooltip>

        {/* Ejecuciones Exitosas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exitosas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{successfulExecutions}</div>
                <p className="text-xs text-muted-foreground">
                  {successRate.toFixed(1)}% tasa de éxito
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Ejecuciones Exitosas</p>
            <p className="text-sm">Workflows que completaron su ejecución sin errores. Una alta tasa indica un sistema estable y bien configurado.</p>
          </TooltipContent>
        </Tooltip>

        {/* Ejecuciones Fallidas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{failedExecutions}</div>
                <p className="text-xs text-muted-foreground">
                  {totalExecutions > 0 ? ((failedExecutions / totalExecutions) * 100).toFixed(1) : 0}% del total
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Ejecuciones Fallidas</p>
            <p className="text-sm">Workflows que terminaron con errores. Revisa los logs para identificar problemas de conectividad, autenticación o configuración.</p>
          </TooltipContent>
        </Tooltip>

        {/* En Ejecución */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ejecutándose</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{runningExecutions}</div>
                <p className="text-xs text-muted-foreground">
                  Workflows activos ahora
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Ejecuciones en Progreso</p>
            <p className="text-sm">Workflows que están ejecutándose actualmente. Incluye tanto ejecuciones programadas como manuales en progreso.</p>
          </TooltipContent>
        </Tooltip>

        {/* Ejecuciones 24h */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{executionsLast24h}</div>
                <p className="text-xs text-muted-foreground">
                  Ejecuciones recientes
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Actividad Reciente (24h)</p>
            <p className="text-sm">Número de ejecuciones en las últimas 24 horas. Útil para monitorear la actividad actual del sistema.</p>
          </TooltipContent>
        </Tooltip>

        {/* Tiempo Promedio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                <Timer className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {avgExecutionTime.toFixed(1)}s
                </div>
                <p className="text-xs text-muted-foreground">
                  Duración de ejecución
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Tiempo Promedio de Ejecución</p>
            <p className="text-sm">Duración promedio de ejecuciones exitosas. Ayuda a identificar workflows lentos y optimizar el rendimiento.</p>
          </TooltipContent>
        </Tooltip>

        {/* Workflow Más Usado */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Más Usado</CardTitle>
                <Activity className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-yellow-600 truncate">
                  {mostUsedWorkflow?.name || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mostUsedWorkflow?.executionCount || 0} ejecuciones
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Workflow Más Utilizado</p>
            <p className="text-sm">El workflow con mayor número de ejecuciones. Indica cuáles son tus automatizaciones más importantes.</p>
          </TooltipContent>
        </Tooltip>

        {/* Workflows Sin Uso */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sin Uso (7d)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{inactiveWorkflowsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Workflows inactivos
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Workflows Sin Uso (7 días)</p>
            <p className="text-sm">Workflows que no se han ejecutado en los últimos 7 días. Considera revisarlos o desactivarlos si ya no son necesarios.</p>
          </TooltipContent>
        </Tooltip>

        {/* Total de Ejecuciones */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="md:col-span-2 lg:col-span-1 hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ejecuciones</CardTitle>
                <Database className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-600">{totalExecutions}</div>
                <p className="text-xs text-muted-foreground">
                  Todas las ejecuciones
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Total de Ejecuciones</p>
            <p className="text-sm">Número total de todas las ejecuciones registradas, incluyendo exitosas, fallidas y en progreso.</p>
          </TooltipContent>
        </Tooltip>

        {/* Tasa de Éxito */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="md:col-span-2 lg:col-span-1 hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Ejecuciones exitosas
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Tasa de Éxito General</p>
            <p className="text-sm">Porcentaje de ejecuciones exitosas sobre el total. Una tasa alta (&gt;90%) indica un sistema saludable y bien configurado.</p>
          </TooltipContent>
        </Tooltip>

        {/* Estado General */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="md:col-span-2 hover:shadow-md transition-shadow cursor-help">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{activeWorkflows}</div>
                    <div className="text-xs text-muted-foreground">Activos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{runningExecutions}</div>
                    <div className="text-xs text-muted-foreground">Ejecutando</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{executionsLast24h}</div>
                    <div className="text-xs text-muted-foreground">24h</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Resumen del Estado</p>
            <p className="text-sm">Vista consolidada del estado actual: workflows activos, ejecuciones en progreso y actividad reciente de 24 horas.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
