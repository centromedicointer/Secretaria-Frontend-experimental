import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Users, Clock, TrendingUp, Info } from 'lucide-react';

interface MonthlyStatsCardProps {
  monthlyStats: {
    totalAppointments: number;
    avgConfirmationRate: number;
    avgNoShowRate: number;
    uniquePatients: number;
    recurringPercentage: number;
    peakHour: string;
    monthName: string;
  } | null;
  loading?: boolean;
}

export const MonthlyStatsCard: React.FC<MonthlyStatsCardProps> = ({ 
  monthlyStats, 
  loading = false 
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Estadísticas Mensuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!monthlyStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Estadísticas Mensuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay datos mensuales disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getConfirmationColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfirmationLabel = (rate: number) => {
    if (rate >= 80) return 'Excelente';
    if (rate >= 60) return 'Bueno';
    return 'Necesita mejora';
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Estadísticas Mensuales
            </div>
            <Badge variant="outline">{monthlyStats.monthName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumen Principal */}
          <div className="grid grid-cols-2 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {monthlyStats.totalAppointments}
                  </div>
                  <p className="text-sm text-muted-foreground">Total de Citas</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Número total de citas agendadas en el mes</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-3xl font-bold text-blue-500">
                      {monthlyStats.uniquePatients}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Pacientes Únicos</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cantidad de pacientes diferentes atendidos</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Métricas de Rendimiento */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-help flex items-center gap-1">
                      Tasa de Confirmación
                      <Info className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Porcentaje promedio de citas confirmadas en el mes</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{monthlyStats.avgConfirmationRate}%</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant={monthlyStats.avgConfirmationRate >= 80 ? "default" : 
                                monthlyStats.avgConfirmationRate >= 60 ? "secondary" : "destructive"}
                        className="text-xs cursor-help"
                      >
                        {getConfirmationLabel(monthlyStats.avgConfirmationRate)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {monthlyStats.avgConfirmationRate >= 80 ? 'Tasa excelente (≥80%)' : 
                         monthlyStats.avgConfirmationRate >= 60 ? 'Tasa buena (60-79%)' : 
                         'Necesita mejorar (<60%)'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getConfirmationColor(monthlyStats.avgConfirmationRate)}`}
                style={{ width: `${Math.min(monthlyStats.avgConfirmationRate, 100)}%` }}
              />
            </div>
          </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-help flex items-center gap-1">
                      Tasa de No-Show
                      <Info className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Porcentaje promedio de pacientes que no asistieron a su cita</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-semibold text-red-500">{monthlyStats.avgNoShowRate}%</span>
              </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-red-500 transition-all"
                style={{ width: `${Math.min(monthlyStats.avgNoShowRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

          {/* Información Adicional */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{monthlyStats.recurringPercentage}%</p>
                    <p className="text-xs text-muted-foreground">Pacientes Recurrentes</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Porcentaje de pacientes que han tenido múltiples citas</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{monthlyStats.peakHour}</p>
                    <p className="text-xs text-muted-foreground">Hora Pico</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hora del día con mayor número de citas agendadas</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};