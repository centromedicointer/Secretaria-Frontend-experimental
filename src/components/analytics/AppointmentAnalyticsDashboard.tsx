import React from 'react';
import { useAppointmentAnalytics } from '@/hooks/useAppointmentAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Users,
  BarChart3
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendChart } from './TrendChart';
import { AppointmentStatesChart } from './AppointmentStatesChart';
import { HourlyDistributionChart } from './HourlyDistributionChart';

const AppointmentAnalyticsDashboard = () => {
  const {
    todayMetrics,
    alerts,
    timeDistribution,
    weeklyTrends,
    loading,
    error,
    // Legacy support
    comparisonMetrics,
    appointmentStates
  } = useAppointmentAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  const metrics = todayMetrics;

  return (
    <div className="space-y-6">
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.["Citas Hoy"] || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.Confirmadas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.["Tasa Confirmación"] || "0%"} del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.["No Shows"] || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.["Tasa No-Show"] || "0%"} del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.["Tiempo Promedio"] || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              Confirmación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Badge */}
      {metrics?.["Estado General"] && (
        <div className="flex justify-center">
          <Badge variant={
            metrics["Estado General"].includes("🟢") ? "default" :
            metrics["Estado General"].includes("🟡") ? "secondary" : "destructive"
          }>
            {metrics["Estado General"]}
          </Badge>
        </div>
      )}

      {/* Comparison Metrics */}
      {comparisonMetrics.data && comparisonMetrics.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Comparación de Períodos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparisonMetrics.data.map((metric, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">{metric.icono}</div>
                  <div className="font-semibold">{metric.periodo}</div>
                  <div className="text-sm text-muted-foreground">{metric.citas} citas</div>
                  <div className="text-xs">
                    <span className="text-green-600">{metric["Tasa Confirmación"]}</span> confirmación
                  </div>
                  <div className="text-xs">
                    <span className="text-red-600">{metric["Tasa No-Show"]}</span> no-show
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        {weeklyTrends && weeklyTrends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tendencia (Últimos 30 días)</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={weeklyTrends} />
            </CardContent>
          </Card>
        )}

        {/* Appointment States Pie Chart */}
        {appointmentStates.data && appointmentStates.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estados de Citas (Este Mes)</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentStatesChart data={appointmentStates.data} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hourly Distribution */}
      {timeDistribution && timeDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución por Horarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HourlyDistributionChart data={timeDistribution} />
          </CardContent>
        </Card>
      )}

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <Alert key={index} variant={alert.clase_css as any}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{alert.mensaje}</AlertTitle>
                  <AlertDescription>
                    {alert.valor && <span className="font-medium">Valor: {alert.valor}</span>}
                    {alert.accion_recomendada && (
                      <div className="mt-1 text-sm">
                        <strong>Acción recomendada:</strong> {alert.accion_recomendada}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy Problematic Patients - Remove or replace with real data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pacientes de Alto Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Esta sección se actualizará con datos reales próximamente.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentAnalyticsDashboard;