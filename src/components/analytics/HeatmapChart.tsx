import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { HeatmapData } from '@/hooks/useHeatmapData';

interface HeatmapChartProps {
  data: HeatmapData;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  const { heatmapData, resumen } = data;

  // Agrupar datos por día y hora para crear la matriz
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const horas = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  // Crear matriz organizada
  const matrizHeatmap = dias.map(dia => 
    horas.map(hora => 
      heatmapData.find(cell => cell.dia === dia && cell.hora === hora) || {
        dia,
        hora,
        totalCitas: 0,
        confirmadas: 0,
        tasaConfirmacion: 0,
        intensidad: 'vacio' as const,
        color: '#f3f4f6'
      }
    )
  );

  const getTooltipContent = (cell: any) => {
    return (
      <div className="bg-background border border-border rounded-md p-2 shadow-md">
        <div className="font-medium text-sm">{cell.dia} - {cell.hora}</div>
        <div className="text-xs space-y-1 mt-1">
          <div>Total: {cell.totalCitas} citas</div>
          <div>Confirmadas: {cell.confirmadas}</div>
          <div>Tasa: {cell.tasaConfirmacion}%</div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Mapa de Calor - Ocupación por Horarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f3f4f6' }}></div>
            Vacío
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fef3c7' }}></div>
            Bajo (1-2)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fde68a' }}></div>
            Medio (3-4)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            Alto (5+)
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Headers de horas */}
            <div className="grid grid-cols-14 gap-1 mb-2">
              <div className="text-xs font-medium text-center py-1"></div>
              {horas.map(hora => (
                <div key={hora} className="text-xs font-medium text-center py-1 min-w-[50px]">
                  {hora}
                </div>
              ))}
            </div>
            
            {/* Filas por día */}
            {matrizHeatmap.map((fila, diaIndex) => (
              <div key={dias[diaIndex]} className="grid grid-cols-14 gap-1 mb-1">
                {/* Header del día */}
                <div className="text-xs font-medium text-center py-2 min-w-[50px]">
                  {dias[diaIndex]}
                </div>
                
                {/* Celdas de horas */}
                {fila.map((cell, horaIndex) => (
                  <div
                    key={`${diaIndex}-${horaIndex}`}
                    className="relative group cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 rounded"
                    style={{ backgroundColor: cell.color }}
                  >
                    <div className="h-8 w-full rounded flex items-center justify-center">
                      <span className="text-xs font-medium text-foreground/80">
                        {cell.totalCitas > 0 ? cell.totalCitas : ''}
                      </span>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {getTooltipContent(cell)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Resumen estadístico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">Horas Pico</div>
              <div className="text-xs text-muted-foreground">
                {resumen.horasPico.join(', ') || 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">Días Ocupados</div>
              <div className="text-xs text-muted-foreground">
                {resumen.diasMasOcupados.join(', ') || 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-medium">Mejor Horario</div>
              <div className="text-xs text-muted-foreground">
                {resumen.mejorHorario}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};