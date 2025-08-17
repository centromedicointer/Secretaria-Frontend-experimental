import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, TrendingUp, Info } from 'lucide-react';
import { HourMetrics } from '@/hooks/useAppointmentAnalytics';

interface MetricasPorHoraProps {
  hourMetrics: HourMetrics[] | null;
  loading?: boolean;
}

export const MetricasPorHora: React.FC<MetricasPorHoraProps> = ({ 
  hourMetrics, 
  loading = false 
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Distribución por Hora del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hourMetrics || hourMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Distribución por Hora del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay datos por hora disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Encontrar la hora pico (mayor número de citas)
  const horaPico = hourMetrics.reduce((max, actual) => 
    actual.total_citas > max.total_citas ? actual : max, 
    hourMetrics[0]
  );

  // Procesar datos para identificar horas pico
  const processedData = hourMetrics.map(hora => ({
    ...hora,
    esHoraPico: hora.hora === horaPico.hora && hora.total_citas > 0,
    porcentajeDelTotal: hourMetrics.length > 0 
      ? Math.round((hora.total_citas / hourMetrics.reduce((sum, h) => sum + h.total_citas, 0)) * 100)
      : 0
  }));

  // Ordenar por hora
  const sortedHoursData = processedData.sort((a, b) => {
    const horaA = parseInt(a.hora.split(':')[0]);
    const horaB = parseInt(b.hora.split(':')[0]);
    return horaA - horaB;
  });

  const totalCitas = hourMetrics.reduce((sum, h) => sum + h.total_citas, 0);
  const promedioConfirmacion = hourMetrics.length > 0 
    ? Math.round(hourMetrics.reduce((sum, h) => sum + h.tasa_confirmacion, 0) / hourMetrics.length)
    : 0;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Distribución por Hora del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumen Principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg cursor-help">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-primary">{horaPico.hora}</p>
                    <p className="text-sm text-muted-foreground">Hora Pico</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hora con mayor número de citas: {horaPico.total_citas} citas</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-help">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalCitas}</p>
                    <p className="text-sm text-muted-foreground">Total de Citas</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Número total de citas registradas en todas las horas</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-help">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    %
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{promedioConfirmacion}%</p>
                    <p className="text-sm text-muted-foreground">Promedio Confirmación</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tasa promedio de confirmación en todas las horas</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Distribución por Horas */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Distribución detallada por hora
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedHoursData.map((hora) => (
                <Tooltip key={hora.hora}>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-3 rounded-lg text-center transition-all duration-200 cursor-help ${
                        hora.esHoraPico 
                          ? 'bg-primary/10 border-2 border-primary shadow-md' 
                          : 'bg-muted hover:bg-muted/80 border border-border'
                      }`}
                    >
                      {hora.esHoraPico && (
                        <div className="flex items-center justify-center mb-1">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary font-medium ml-1">Pico</span>
                        </div>
                      )}
                      <div className="font-bold text-lg text-foreground">{hora.hora}</div>
                      <div className="text-2xl font-bold text-primary mb-1">{hora.total_citas}</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(hora.tasa_confirmacion)}% confirmación
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {hora.confirmadas} confirmadas
                      </div>
                      
                      {/* Mini barra de progreso */}
                      <div className="w-full bg-border rounded-full h-1 mt-2">
                        <div 
                          className={`h-1 rounded-full ${
                            hora.esHoraPico ? 'bg-primary' : 'bg-muted-foreground'
                          }`}
                          style={{ width: `${Math.min(hora.porcentajeDelTotal * 4, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p><strong>{hora.hora}</strong></p>
                      <p>Total citas: {hora.total_citas}</p>
                      <p>Confirmadas: {hora.confirmadas} ({Math.round(hora.tasa_confirmacion)}%)</p>
                      <p>No-shows: {hora.no_shows}</p>
                      <p>Promedio por día: {hora.promedio_por_dia.toFixed(1)}</p>
                      {hora.esHoraPico && <p className="text-primary">🚀 Hora pico del día</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};