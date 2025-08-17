
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardProtectedRoute from '@/components/DashboardProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowControlCard } from '@/components/metric-cards/WorkflowControlCard';

import { ClientControlHoverCard } from '@/components/ClientControlHoverCard';
import { Shield, ShieldOff, UserX, MessageSquare, TrendingUp, Clock, Users, Calendar } from 'lucide-react';
import { ClientControlModal } from '@/components/ClientControlModal';
import { ActiveClientControlModal } from '@/components/ActiveClientControlModal';
import { useToast } from '@/hooks/use-toast';
import { GoogleCalendarWidget } from '@/components/GoogleCalendarWidget';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { N8nMessagesModal } from '@/components/N8nMessagesModal';
import { formatDateTimeInMexicoTime } from '@/lib/dateUtils';
import { TodayMessagesModal } from '@/components/TodayMessagesModal';
import { UniqueUsersModal } from '@/components/UniqueUsersModal';
import { AppointmentRequestsModal } from '@/components/AppointmentRequestsModal';
import { ConfirmationMetricsCards } from '@/components/metric-cards/ConfirmationMetricsCards';
import { NotificationMetricsCards } from '@/components/metric-cards/NotificationMetricsCards';
import { DashboardSecretariaCards } from '@/components/metric-cards/DashboardSecretariaCards';
import { DashboardSistemaCards } from '@/components/metric-cards/DashboardSistemaCards';
import { MetricasResumenCards } from '@/components/metric-cards/MetricasResumenCards';
import { ClasificadorMetricsCards } from '@/components/metric-cards/ClasificadorMetricsCards';
import { TimelineMetricsCards } from '@/components/metric-cards/TimelineMetricsCards';
import { RecordatoriosAnalysisCards } from '@/components/metric-cards/RecordatoriosAnalysisCards';


const EvolutionDashboardSimple = () => {
  const navigate = useNavigate();

  // Helper function to format response time
  const formatResponseTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };
const [isClientControlModalOpen, setIsClientControlModalOpen] = useState(false);
const [isActiveClientControlModalOpen, setIsActiveClientControlModalOpen] = useState(false);
const [isN8nMessagesModalOpen, setIsN8nMessagesModalOpen] = useState(false);
const [isTodayMessagesModalOpen, setIsTodayMessagesModalOpen] = useState(false);
const [isUniqueUsersModalOpen, setIsUniqueUsersModalOpen] = useState(false);
const [isAppointmentRequestsModalOpen, setIsAppointmentRequestsModalOpen] = useState(false);
const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

const { toast } = useToast();

  // Obtener datos absolutos de evolution_metricas
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['evolution-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evolution_metricas')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Obtener el último registro de kpi_historico
  const { data: latestKpi } = useQuery({
    queryKey: ['latest-kpi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_historico')
        .select('*')
        .order('fecha_kpi', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Preview de últimos mensajes para hover en tarjeta Mensajes
  const { data: previewMessages, isLoading: previewLoading } = useQuery({
    queryKey: ['n8n-messages-preview-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_mensajes')
        .select('id, nombre, phone_number, pregunta, fecha_recibido')
        .order('fecha_recibido', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data || []).map((msg: any) => ({ ...msg, id: msg.id.toString() }));
    },
    refetchInterval: 30000,
  });

  // Obtener datos de control de clientes (bot_active = false)
  const { data: clientControlStats } = useQuery({
    queryKey: ['client-control-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_control')
        .select('*')
        .eq('bot_active', false);

      if (error) throw error;
      
      const totalBotInactive = data?.length || 0;
      const withHumanAgent = data?.filter(c => c.human_agent && c.human_agent.trim() !== '').length || 0;
      const withoutHumanAgent = totalBotInactive - withHumanAgent;

      return {
        totalBotInactive,
        withHumanAgent,
        withoutHumanAgent
      };
    },
    refetchInterval: 30000
  });

  // Obtener datos de control de clientes (bot_active = true)
  const { data: activeClientControlStats } = useQuery({
    queryKey: ['active-client-control-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_control')
        .select('*')
        .eq('bot_active', true);

      if (error) throw error;
      
      const totalBotActive = data?.length || 0;
      const withHumanAgent = data?.filter(c => c.human_agent && c.human_agent.trim() !== '').length || 0;
      const withoutHumanAgent = totalBotActive - withHumanAgent;

      return {
        totalBotActive,
        withHumanAgent,
        withoutHumanAgent
      };
    },
    refetchInterval: 30000
  });

  // Obtener estado del workflow
  const { data: workflowStatus, refetch: refetchWorkflowStatus } = useQuery({
    queryKey: ['workflow-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_control')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Obtener datos del dashboard secretaria
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-secretaria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_dashboard_secretaria')
        .select('*')
        .limit(7);

      if (error) throw error;
      return data;
    },
    refetchInterval: 300000 // 5 minutos
  });

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
      
      const newStatus = !workflowStatus.is_active;
      
      const { error } = await supabase
        .from('workflow_control')
        .update({
          is_active: newStatus,
          updated_by: 'Web Aplicacion',
          last_updated: new Date().toISOString()
        })
        .eq('id', workflowStatus.id);

      if (error) {
        console.error('Error updating workflow status:', error);
        toast({
          title: "Error",
          description: "Error al actualizar el estado del workflow.",
          variant: "destructive",
        });
        return;
      }

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
        {[1, 2].map((i) => (
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
    <DashboardProtectedRoute 
      requiredDashboard="secretaria" 
      dashboardName="Secretaria Simple"
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Hub
                </Button>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/7364/7364323.png" 
                    alt="Secretaria Icon" 
                    className="h-8 w-8"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Secretaria Simple</h1>
                  <p className="text-gray-600">Vista simplificada de métricas principales</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Primera fila: Estado de control y workflow */}
            <div className="grid grid-cols-5 gap-1">
              {/* Pacientes con bot desactivado */}
              {clientControlStats && (
                <ClientControlHoverCard
                  botActive={false}
                  onClick={() => setIsClientControlModalOpen(true)}
                  title="Pacientes con bot desactivado"
                  icon={<ShieldOff className="h-3 w-3 text-orange-600" />}
                  bgColor=""
                  textColor="text-orange-600"
                />
              )}

              {/* Pacientes con bot activado */}
              {activeClientControlStats && (
                <ClientControlHoverCard
                  botActive={true}
                  onClick={() => setIsActiveClientControlModalOpen(true)}
                  title="Pacientes con bot activado"
                  icon={<Shield className="h-3 w-3 text-green-600" />}
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

              {/* Opt-out */}
              <Card className="h-16 hover:shadow-lg hover:scale-105 transition-all duration-200 transform cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1 pb-0">
                  <CardTitle className="text-xs font-medium text-center flex-1">Opt-out</CardTitle>
                  <UserX className="h-3 w-3 text-red-600" />
                </CardHeader>
                <CardContent className="p-1 pt-0">
                  <div className="text-base font-bold text-center text-red-600">
                    {Number(metrics?.usuarios_optout || 0).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center truncate">
                    Usuarios dados de baja
                  </p>
                </CardContent>
              </Card>

              {/* Mensajes recibidos/enviados */}
              <HoverCard openDelay={150} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsN8nMessagesModalOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsN8nMessagesModalOpen(true);
                      }
                    }}
                    className="outline-none"
                  >
                    <Card className="h-16 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 transform">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1 pb-0">
                        <CardTitle className="text-xs font-medium text-center flex-1">Mensajes</CardTitle>
                        <MessageSquare className="h-3 w-3 text-blue-600" />
                      </CardHeader>
                      <CardContent className="p-1 pt-0">
                        <div className="text-base font-bold text-center text-blue-600">
                          {`${Number(metrics?.mensajes_recibidos || 0).toLocaleString()}/${Number(metrics?.mensajes_enviados || 0).toLocaleString()}`}
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center truncate">
                          recibidos/enviados
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-96">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Últimos mensajes</div>
                    {previewLoading ? (
                      <div className="text-sm text-muted-foreground">Cargando...</div>
                    ) : previewMessages && previewMessages.length > 0 ? (
                      <ul className="space-y-2">
                        {previewMessages.slice(0, 5).map((m: any) => (
                          <li key={m.id} className="text-sm">
                            <div className="flex items-start justify-between gap-2">
                              <span className="line-clamp-2">{m.pregunta}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {m.fecha_recibido ? formatDateTimeInMexicoTime(m.fecha_recibido) : ''}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(m.nombre || 'Usuario')} · {m.phone_number}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">No hay mensajes disponibles</div>
                    )}
                    <div className="text-xs text-muted-foreground">Haz clic para ver más detalles</div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>


            {/* Calendario - Google Calendar */}
            <Card>
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold">Calendario de Google</h2>
                  <p className="text-sm text-muted-foreground">Agenda compartida</p>
                </div>
                <div className="p-6">
                  <GoogleCalendarWidget
                    calendarId="b85b44b029722927f9d30cc094a208c641ab35d1447e7a09115b0d39c2209033@group.calendar.google.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Secretaria - Métricas Diarias */}
            {dashboardData && dashboardData.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold">Métricas Diarias</h2>
                    <p className="text-sm text-muted-foreground">Estadísticas de mensajes y respuestas (últimos 7 días)</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {/* Resumen del día más reciente */}
                      {dashboardData[0] && (
                        <>
                          <Card 
                            className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
                            onClick={() => {
                              setSelectedDate(dashboardData[0].fecha);
                              setIsTodayMessagesModalOpen(true);
                            }}
                          >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Mensajes Hoy</CardTitle>
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-blue-700">
                                {dashboardData[0].total_mensajes?.toLocaleString() || '0'}
                              </div>
                              <p className="text-xs text-blue-600">
                                {dashboardData[0].fecha ? new Date(dashboardData[0].fecha).toLocaleDateString('es-MX') : 'Hoy'}
                              </p>
                            </CardContent>
                          </Card>

                          <Card 
                            className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
                            onClick={() => {
                              setSelectedDate(dashboardData[0].fecha);
                              setIsUniqueUsersModalOpen(true);
                            }}
                          >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
                              <Users className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-green-700">
                                {dashboardData[0].usuarios_unicos?.toLocaleString() || '0'}
                              </div>
                              <p className="text-xs text-green-600">
                                Usuarios diferentes
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg hover:scale-105 transition-all duration-200 transform cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
                              <Clock className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-amber-700">
                                {formatResponseTime(dashboardData[0].tiempo_respuesta_seg)}
                              </div>
                              <p className="text-xs text-amber-600">
                                Promedio
                              </p>
                            </CardContent>
                          </Card>

                          <Card 
                            className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
                            onClick={() => {
                              setSelectedDate(dashboardData[0].fecha);
                              setIsAppointmentRequestsModalOpen(true);
                            }}
                          >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Solicitudes Cita</CardTitle>
                              <Calendar className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-purple-700">
                                {dashboardData[0].solicitudes_cita?.toLocaleString() || '0'}
                              </div>
                              <p className="text-xs text-purple-600">
                                Citas solicitadas
                              </p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Tabla con historial de días */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Fecha</th>
                            <th className="text-right py-2 px-3 font-medium">Mensajes</th>
                            <th className="text-right py-2 px-3 font-medium">Usuarios</th>
                            <th className="text-right py-2 px-3 font-medium">Sin Respuesta</th>
                            <th className="text-right py-2 px-3 font-medium">Tiempo Resp.</th>
                            <th className="text-right py-2 px-3 font-medium">Citas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.map((day, index) => (
                            <tr key={day.fecha} className={index === 0 ? 'bg-blue-50 font-medium' : 'hover:bg-gray-50'}>
                              <td className="py-2 px-3">
                                {day.fecha ? new Date(day.fecha).toLocaleDateString('es-MX', { 
                                  weekday: 'short', 
                                  day: '2-digit', 
                                  month: '2-digit' 
                                }) : '-'}
                              </td>
                              <td className="py-2 px-3 text-right">{day.total_mensajes?.toLocaleString() || '0'}</td>
                              <td className="py-2 px-3 text-right">{day.usuarios_unicos?.toLocaleString() || '0'}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={day.sin_respuesta > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                  {day.sin_respuesta?.toLocaleString() || '0'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                {formatResponseTime(day.tiempo_respuesta_seg)}
                              </td>
                              <td className="py-2 px-3 text-right">{day.solicitudes_cita?.toLocaleString() || '0'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métricas de Dashboard de Secretaria */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dashboard de Secretaria</h3>
              <DashboardSecretariaCards />
            </div>

            {/* Métricas de Sistema */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Métricas del Sistema</h3>
              <DashboardSistemaCards />
            </div>

            {/* Métricas de IA */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Métricas de IA</h3>
              <MetricasResumenCards />
            </div>

            {/* Métricas del Clasificador */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Métricas del Clasificador</h3>
              <ClasificadorMetricsCards />
            </div>

            {/* Timeline de Citas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Timeline de Citas</h3>
              <TimelineMetricsCards />
            </div>

            {/* Análisis de Recordatorios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Análisis de Recordatorios Hoy</h3>
              <RecordatoriosAnalysisCards />
            </div>

            {/* Métricas de Confirmación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Métricas de Confirmación</h3>
              <ConfirmationMetricsCards />
            </div>
            
            {/* Métricas de Notificación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Métricas de Notificación</h3>
              <NotificationMetricsCards />
            </div>

            {/* Modales */}
            <ClientControlModal
              isOpen={isClientControlModalOpen}
              onClose={() => setIsClientControlModalOpen(false)}
            />

            <ActiveClientControlModal
              isOpen={isActiveClientControlModalOpen}
              onClose={() => setIsActiveClientControlModalOpen(false)}
            />

            <N8nMessagesModal
              isOpen={isN8nMessagesModalOpen}
              onClose={() => setIsN8nMessagesModalOpen(false)}
            />

            <TodayMessagesModal
              isOpen={isTodayMessagesModalOpen}
              onClose={() => setIsTodayMessagesModalOpen(false)}
              selectedDate={selectedDate}
            />

            <UniqueUsersModal
              isOpen={isUniqueUsersModalOpen}
              onClose={() => setIsUniqueUsersModalOpen(false)}
              selectedDate={selectedDate}
            />

            <AppointmentRequestsModal
              isOpen={isAppointmentRequestsModalOpen}
              onClose={() => setIsAppointmentRequestsModalOpen(false)}
              selectedDate={selectedDate}
            />
          </div>
        </main>
      </div>
    </DashboardProtectedRoute>
  );
};

export default EvolutionDashboardSimple;
