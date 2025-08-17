import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DayMetrics } from '@/hooks/useAppointmentAnalytics';

interface MetricasPorDiaProps {
  dayMetrics: DayMetrics[] | null;
  loading?: boolean;
}

// Mapear números de día a nombres
const getDayName = (diaSemana: number) => {
  const days = {
    0: { name: 'Dom', type: 'weekend' },
    1: { name: 'Lun', type: 'weekday' },
    2: { name: 'Mar', type: 'weekday' },
    3: { name: 'Mié', type: 'weekday' },
    4: { name: 'Jue', type: 'weekday' },
    5: { name: 'Vie', type: 'weekday' },
    6: { name: 'Sáb', type: 'weekend' }
  };
  return days[diaSemana as keyof typeof days] || { name: 'N/A', type: 'weekday' };
};

export const MetricasPorDia: React.FC<MetricasPorDiaProps> = ({ 
  dayMetrics, 
  loading = false 
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📅 Métricas por Día de la Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dayMetrics || dayMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📅 Métricas por Día de la Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay datos por día disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Procesar datos para el gráfico y las cards
  const processedData = dayMetrics.map(dia => {
    const dayInfo = getDayName(dia.dia_semana);
    return {
      ...dia,
      diaNombre: dayInfo.name,
      tipoDia: dayInfo.type === 'weekend' ? 'Fin de semana' : 'Día laboral',
      esMejorDia: false, // Se calculará después
    };
  });

  // Encontrar el mejor día (mayor tasa de confirmación con al menos 1 cita)
  const mejorDia = processedData
    .filter(dia => dia.total_citas > 0)
    .reduce((mejor, actual) => 
      actual.tasa_confirmacion > mejor.tasa_confirmacion ? actual : mejor, 
      processedData[0]
    );

  if (mejorDia) {
    const index = processedData.findIndex(dia => dia.dia_semana === mejorDia.dia_semana);
    if (index !== -1) {
      processedData[index].esMejorDia = true;
    }
  }

  // Ordenar por día de la semana (Lunes a Domingo)
  const orderedData = processedData.sort((a, b) => {
    // Convertir domingo (0) a 7 para que aparezca al final
    const dayA = a.dia_semana === 0 ? 7 : a.dia_semana;
    const dayB = b.dia_semana === 0 ? 7 : b.dia_semana;
    return dayA - dayB;
  });

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>📅 Métricas por Día de la Semana</CardTitle>
        </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Gráfico de Barras */}
        <div className="w-full">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={orderedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="diaNombre" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--popover-foreground))'
                }}
              />
              <Bar 
                dataKey="total_citas" 
                fill="hsl(var(--primary))" 
                name="Total Citas"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="confirmadas" 
                fill="hsl(var(--chart-2))" 
                name="Confirmadas"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="no_shows" 
                fill="hsl(var(--destructive))" 
                name="No-Shows"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cards por día */}
        <div className="grid grid-cols-7 gap-2">
          {orderedData.map((dia) => (
            <UITooltip key={dia.dia_semana}>
              <TooltipTrigger asChild>
            <div
              key={dia.dia_semana}
              className={`text-center p-3 rounded-lg border transition-all duration-200 cursor-help ${
                dia.esMejorDia 
                  ? 'border-chart-2 bg-chart-2/10 shadow-sm' 
                  : dia.tipoDia === 'Fin de semana' 
                    ? 'bg-muted/50 border-muted' 
                    : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-semibold text-sm text-foreground">{dia.diaNombre}</div>
              <div className="text-xl font-bold text-primary">{dia.total_citas}</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(dia.tasa_confirmacion)}% conf
              </div>
              {dia.esMejorDia && (
                <div className="text-xs text-chart-2 mt-1 font-medium">
                  ⭐ Mejor día
                </div>
              )}
              {dia.total_citas > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {dia.no_shows} no-shows
                </div>
              )}
            </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p><strong>{dia.diaNombre}</strong> - {dia.tipoDia}</p>
                <p>Total citas: {dia.total_citas}</p>
                <p>Confirmadas: {dia.confirmadas} ({Math.round(dia.tasa_confirmacion)}%)</p>
                <p>No-shows: {dia.no_shows}</p>
                {dia.esMejorDia && <p className="text-chart-2">⭐ Día con mejor tasa de confirmación</p>}
              </div>
            </TooltipContent>
          </UITooltip>
          ))}
        </div>

        {/* Resumen adicional */}
        {orderedData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {orderedData.reduce((sum, dia) => sum + dia.total_citas, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Semanal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-2">
                {Math.round(
                  orderedData.reduce((sum, dia) => sum + dia.tasa_confirmacion, 0) / orderedData.length
                )}%
              </div>
              <div className="text-sm text-muted-foreground">Promedio Confirmación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {orderedData.reduce((sum, dia) => sum + dia.no_shows, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total No-Shows</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </TooltipProvider>
  );
};