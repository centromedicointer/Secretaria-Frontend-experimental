
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useSecureN8n } from '@/hooks/useSecureN8n';

interface DataVisualizationProps {
  isConnected: boolean;
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({ isConnected }) => {
  const { getExecutions, getWorkflows } = useSecureN8n();

  const { data: executions } = useQuery({
    queryKey: ['n8n-executions-viz'],
    queryFn: () => getExecutions(),
    enabled: isConnected,
    refetchInterval: 60000,
  });

  const { data: workflows } = useQuery({
    queryKey: ['n8n-workflows-viz'],
    queryFn: getWorkflows,
    enabled: isConnected,
    refetchInterval: 60000,
  });

  if (!isConnected) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ejecuciones por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Conecta con N8n para ver visualizaciones</p>
          </CardContent>
        </Card>
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Actividad de Workflows</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Conecta con N8n para ver visualizaciones</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Procesar datos para el gráfico de ejecuciones por estado
  const executionStats = React.useMemo(() => {
    if (!executions?.data) return [];

    // Exitosas: terminaron correctamente (finished = true)
    const successful = executions.data.filter((e: any) => e.finished === true).length;
    
    // Fallidas: terminaron pero con error (finished = false y tienen stoppedAt)
    const failed = executions.data.filter((e: any) => e.finished === false && e.stoppedAt).length;
    
    // En ejecución: no han terminado y no tienen stoppedAt
    const running = executions.data.filter((e: any) => e.finished === false && !e.stoppedAt).length;

    return [
      { name: 'Exitosas', value: successful, color: '#10b981' },
      { name: 'Fallidas', value: failed, color: '#ef4444' },
      { name: 'En Ejecución', value: running, color: '#3b82f6' },
    ];
  }, [executions]);

  // Procesar datos para el gráfico de actividad de workflows
  const workflowActivity = React.useMemo(() => {
    if (!workflows?.data || !executions?.data) return [];

    // Primero obtener todos los workflows que tienen ejecuciones
    const workflowsWithExecutions = workflows.data
      .map((workflow: any) => {
        const workflowExecutions = executions.data.filter((e: any) => e.workflowId === workflow.id);
        
        // Exitosas: terminaron correctamente
        const successful = workflowExecutions.filter((e: any) => e.finished === true).length;
        
        // Fallidas: terminaron con error
        const failed = workflowExecutions.filter((e: any) => e.finished === false && e.stoppedAt).length;

        return {
          name: workflow.name || `Workflow ${workflow.id}`,
          exitosas: successful,
          fallidas: failed,
          total: successful + failed,
        };
      })
      .filter((workflow: any) => workflow.total > 0) // Solo mostrar workflows con ejecuciones
      .slice(0, 6); // Mostrar hasta 6 workflows

    return workflowsWithExecutions;
  }, [workflows, executions]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ejecuciones por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={executionStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {executionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Ejecuciones por Estado</p>
            <p className="text-sm mb-2">Distribución visual de todas las ejecuciones según su resultado:</p>
            <ul className="text-sm space-y-1">
              <li><span className="text-green-600">●</span> <strong>Exitosas:</strong> Completadas sin errores</li>
              <li><span className="text-red-600">●</span> <strong>Fallidas:</strong> Terminadas con errores</li>
              <li><span className="text-blue-600">●</span> <strong>En Ejecución:</strong> Actualmente procesando</li>
            </ul>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardHeader>
                <CardTitle>Actividad de Workflows ({workflowActivity.length > 0 ? `${workflowActivity.length} activos` : 'Sin actividad'})</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workflowActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="exitosas" fill="#10b981" name="Exitosas" />
                    <Bar dataKey="fallidas" fill="#ef4444" name="Fallidas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold">Actividad de Workflows</p>
            <p className="text-sm mb-2">Compara el rendimiento de cada workflow mostrando:</p>
            <ul className="text-sm space-y-1">
              <li><span className="text-green-600">●</span> <strong>Barras verdes:</strong> Ejecuciones exitosas</li>
              <li><span className="text-red-600">●</span> <strong>Barras rojas:</strong> Ejecuciones fallidas</li>
            </ul>
            <p className="text-sm mt-2">Solo se muestran workflows con actividad reciente. Útil para identificar workflows problemáticos.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
