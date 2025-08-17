import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Alert {
  id: string;
  type: string;
  priority: 'baja' | 'media' | 'alta' | 'critica';
  message: string;
  value?: string;
  action?: string;
  timestamp: string;
  color: string;
}

export const useAlerts = () => {
  const { data: alertsData, isLoading, error, refetch } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: async (): Promise<Alert[]> => {
      try {
        const { data: alertsResult, error } = await supabase
          .rpc('get_alerts' as any);
        
        if (error) throw error;
        
        const alerts = (alertsResult as any)?.alertas || [];
        return alerts.map((alert: any, index: number) => ({
          id: alert.id || `alert-${index}-${Date.now()}`,
          type: alert.tipo || 'info',
          priority: alert.prioridad || 'media',
          message: alert.mensaje || '',
          value: alert.valor || '',
          action: alert.accion || alert.accion_recomendada || '',
          timestamp: alert.timestamp || new Date().toISOString(),
          color: getPriorityColor(alert.prioridad || 'media')
        }));
      } catch (err) {
        console.error('Error fetching alerts:', err);
        return [];
      }
    },
    refetchInterval: 60000 // Refetch every minute
  });

  const alerts = alertsData || [];
  const hasAlerts = alerts.length > 0;
  const criticalCount = alerts.filter(alert => alert.priority === 'critica').length;
  const highPriorityCount = alerts.filter(alert => 
    alert.priority === 'alta' || alert.priority === 'critica'
  ).length;

  const getAlertsByPriority = (priority: Alert['priority']) => {
    return alerts.filter(alert => alert.priority === priority);
  };

  const getActiveAlerts = () => {
    // Return alerts that are still relevant (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return alerts.filter(alert => 
      new Date(alert.timestamp) > oneDayAgo
    );
  };

  return {
    // Data
    alerts,
    
    // Computed states
    hasAlerts,
    criticalCount,
    highPriorityCount,
    
    // Loading states
    loading: isLoading,
    error: error?.message,
    
    // Utility functions
    refetch,
    getAlertsByPriority,
    getActiveAlerts
  };
};

// Helper function to get color based on priority
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critica':
      return '#dc3545'; // Red
    case 'alta':
      return '#ffc107'; // Yellow
    case 'media':
      return '#17a2b8'; // Blue
    case 'baja':
      return '#28a745'; // Green
    default:
      return '#6c757d'; // Gray
  }
}