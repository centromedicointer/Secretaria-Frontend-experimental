import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock, Play, Activity } from 'lucide-react';
import { useSecureN8n } from '@/hooks/useSecureN8n';
import { formatTimeInMexicoTime } from '@/lib/dateUtils';

interface ExecutionHistoryProps {
  isConnected: boolean;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ isConnected }) => {
  const { getExecutions, getWorkflows } = useSecureN8n();

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['n8n-execution-history'],
    queryFn: () => getExecutions(),
    enabled: isConnected,
    refetchInterval: 30000,
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['n8n-workflows-for-executions'],
    queryFn: () => getWorkflows(),
    enabled: isConnected,
    refetchInterval: 60000, // Menos frecuente ya que los workflows cambian menos
  });

  const isLoading = executionsLoading || workflowsLoading;

  // Función para obtener el nombre del workflow por su ID
  const getWorkflowName = (workflowId: string) => {
    const workflow = workflows?.data?.find((w: any) => w.id === workflowId);
    return workflow?.name || `Workflow ${workflowId}`;
  };

  const getStatusBadge = (execution: any) => {
    if (execution.finished && !execution.stoppedAt) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Exitoso
        </Badge>
      );
    } else if (execution.stoppedAt) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    } else if (!execution.finished) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <Play className="h-3 w-3 mr-1" />
          Ejecutando
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Esperando
        </Badge>
      );
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = (end.getTime() - start.getTime()) / 1000;
    return duration.toFixed(1);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Historial de Ejecuciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Conecta con N8n para ver el historial de ejecuciones</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {executions?.data?.slice(0, 10).map((execution: any) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">
                        {getWorkflowName(execution.workflowId)}
                      </h4>
                      {getStatusBadge(execution)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Inicio (México): {formatTimeInMexicoTime(execution.startedAt)}</span>
                      {(execution.finished || execution.stoppedAt) && (
                        <span>
                          Duración: {calculateDuration(execution.startedAt, execution.finishedAt || execution.stoppedAt)}s
                        </span>
                      )}
                      {execution.stoppedAt && execution.data?.resultData?.error && (
                        <span className="text-red-600">
                          Error: {execution.data.resultData.error.message || 'Error desconocido'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!executions?.data || executions.data.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay ejecuciones disponibles</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
