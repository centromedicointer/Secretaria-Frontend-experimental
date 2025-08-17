import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, XCircle, MessageSquareX, Phone } from 'lucide-react';

interface Alert {
  id: string;
  type: 'urgent' | 'error' | 'timeout' | 'failed';
  title: string;
  message: string;
  timestamp: string;
  patient?: string;
  phone?: string;
  priority: 'high' | 'medium' | 'low';
}

const SmartAlertsPanel = () => {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['smartAlerts'],
    queryFn: async () => {
      const alerts: Alert[] = [];
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 1. Recent errors with high retry count
      const { data: recentErrors } = await supabase
        .from('n8n_errores_whatsapp')
        .select('telefono, nombre_paciente, error_message, fecha_error, intentos, estado')
        .in('estado', ['pendiente', 'fallido'])
        .gte('fecha_error', oneDayAgo.toISOString())
        .order('fecha_error', { ascending: false })
        .limit(20);

      recentErrors?.forEach((error) => {
        const priority = error.intentos >= 3 || error.estado === 'fallido' ? 'high' : 'medium';
        alerts.push({
          id: `error-${error.telefono}-${error.fecha_error}`,
          type: error.estado === 'fallido' ? 'failed' : 'error',
          title: error.estado === 'fallido' ? 'Mensaje No Entregado' : 'Error de Envío',
          message: `${error.estado === 'fallido' ? 'Falló el envío' : 'Error al enviar'} mensaje a ${error.nombre_paciente || error.telefono}. ${error.intentos > 1 ? `Intento ${error.intentos}` : ''}`,
          timestamp: error.fecha_error,
          patient: error.nombre_paciente,
          phone: error.telefono,
          priority
        });
      });

      // 2. Messages without response for too long
      const { data: unansweredMessages } = await supabase
        .from('n8n_mensajes')
        .select('phone_number, nombre, fecha_recibido, pregunta')
        .is('fecha_respuesta', null)
        .lte('fecha_recibido', oneHourAgo.toISOString())
        .gte('fecha_recibido', oneDayAgo.toISOString())
        .order('fecha_recibido', { ascending: true })
        .limit(10);

      unansweredMessages?.forEach((message) => {
        const hoursWaiting = Math.floor((now.getTime() - new Date(message.fecha_recibido).getTime()) / (1000 * 60 * 60));
        if (hoursWaiting >= 2) {
          alerts.push({
            id: `timeout-${message.phone_number}-${message.fecha_recibido}`,
            type: 'timeout',
            title: 'Mensaje Sin Respuesta',
            message: `${message.nombre || 'Usuario'} lleva ${hoursWaiting}h esperando respuesta`,
            timestamp: message.fecha_recibido,
            patient: message.nombre,
            phone: message.phone_number,
            priority: hoursWaiting > 6 ? 'high' : 'medium'
          });
        }
      });

      // 3. Keyword-based urgent detection
      const { data: urgentMessages } = await supabase
        .from('n8n_mensajes')
        .select('phone_number, nombre, fecha_recibido, pregunta')
        .gte('fecha_recibido', oneHourAgo.toISOString())
        .order('fecha_recibido', { ascending: false })
        .limit(50);

      urgentMessages?.forEach((message) => {
        const content = message.pregunta?.toLowerCase() || '';
        const urgentKeywords = ['urgente', 'emergencia', 'dolor fuerte', 'sangrado', 'accidente', 'grave'];
        
        if (urgentKeywords.some(keyword => content.includes(keyword))) {
          alerts.push({
            id: `urgent-${message.phone_number}-${message.fecha_recibido}`,
            type: 'urgent',
            title: 'Posible Caso Urgente',
            message: `${message.nombre || 'Usuario'} menciona palabras que indican urgencia`,
            timestamp: message.fecha_recibido,
            patient: message.nombre,
            phone: message.phone_number,
            priority: 'high'
          });
        }
      });

      // Sort by priority and timestamp
      return alerts
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        })
        .slice(0, 15); // Limit to 15 alerts
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'timeout': return <Clock className="h-4 w-4" />;
      case 'failed': return <MessageSquareX className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: Alert['type'], priority: Alert['priority']) => {
    if (priority === 'high') return 'destructive';
    if (type === 'urgent') return 'destructive';
    if (type === 'error' || type === 'failed') return 'destructive';
    return 'secondary';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const highPriorityCount = alerts?.filter(alert => alert.priority === 'high').length || 0;
  const urgentCount = alerts?.filter(alert => alert.type === 'urgent').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Inteligentes ({alerts?.length || 0})
          </CardTitle>
          <div className="flex gap-2">
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {highPriorityCount} críticas
              </Badge>
            )}
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentCount} urgentes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>¡Todo funcionando correctamente!</p>
              <p className="text-sm">No hay alertas en este momento</p>
            </div>
          ) : (
            alerts?.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 space-y-2 ${
                  alert.priority === 'high' ? 'border-red-200 bg-red-50' : 
                  alert.type === 'urgent' ? 'border-orange-200 bg-orange-50' : 
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <span className="font-medium text-sm">{alert.title}</span>
                    <Badge 
                      variant={getAlertColor(alert.type, alert.priority)} 
                      className="text-xs"
                    >
                      {alert.priority === 'high' ? 'Crítico' : 
                       alert.priority === 'medium' ? 'Medio' : 'Bajo'}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(alert.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground">{alert.message}</p>
                
                {(alert.patient || alert.phone) && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {alert.patient && (
                      <span>Paciente: {alert.patient}</span>
                    )}
                    {alert.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {alert.phone}
                      </span>
                    )}
                  </div>
                )}
                
                {alert.priority === 'high' && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Revisar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7">
                      Marcar como visto
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartAlertsPanel;