
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { MessageSquare, Mic } from 'lucide-react';

interface TextVsAudioChartProps {
  variant?: 'default' | 'legacy';
}

export const TextVsAudioChart = ({ variant = 'default' }: TextVsAudioChartProps) => {
  // Obtener datos absolutos de evolution_metricas
  const { data: evolutionMetrics, isLoading } = useQuery({
    queryKey: ['evolution-metrics-audio-text'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evolution_metricas')
        .select('mensajes_recibidos, audios_recibidos')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Procesar datos para la gráfica
  const chartData = evolutionMetrics ? [
    {
      tipo: 'Mensajes de Texto',
      cantidad: (evolutionMetrics.mensajes_recibidos || 0) - (evolutionMetrics.audios_recibidos || 0),
      color: variant === 'legacy' ? '#3b82f6' : '#06b6d4'
    },
    {
      tipo: 'Mensajes de Audio',
      cantidad: evolutionMetrics.audios_recibidos || 0,
      color: variant === 'legacy' ? '#8b5cf6' : '#8b5cf6'
    }
  ] : [];

  const chartConfig = {
    cantidad: {
      label: "Cantidad de Mensajes",
      color: variant === 'legacy' ? "#3b82f6" : "#06b6d4",
    },
  };

  if (isLoading) {
    return (
      <Card className={variant === 'legacy' ? '' : 'border border-gray-200'}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const cardStyle = variant === 'legacy' 
    ? "bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg" 
    : "border border-gray-200";

  const headerStyle = variant === 'legacy' 
    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-4 mb-4" 
    : "";

  const totalMensajes = chartData.reduce((sum, item) => sum + item.cantidad, 0);
  const porcentajeTexto = totalMensajes > 0 ? ((chartData[0]?.cantidad || 0) / totalMensajes * 100).toFixed(1) : '0';
  const porcentajeAudio = totalMensajes > 0 ? ((chartData[1]?.cantidad || 0) / totalMensajes * 100).toFixed(1) : '0';

  return (
    <Card className={cardStyle}>
      <CardHeader className={headerStyle}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${variant === 'legacy' ? 'text-white' : 'text-lg font-medium text-gray-900'} flex items-center gap-2`}>
            <MessageSquare className="h-5 w-5" />
            Texto vs Audio Recibidos
          </CardTitle>
          <div className={`text-sm ${variant === 'legacy' ? 'text-purple-100' : 'text-gray-600'}`}>
            Total: {totalMensajes.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 && totalMensajes > 0 ? (
          <div className="space-y-4">
            {/* Estadísticas resumidas */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${variant === 'legacy' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Texto</span>
                </div>
                <div className="text-lg font-bold">{chartData[0]?.cantidad.toLocaleString()}</div>
                <div className="text-xs text-gray-600">{porcentajeTexto}% del total</div>
              </div>
              
              <div className={`p-3 rounded-lg ${variant === 'legacy' ? 'bg-purple-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Audio</span>
                </div>
                <div className="text-lg font-bold">{chartData[1]?.cantidad.toLocaleString()}</div>
                <div className="text-xs text-gray-600">{porcentajeAudio}% del total</div>
              </div>
            </div>

            {/* Gráfica de barras */}
            <div className="h-64">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={variant === 'legacy' ? "#e2e8f0" : "#f1f5f9"} />
                    <XAxis 
                      dataKey="tipo" 
                      tick={{ fontSize: 12, fill: variant === 'legacy' ? '#475569' : '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: variant === 'legacy' ? '#475569' : '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) => `Tipo: ${value}`}
                    />
                    <Bar 
                      dataKey="cantidad" 
                      name="Cantidad"
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No hay datos disponibles</h3>
              <p className="text-sm">Los datos aparecerán cuando haya información de mensajes</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
