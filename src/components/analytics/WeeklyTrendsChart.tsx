import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { TrendData } from '@/hooks/useAppointmentAnalytics';

interface WeeklyTrendsChartProps {
  weeklyTrends: TrendData[];
  loading?: boolean;
}

export const WeeklyTrendsChart: React.FC<WeeklyTrendsChartProps> = ({ 
  weeklyTrends, 
  loading = false 
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencias Semanales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weeklyTrends || weeklyTrends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencias Semanales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay datos de tendencias disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para el gráfico
  const chartData = weeklyTrends.map((day, index) => ({
    fecha: new Date(day.dia).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    citas: day.citas,
    confirmadas: day.confirmadas,
    no_shows: day.no_shows,
    tasa_confirmacion: day.tasa_confirmacion,
    tasa_no_show: day.tasa_no_show
  }));

  // Calcular tendencias
  const totalCitas = weeklyTrends.reduce((sum, day) => sum + day.citas, 0);
  const totalConfirmadas = weeklyTrends.reduce((sum, day) => sum + day.confirmadas, 0);
  const totalNoShows = weeklyTrends.reduce((sum, day) => sum + day.no_shows, 0);
  const avgConfirmationRate = totalCitas > 0 ? (totalConfirmadas / totalCitas) * 100 : 0;
  const avgNoShowRate = totalCitas > 0 ? (totalNoShows / totalCitas) * 100 : 0;

  // Tendencia de confirmación (comparar primera mitad con segunda mitad)
  const firstHalf = weeklyTrends.slice(0, Math.floor(weeklyTrends.length / 2));
  const secondHalf = weeklyTrends.slice(Math.floor(weeklyTrends.length / 2));
  
  const firstHalfAvg = firstHalf.length > 0 
    ? firstHalf.reduce((sum, day) => sum + day.tasa_confirmacion, 0) / firstHalf.length 
    : 0;
  const secondHalfAvg = secondHalf.length > 0 
    ? secondHalf.reduce((sum, day) => sum + day.tasa_confirmacion, 0) / secondHalf.length 
    : 0;
  
  const confirmationTrend = secondHalfAvg - firstHalfAvg;

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getTrendBadge = (trend: number) => {
    if (trend > 5) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Mejorando</Badge>;
    if (trend < -5) return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Empeorando</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Estable</Badge>;
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencias Semanales (últimos 30 días)
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  {getTrendBadge(confirmationTrend)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {confirmationTrend > 5 ? 'La tasa de confirmación está mejorando' : 
                   confirmationTrend < -5 ? 'La tasa de confirmación está empeorando' : 
                   'La tasa de confirmación se mantiene estable'}
                </p>
              </TooltipContent>
            </UITooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métricas de Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="text-2xl font-bold text-primary mb-1">{totalCitas}</div>
                  <p className="text-sm text-muted-foreground">Total de Citas</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Número total de citas en los últimos 30 días</p>
              </TooltipContent>
            </UITooltip>
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {avgConfirmationRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Tasa Confirmación</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Porcentaje promedio de citas confirmadas en el período</p>
              </TooltipContent>
            </UITooltip>
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                    {avgNoShowRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Tasa No-Show</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Porcentaje promedio de pacientes que no asistieron</p>
              </TooltipContent>
            </UITooltip>
          </div>

          {/* Indicador de Tendencia */}
          <UITooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-lg cursor-help">
                {getTrendIcon(confirmationTrend)}
                <span className="text-sm font-medium">
                  Tendencia de confirmación: {Math.abs(confirmationTrend).toFixed(1)} puntos
                </span>
                <Info className="h-3 w-3 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Comparación entre la primera y segunda mitad del período de 30 días</p>
            </TooltipContent>
          </UITooltip>

        {/* Gráfico de Líneas */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="fecha" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis className="text-muted-foreground" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--card-foreground))'
                }}
                formatter={(value, name) => {
                  if (name === 'tasa_confirmacion' || name === 'tasa_no_show') {
                    return [`${Number(value).toFixed(1)}%`, 
                            name === 'tasa_confirmacion' ? 'Tasa Confirmación' : 'Tasa No-Show'];
                  }
                  return [value, name === 'citas' ? 'Citas' : name === 'confirmadas' ? 'Confirmadas' : 'No-Shows'];
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="citas" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Citas"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="confirmadas" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Confirmadas"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="tasa_confirmacion" 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Tasa Confirmación (%)"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </TooltipProvider>
  );
};