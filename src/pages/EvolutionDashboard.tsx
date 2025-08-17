
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardProtectedRoute from '@/components/DashboardProtectedRoute';
import { EvolutionMetrics } from '@/components/EvolutionMetrics';
import { EvolutionMetricsLegacy } from '@/components/EvolutionMetricsLegacy';
import { WeeklyMetrics } from '@/components/WeeklyMetrics';
import { WeeklyMetricsFlexible } from '@/components/WeeklyMetricsFlexible';
import { DashboardConfig as DashboardConfigType } from '@/components/DashboardConfig';
import { CardToggle } from '@/components/CardToggle';
import ActiveConversationsPanel from '@/components/ActiveConversationsPanel';
import PatternAnalysisPanel from '@/components/PatternAnalysisPanel';
import ResponseMetricsPanel from '@/components/ResponseMetricsPanel';
import PatientTrackingPanel from '@/components/PatientTrackingPanel';
import SmartAlertsPanel from '@/components/SmartAlertsPanel';
import AppointmentAnalyticsDashboard from '@/components/analytics/AppointmentAnalyticsDashboard';
import { HeatmapOcupacion } from '@/components/analytics/HeatmapOcupacion';
import { MetricasPorDia } from '@/components/analytics/MetricasPorDia';
import { MetricasPorHora } from '@/components/analytics/MetricasPorHora';
import { MonthlyStatsCard } from '@/components/analytics/MonthlyStatsCard';
import { WeeklyTrendsChart } from '@/components/analytics/WeeklyTrendsChart';
import { useAppointmentAnalytics } from '@/hooks/useAppointmentAnalytics';
import { ConfirmationMetricsCards } from '@/components/metric-cards/ConfirmationMetricsCards';
import { NotificationMetricsCards } from '@/components/metric-cards/NotificationMetricsCards';
import { DashboardSecretariaCards } from '@/components/metric-cards/DashboardSecretariaCards';
import { DashboardSistemaCards } from '@/components/metric-cards/DashboardSistemaCards';
import { MetricasResumenCards } from '@/components/metric-cards/MetricasResumenCards';
import { ClasificadorMetricsCards } from '@/components/metric-cards/ClasificadorMetricsCards';
import { TimelineMetricsCards } from '@/components/metric-cards/TimelineMetricsCards';
import { RecordatoriosAnalysisCards } from '@/components/metric-cards/RecordatoriosAnalysisCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Activity, BarChart3, Users, Bell, Settings, AlertTriangle } from 'lucide-react';

const EvolutionDashboard = () => {
  const navigate = useNavigate();
  const { heatmapData, dayMetrics, hourMetrics, monthlyStats, weeklyTrends, loading: heatmapLoading, detectNoShows, detectNoShowsConfig } = useAppointmentAnalytics();
  const [currentView, setCurrentView] = useState<'metrics' | 'advanced' | 'legacy'>('metrics');
  const [configMode, setConfigMode] = useState(false); // Modo de configuración on/off
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfigType>({
    weeklyMetrics: true,
    weeklyMetricsFlexible: true,
    appointmentAnalytics: true,
    evolutionMetrics: true,
    dashboardSecretaria: true,
    dashboardSistema: true,
    metricasIA: true,
    clasificadorMetrics: true,
    timelineMetrics: true,
    recordatoriosAnalysis: true,
    confirmationMetrics: true,
    notificationMetrics: true,
  });

  // Cargar configuración al iniciar
  React.useEffect(() => {
    const savedConfig = localStorage.getItem('dashboardConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setDashboardConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading dashboard config:', error);
      }
    }
  }, []);

  const toggleCard = (key: keyof DashboardConfigType) => {
    const newConfig = {
      ...dashboardConfig,
      [key]: !dashboardConfig[key]
    };
    setDashboardConfig(newConfig);
    localStorage.setItem('dashboardConfig', JSON.stringify(newConfig));
  };

  return (
    <DashboardProtectedRoute 
      requiredDashboard="evolution" 
      dashboardName="Secretaria (sistema de agendamiento AI)"
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
                  <h1 className="text-3xl font-bold text-gray-900">Secretaria (sistema de agendamiento AI)</h1>
                  <p className="text-gray-600">monitoria las metricas de sistema</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={currentView === 'metrics' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setCurrentView('metrics')}
                >
                  Métricas Base
                </Button>
                <Button 
                  variant={currentView === 'advanced' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setCurrentView('advanced')}
                >
                  Dashboard Avanzado
                </Button>
                <Button 
                  variant={currentView === 'legacy' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setCurrentView('legacy')}
                >
                  Dashboard Legacy
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'metrics' && (
            <div className="space-y-6">
              {/* Botón de configuración para Métricas Base */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">📊 Métricas Base</h2>
                <Button
                  variant={configMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConfigMode(!configMode)}
                  className="h-9 px-3"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {configMode ? 'Salir Configuración' : 'Configurar Dashboard'}
                </Button>
              </div>
              {/* Weekly Metrics */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.weeklyMetrics}
                    onToggle={() => toggleCard('weeklyMetrics')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">📊 Métricas Semanales</h3>
                {dashboardConfig.weeklyMetrics && <WeeklyMetrics />}
              </div>

              {/* Weekly Metrics Flexible */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.weeklyMetricsFlexible}
                    onToggle={() => toggleCard('weeklyMetricsFlexible')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">📈 Métricas Semanales Flexible</h3>
                {dashboardConfig.weeklyMetricsFlexible && <WeeklyMetricsFlexible />}
              </div>

              {/* New Appointment Analytics Dashboard */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.appointmentAnalytics}
                    onToggle={() => toggleCard('appointmentAnalytics')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">🏥 Analytics de Citas</h3>
                {dashboardConfig.appointmentAnalytics && <AppointmentAnalyticsDashboard />}
              </div>

              {/* Panel de Control de No-Shows */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">🚨 Control de No-Shows</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Detección de No-Shows
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Detección Básica</h4>
                        <p className="text-sm text-muted-foreground">
                          Detecta citas vencidas en las últimas 24 horas
                        </p>
                        <Button 
                          onClick={detectNoShows}
                          className="w-full"
                          variant="outline"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Detectar No-Shows
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Detección Configurable</h4>
                        <p className="text-sm text-muted-foreground">
                          Con 48h de ventana y 30min de gracia
                        </p>
                        <Button 
                          onClick={() => detectNoShowsConfig(48, 30)}
                          className="w-full"
                          variant="destructive"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Detectar con Config
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Evolution Metrics */}
              <div className="relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.evolutionMetrics}
                    onToggle={() => toggleCard('evolutionMetrics')}
                  />
                )}
                {dashboardConfig.evolutionMetrics && <EvolutionMetrics />}
              </div>
              
              {/* Métricas de Dashboard de Secretaria */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.dashboardSecretaria}
                    onToggle={() => toggleCard('dashboardSecretaria')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">👩‍💼 Dashboard de Secretaria</h3>
                {dashboardConfig.dashboardSecretaria && <DashboardSecretariaCards />}
              </div>

              {/* Métricas de Sistema */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.dashboardSistema}
                    onToggle={() => toggleCard('dashboardSistema')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">⚙️ Métricas del Sistema</h3>
                {dashboardConfig.dashboardSistema && <DashboardSistemaCards />}
              </div>

              {/* Métricas de IA */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.metricasIA}
                    onToggle={() => toggleCard('metricasIA')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">🤖 Métricas de IA</h3>
                {dashboardConfig.metricasIA && <MetricasResumenCards />}
              </div>

              {/* Métricas del Clasificador */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.clasificadorMetrics}
                    onToggle={() => toggleCard('clasificadorMetrics')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">🎯 Métricas del Clasificador</h3>
                {dashboardConfig.clasificadorMetrics && <ClasificadorMetricsCards />}
              </div>

              {/* Timeline de Citas */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.timelineMetrics}
                    onToggle={() => toggleCard('timelineMetrics')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">⏰ Timeline de Citas</h3>
                {dashboardConfig.timelineMetrics && <TimelineMetricsCards />}
              </div>

              {/* Análisis de Recordatorios */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.recordatoriosAnalysis}
                    onToggle={() => toggleCard('recordatoriosAnalysis')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">🔔 Análisis de Recordatorios</h3>
                {dashboardConfig.recordatoriosAnalysis && <RecordatoriosAnalysisCards />}
              </div>
              
              {/* Métricas de Confirmación */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.confirmationMetrics}
                    onToggle={() => toggleCard('confirmationMetrics')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">✅ Métricas de Confirmación</h3>
                {dashboardConfig.confirmationMetrics && <ConfirmationMetricsCards />}
              </div>
              
              {/* Métricas de Notificación */}
              <div className="space-y-4 relative">
                {configMode && (
                  <CardToggle
                    isActive={dashboardConfig.notificationMetrics}
                    onToggle={() => toggleCard('notificationMetrics')}
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900">📱 Métricas de Notificación</h3>
                {dashboardConfig.notificationMetrics && <NotificationMetricsCards />}
              </div>

              {/* Heatmap de Ocupación */}
              <div className="space-y-4">
                <HeatmapOcupacion 
                  heatmapData={heatmapData} 
                  loading={heatmapLoading} 
                />
              </div>

              {/* Métricas por Día */}
              <div className="space-y-4">
                <MetricasPorDia 
                  dayMetrics={dayMetrics} 
                  loading={heatmapLoading} 
                />
              </div>

              {/* Métricas por Hora */}
              <div className="space-y-4">
                <MetricasPorHora 
                  hourMetrics={hourMetrics} 
                  loading={heatmapLoading} 
                />
              </div>
              {/* Estadísticas Mensuales */}
              <div className="space-y-4">
                <MonthlyStatsCard 
                  monthlyStats={monthlyStats} 
                  loading={heatmapLoading} 
                />
              </div>

              {/* Tendencias Semanales */}
              <div className="space-y-4">
                <WeeklyTrendsChart 
                  weeklyTrends={weeklyTrends} 
                  loading={heatmapLoading} 
                />
              </div>
            </div>
          )}
          {currentView === 'legacy' && (
            <div className="space-y-6">
              {/* Botón de configuración para Dashboard Legacy */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">🔄 Dashboard Legacy</h2>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-9 px-3 opacity-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Sin configuración
                </Button>
              </div>
              <EvolutionMetricsLegacy />
            </div>
          )}
          {currentView === 'advanced' && (
            <div className="space-y-6">
              {/* Botón de configuración para Dashboard Avanzado */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">🚀 Dashboard Avanzado</h2>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-9 px-3 opacity-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Próximamente
                </Button>
              </div>
              
              {/* Heatmap de Ocupación */}
              <div className="mb-6">
                <HeatmapOcupacion 
                  heatmapData={heatmapData} 
                  loading={heatmapLoading} 
                />
              </div>

              {/* Métricas por Día */}
              <div className="mb-6">
                <MetricasPorDia 
                  dayMetrics={dayMetrics} 
                  loading={heatmapLoading} 
                />
              </div>

              {/* Métricas por Hora */}
              <div className="mb-6">
                <MetricasPorHora 
                  hourMetrics={hourMetrics} 
                  loading={heatmapLoading} 
                />
              </div>

              {/* Quick Alerts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SmartAlertsPanel />
                </div>
                <div>
                  <ActiveConversationsPanel />
                </div>
              </div>

              {/* Advanced Analytics Tabs */}
              <Tabs defaultValue="patterns" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="patterns" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Patrones
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Métricas
                  </TabsTrigger>
                  <TabsTrigger value="patients" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pacientes
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Alertas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="patterns" className="mt-6">
                  <PatternAnalysisPanel />
                </TabsContent>

                <TabsContent value="metrics" className="mt-6">
                  <ResponseMetricsPanel />
                </TabsContent>

                <TabsContent value="patients" className="mt-6">
                  <PatientTrackingPanel />
                </TabsContent>

                <TabsContent value="alerts" className="mt-6">
                  <div className="grid grid-cols-1 gap-6">
                    <SmartAlertsPanel />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </DashboardProtectedRoute>
  );
};

export default EvolutionDashboard;
