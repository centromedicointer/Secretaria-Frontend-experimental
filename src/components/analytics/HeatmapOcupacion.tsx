import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeatmapData } from '@/hooks/useAppointmentAnalytics';

interface HeatmapOcupacionProps {
  heatmapData: HeatmapData | null;
  loading?: boolean;
}

export const HeatmapOcupacion: React.FC<HeatmapOcupacionProps> = ({ 
  heatmapData, 
  loading = false 
}) => {
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🗓️ Mapa de Calor - Ocupación Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!heatmapData || !heatmapData.heatmapData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🗓️ Mapa de Calor - Ocupación Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay datos de ocupación disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { heatmapData: data, resumen } = heatmapData;
  
  // Organizar datos por día y hora
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const horas = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8;
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  });
  
  // Crear matriz
  const matriz: Record<string, Record<string, any>> = {};
  data.forEach(item => {
    if (!matriz[item.hora]) matriz[item.hora] = {};
    matriz[item.hora][item.dia] = item;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗓️ Mapa de Calor - Ocupación Semanal
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Total: {resumen.totalCitasEnHeatmap} citas | 
          Mejor: {resumen.mejorHorario || 'N/A'}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Tabla Heatmap */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-xs font-medium text-muted-foreground p-2 border-b">
                  Hora
                </th>
                {dias.map(dia => (
                  <th key={dia} className="text-xs font-medium text-muted-foreground p-2 text-center border-b">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horas.map(hora => (
                <tr key={hora}>
                  <td className="text-xs font-medium text-foreground p-2 border-r">
                    {hora}
                  </td>
                  {dias.map(dia => {
                    const celda = matriz[hora]?.[dia] || {};
                    const tieneCitas = celda.totalCitas > 0;
                    
                    return (
                      <td 
                        key={`${hora}-${dia}`}
                        className="p-2 text-center relative group cursor-pointer border border-border/20 min-w-[40px] h-[40px]"
                        style={{ 
                          backgroundColor: celda.color || 'hsl(var(--muted))',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tieneCitas && (
                          <>
                            <span className="text-xs font-medium text-foreground">
                              {celda.totalCitas}
                            </span>
                            
                            {/* Tooltip */}
                            <div className="absolute z-10 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-md p-3 shadow-md border -top-20 left-1/2 transform -translate-x-1/2 w-36">
                              <div className="font-medium">{dia} {hora}</div>
                              <div className="mt-1 space-y-1">
                                <div>Citas: {celda.totalCitas}</div>
                                <div>Confirmadas: {celda.confirmadas || 0}</div>
                                <div>Tasa: {celda.tasaConfirmacion || 0}%</div>
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                <div className="border-4 border-transparent border-t-popover"></div>
                              </div>
                            </div>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leyenda */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted border border-border rounded-sm"></div>
            <span className="text-muted-foreground">Sin citas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#fef3c7' }}></div>
            <span className="text-muted-foreground">1 cita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#fbbf24' }}></div>
            <span className="text-muted-foreground">2-3 citas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#f97316' }}></div>
            <span className="text-muted-foreground">4+ citas</span>
          </div>
        </div>
        
        {/* Resumen adicional */}
        {(resumen.horasPico?.length > 0 || resumen.diasMasOcupados?.length > 0) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            {resumen.horasPico?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">⏰ Horas Pico</h4>
                <p className="text-xs text-muted-foreground">
                  {resumen.horasPico.join(', ')}
                </p>
              </div>
            )}
            {resumen.diasMasOcupados?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">📅 Días Ocupados</h4>
                <p className="text-xs text-muted-foreground">
                  {resumen.diasMasOcupados.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};