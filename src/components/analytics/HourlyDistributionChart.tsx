import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HourlyDistribution } from '@/hooks/useAppointmentAnalytics';

interface HourlyDistributionChartProps {
  data: HourlyDistribution[];
}

export const HourlyDistributionChart: React.FC<HourlyDistributionChartProps> = ({ data }) => {
  const getBarColor = (categoria: string) => {
    switch (categoria) {
      case 'primary':
        return 'hsl(var(--primary))';
      case 'secondary':
        return 'hsl(var(--secondary))';
      default:
        return 'hsl(var(--muted))';
    }
  };

  const processedData = data.map(item => ({
    horario: item.horario,
    total_citas: item.total_citas,
    porcentaje: item.porcentaje_formateado,
    color: getBarColor(item.color_categoria)
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="horario" 
            className="text-xs"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis className="text-xs" tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: any, name: string) => [
              `${value} citas`,
              'Total'
            ]}
            labelFormatter={(label) => `${label}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Bar 
            dataKey="total_citas" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};