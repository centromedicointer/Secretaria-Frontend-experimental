
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
  getLatestEvolutionMetrics,
  getLatestKpiHistorico,
  getMensajesStats,
  getClientControlStats,
  getWorkflowStatus,
  updateWorkflowStatus
} from '@/lib/database';
import { 
  BarChart3,
  Shield,
  ShieldOff
} from 'lucide-react';
import { WeeklyMessagesChart } from './WeeklyMessagesChart';
import { TextVsAudioChart } from './TextVsAudioChart';
import { ClientControlModal } from './ClientControlModal';
import { ActiveClientControlModal } from './ActiveClientControlModal';
import { ClientControlHoverCard } from './ClientControlHoverCard';
import { WorkflowControlCard } from './metric-cards/WorkflowControlCard';
import { MessageStatsCards } from './metric-cards/MessageStatsCards';
import { MultimediaStatsCards } from './metric-cards/MultimediaStatsCards';
import { CallStatsCards } from './metric-cards/CallStatsCards';
import { KpiStatsCards } from './metric-cards/KpiStatsCards';
import { MessageDeliveryStatsCards } from './metric-cards/MessageDeliveryStatsCards';
import { ApiStatusCards } from './metric-cards/ApiStatusCards';
import { useToast } from '@/hooks/use-toast';

export const EvolutionMetrics = () => {
  const [isClientControlModalOpen, setIsClientControlModalOpen] = useState(false);
  const [isActiveClientControlModalOpen, setIsActiveClientControlModalOpen] = useState(false);
  const { toast } = useToast();

  // Obtener datos absolutos de evolution_metricas
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['evolution-metrics'],
    queryFn: getLatestEvolutionMetrics,
    refetchInterval: 30000
  });

  // Obtener el último registro de kpi_historico
  const { data: latestKpi } = useQuery({
    queryKey: ['latest-kpi'],
    queryFn: getLatestKpiHistorico,
    refetchInterval: 30000
  });

  // Obtener estadísticas de mensajes
  const { data: mensajesStats } = useQuery({
    queryKey: ['mensajes-stats'],
    queryFn: getMensajesStats,
    refetchInterval: 30000
  });

  // Obtener datos de control de clientes (bot_active = false)
  const { data: clientControlStats } = useQuery({
    queryKey: ['client-control-stats'],
    queryFn: () => getClientControlStats(false),
    refetchInterval: 30000
  });

  // Obtener datos de control de clientes (bot_active = true)
  const { data: activeClientControlStats } = useQuery({
    queryKey: ['active-client-control-stats'],
    queryFn: () => getClientControlStats(true),
    refetchInterval: 30000
  });

  // Obtener estado del workflow
  const { data: workflowStatus, refetch: refetchWorkflowStatus } = useQuery({
    queryKey: ['workflow-status'],
    queryFn: getWorkflowStatus,
    refetchInterval: 30000
  });

  // Calcular el porcentaje de llamadas exitosas
  const llamadasExitosasPorcentaje = metrics?.total_llamadas
    ? ((metrics.llamadas_exitosas || 0) / metrics.total_llamadas) * 100
    : 0;

  // Calcular el ratio de imágenes (enviadas / recibidas)
  const ratioImagenes = metrics?.imagenes_recibidas
    ? (metrics.imagenes_enviadas || 0) / metrics.imagenes_recibidas
    : metrics?.imagenes_enviadas ? Infinity : 0;

  const handleWorkflowToggle = async () => {
    try {
      if (!workflowStatus) {
        toast({
          title: "Error",
          description: "No se encontró información del workflow.",
          variant: "destructive",
        });
        return;
      }

      console.log('Toggling workflow status...');
      
      // Alternar el estado is_active
      const newStatus = !workflowStatus.is_active;
      
      await updateWorkflowStatus(workflowStatus.id, newStatus, 'Web Aplicacion');

      // Refrescar los datos
      await refetchWorkflowStatus();

      toast({
        title: "Estado Actualizado",
        description: `Workflow ${newStatus ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Error al cambiar el estado del workflow.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-8">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay datos disponibles</h3>
            <p className="text-sm">Las métricas aparecerán aquí cuando haya datos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de control y workflow al inicio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pacientes con bot desactivado - Now with hover effect */}
        {clientControlStats && (
          <ClientControlHoverCard
            botActive={false}
            onClick={() => setIsClientControlModalOpen(true)}
            title="Pacientes con bot desactivado"
            icon={<ShieldOff className="h-4 w-4 text-orange-600" />}
            bgColor=""
            textColor="text-orange-600"
          />
        )}

        {/* Pacientes con bot activado - Now with hover effect */}
        {activeClientControlStats && (
          <ClientControlHoverCard
            botActive={true}
            onClick={() => setIsActiveClientControlModalOpen(true)}
            title="Pacientes con bot activado"
            icon={<Shield className="h-4 w-4 text-green-600" />}
            bgColor=""
            textColor="text-green-600"
          />
        )}

        {/* Estado del Workflow */}
        {workflowStatus && (
          <WorkflowControlCard
            workflowStatus={workflowStatus}
            onToggle={handleWorkflowToggle}
          />
        )}
      </div>

      {/* KPIs principales de Evolution API */}
      <MessageStatsCards metrics={metrics} latestKpi={latestKpi} />

      {/* Métricas multimedia */}
      <MultimediaStatsCards metrics={metrics} />

      {/* Métricas de mensajes de la tabla mensajes */}
      {mensajesStats && (
        <MessageDeliveryStatsCards mensajesStats={mensajesStats} />
      )}

      {/* Métricas de control de clientes (bot_active = false) */}
      {clientControlStats && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <ClientControlHoverCard
            botActive={false}
            onClick={() => setIsClientControlModalOpen(true)}
            title="Pacientes con bot desactivado"
            icon={<ShieldOff className="h-4 w-4 text-orange-600" />}
            bgColor=""
            textColor="text-orange-600"
          />
        </div>
      )}

      {/* Métricas de llamadas */}
      <CallStatsCards 
        metrics={metrics} 
        llamadasExitosasPorcentaje={llamadasExitosasPorcentaje} 
      />

      {/* Métricas adicionales de KPI histórico */}
      <KpiStatsCards latestKpi={latestKpi} />

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyMessagesChart />
        <TextVsAudioChart />
      </div>

      {/* Estado de la API y otras métricas */}
      <ApiStatusCards ratioImagenes={ratioImagenes} />

      {/* Modal de control de clientes */}
      <ClientControlModal
        isOpen={isClientControlModalOpen}
        onClose={() => setIsClientControlModalOpen(false)}
      />

      <ActiveClientControlModal
        isOpen={isActiveClientControlModalOpen}
        onClose={() => setIsActiveClientControlModalOpen(false)}
      />
    </div>
  );
};
