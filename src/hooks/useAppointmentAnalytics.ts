import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for the analytics data
export interface DailyMetrics {
  'Citas Hoy': number;
  'Confirmadas': number;
  'Tasa Confirmación': string;
  'No Shows': number;
  'Tasa No-Show': string;
  'Tiempo Promedio': string;
  'Hora Pico': string;
  'Estado General': string;
}

export interface ComparisonMetrics {
  periodo: string;
  citas: number;
  'Tasa Confirmación': string;
  'Tasa No-Show': string;
  icono: string;
}

export interface TrendData {
  dia: string;
  citas: number;
  confirmadas: number;
  no_shows: number;
  tasa_confirmacion: number;
  tasa_no_show: number;
  tipo_dia: string;
}

export interface HourlyDistribution {
  horario: string;
  total_citas: number;
  porcentaje_formateado: string;
  color_categoria: string;
}

export interface AppointmentStates {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

export interface WeeklyPerformance {
  'Citas': number;
  'Confirmadas': number;
  '% Confirmación': string;
  'No Shows': number;
  '% No-Show': string;
  'Tiempo Prom.': string;
  'Estado': string;
}

export interface AlertData {
  tipo: string;
  prioridad: string;
  mensaje: string;
  valor: string;
  accion_recomendada: string;
  clase_css: string;
}

export interface ProblematicPatients {
  paciente: string;
  telefono_oculto: string;
  total_no_shows: number;
  total_cancelaciones: number;
  total_citas: number;
  '% No-Show': string;
  clasificacion_riesgo: string;
  clase_riesgo: string;
}

export interface WeeklyMetrics {
  periodo: string;
  rangoFechas: string;
  fechaInicio: string;
  fechaFin: string;
  totalAgendadas: number;
  confirmadas: number;
  pendientes: number;
  noShows: number;
  canceladas: number;
  completadas: number;
  tasaConfirmacion: number;
  icono: string;
  orden: number;
  estadoSemana: string;
  tienesCitas: boolean;
  alertas: string | null;
  porcentajePendientes: number;
  porcentajeNoShows: number;
}

// New interfaces for additional analytics
export interface DayMetrics {
  dia: string;
  dia_semana: number;
  total_citas: number;
  confirmadas: number;
  pendientes: number;
  no_shows: number;
  canceladas: number;
  tasa_confirmacion: number;
  tasa_no_show: number;
  tipo_dia: string;
  color_dia: string;
  es_mejor_dia: boolean;
  es_peor_dia: boolean;
}

export interface HeatmapData {
  heatmapData: Array<{
    dia: string;
    hora: string;
    totalCitas: number;
    confirmadas: number;
    tasaConfirmacion: number;
    intensidad: string;
    color: string;
  }>;
  resumen: {
    horasPico: string[];
    diasMasOcupados: string[];
    totalCitasEnHeatmap: number;
    mejorHorario: string;
  };
}

export interface HourMetrics {
  hora: string;
  hora_numerica: number;
  total_citas: number;
  confirmadas: number;
  no_shows: number;
  tasa_confirmacion: number;
  dias_con_citas: number;
  promedio_por_dia: number;
  es_hora_pico: boolean;
}

// Helper function to convert day names to numbers
const getDayNumber = (dayName: string): number => {
  const dayMap: Record<string, number> = {
    'Domingo': 0,
    'Lunes': 1, 
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6
  };
  return dayMap[dayName] || 1;
};

export const useAppointmentAnalytics = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // 1. Métricas principales del día usando get_dashboard_today
  const dailyMetrics = useQuery({
    queryKey: ['daily-metrics'],
    queryFn: async (): Promise<DailyMetrics | null> => {
      try {
        const { data: metrics, error } = await supabase
          .rpc('get_dashboard_today_direct' as any);
        
        if (error) throw error;
        const result = (metrics as any)?.[0] || null;
        
        if (!result) return null;

        return {
          'Citas Hoy': result['Citas Hoy'] || 0,
          'Confirmadas': result['Confirmadas'] || 0,
          'Tasa Confirmación': result['Tasa Confirmación'] || '0%',
          'No Shows': result['No Shows'] || 0,
          'Tasa No-Show': result['Tasa No-Show'] || '0%',
          'Tiempo Promedio': result['Tiempo Promedio'] || 'N/A',
          'Hora Pico': result['Hora Pico'] || 'N/A',
          'Estado General': result['Estado General'] || '🔴 Sin datos'
        };
      } catch (err) {
        console.error('Error fetching today metrics:', err);
        throw err;
      }
    },
    refetchInterval: 30000
  });

  // 2. Comparación con períodos anteriores
  const comparisonMetrics = useQuery({
    queryKey: ['comparison-metrics'],
    queryFn: async (): Promise<ComparisonMetrics[]> => {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get today's data
      const { data: todayData } = await supabase
        .from('appointments')
        .select('estado')
        .gte('fecha_original', today.toISOString().split('T')[0])
        .lt('fecha_original', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Get yesterday's data  
      const { data: yesterdayData } = await supabase
        .from('appointments')
        .select('estado')
        .gte('fecha_original', yesterday.toISOString().split('T')[0])
        .lt('fecha_original', today.toISOString().split('T')[0]);

      const todayTotal = todayData?.length || 0;
      const todayConfirmadas = todayData?.filter(a => a.estado === 'confirmado').length || 0;
      const todayNoShows = todayData?.filter(a => a.estado === 'no_show').length || 0;

      const yesterdayTotal = yesterdayData?.length || 0;
      const yesterdayConfirmadas = yesterdayData?.filter(a => a.estado === 'confirmado').length || 0;
      const yesterdayNoShows = yesterdayData?.filter(a => a.estado === 'no_show').length || 0;

      return [
        {
          periodo: 'Hoy',
          citas: todayTotal,
          'Tasa Confirmación': `${todayTotal > 0 ? Math.round((todayConfirmadas * 100) / todayTotal) : 0}%`,
          'Tasa No-Show': `${todayTotal > 0 ? Math.round((todayNoShows * 100) / todayTotal) : 0}%`,
          icono: '📊'
        },
        {
          periodo: 'Ayer',
          citas: yesterdayTotal,
          'Tasa Confirmación': `${yesterdayTotal > 0 ? Math.round((yesterdayConfirmadas * 100) / yesterdayTotal) : 0}%`,
          'Tasa No-Show': `${yesterdayTotal > 0 ? Math.round((yesterdayNoShows * 100) / yesterdayTotal) : 0}%`,
          icono: '📅'
        }
      ];
    },
    refetchInterval: 30000
  });

  // 3. Tendencia últimos 30 días usando get_trends_data
  const trendData = useQuery({
    queryKey: ['trend-data'],
    queryFn: async (): Promise<TrendData[]> => {
      try {
        const { data: trends, error } = await supabase
          .rpc('get_trends_data' as any, { days_back: 30 });
        
        if (error) throw error;
        
        return ((trends as any[]) || []).map((day: any) => ({
          dia: day.day || day.fecha || '',
          citas: day.scheduled || 0,
          confirmadas: day.confirmed || 0,
          no_shows: day.noShows || 0,
          tasa_confirmacion: day.confirmationRate || 0,
          tasa_no_show: day.noShowRate || 0,
          tipo_dia: 'weekday'
        }));
      } catch (err) {
        console.error('Error fetching weekly trends:', err);
        return [];
      }
    },
    refetchInterval: 30000
  });

  // 4. Distribución horaria usando get_time_distribution
  const hourlyDistribution = useQuery({
    queryKey: ['hourly-distribution'], 
    queryFn: async (): Promise<HourlyDistribution[]> => {
      try {
        const { data: distribution, error } = await supabase
          .rpc('get_time_distribution' as any);
        
        if (error) throw error;
        
        return ((distribution as any[]) || []).map((item: any) => ({
          horario: item.horario || '',
          total_citas: item.appointments || item.total_citas || 0,
          porcentaje_formateado: `${item.percentage || item.porcentaje || 0}%`,
          color_categoria: item.color === '#28a745' ? 'primary' : 
                           item.color === '#ffc107' ? 'secondary' : 'tertiary'
        }));
      } catch (err) {
        console.error('Error fetching time distribution:', err);
        return [];
      }
    },
    refetchInterval: 30000
  });

  // 5. Estados de citas del mes
  const appointmentStates = useQuery({
    queryKey: ['appointment-states'],
    queryFn: async (): Promise<AppointmentStates[]> => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);

      const { data, error } = await supabase
        .from('appointments')
        .select('estado')
        .gte('fecha_original', startOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      const total = data?.length || 0;
      const confirmadas = data?.filter(a => a.estado === 'confirmado').length || 0;
      const canceladas = data?.filter(a => a.estado === 'cancelado').length || 0;
      const noShows = data?.filter(a => a.estado === 'no_show').length || 0;
      const completadas = data?.filter(a => a.estado === 'completado').length || 0;
      const pendientes = total - confirmadas - canceladas - noShows - completadas;

      const states: AppointmentStates[] = [
        {
          estado: 'Confirmadas',
          cantidad: confirmadas,
          porcentaje: total > 0 ? Math.round((confirmadas * 100) / total) : 0,
          color: '#28a745'
        },
        {
          estado: 'Canceladas',
          cantidad: canceladas,
          porcentaje: total > 0 ? Math.round((canceladas * 100) / total) : 0,
          color: '#ffc107'
        },
        {
          estado: 'No Shows',
          cantidad: noShows,
          porcentaje: total > 0 ? Math.round((noShows * 100) / total) : 0,
          color: '#dc3545'
        },
        {
          estado: 'Pendientes',
          cantidad: pendientes,
          porcentaje: total > 0 ? Math.round((pendientes * 100) / total) : 0,
          color: '#6c757d'
        }
      ];

      return states.filter(s => s.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad);
    },
    refetchInterval: 30000
  });

  // 6. Alertas usando get_alerts
  const alerts = useQuery({
    queryKey: ['alerts'],
    queryFn: async (): Promise<AlertData[]> => {
      try {
        const { data: alertsResult, error } = await supabase
          .rpc('get_alerts' as any);
        
        if (error) throw error;
        
        const alerts = (alertsResult as any)?.alertas || [];
        return alerts.map((alert: any) => ({
          tipo: alert.tipo || 'info',
          prioridad: alert.prioridad || 'media',
          mensaje: alert.mensaje || '',
          valor: alert.valor || '',
          accion_recomendada: alert.accion || '',
          clase_css: alert.prioridad === 'critica' ? 'destructive' : 
                     alert.prioridad === 'alta' ? 'warning' : 'default'
        }));
      } catch (err) {
        console.error('Error fetching alerts:', err);
        return [];
      }
    },
    refetchInterval: 60000
  });

  // 7. Pacientes problemáticos - Mock data
  const problematicPatients = useQuery({
    queryKey: ['problematic-patients'],
    queryFn: async (): Promise<ProblematicPatients[]> => {
      // Mock data - reemplazar cuando se cree v_pacientes_problematicos view
      return [
        {
          paciente: 'Juan Pérez',
          telefono_oculto: '555***1234',
          total_no_shows: 3,
          total_cancelaciones: 1,
          total_citas: 5,
          '% No-Show': '60%',
          clasificacion_riesgo: '🔴 Alto riesgo',
          clase_riesgo: 'high-risk'
        }
      ];
    },
    refetchInterval: 300000 // 5 minutes
  });

  // 7. Monthly Stats usando get_monthly_report
  const monthlyStats = useQuery({
    queryKey: ['monthly-stats'],
    queryFn: async () => {
      try {
        const { data: monthlyReport, error } = await supabase
          .rpc('get_monthly_report' as any);
        
        if (error) throw error;
        
        const report = monthlyReport as any;
        return {
          totalAppointments: report?.resumen_general?.total_citas || 0,
          avgConfirmationRate: report?.indicadores_clave?.tasa_confirmacion_promedio || 0,
          avgNoShowRate: report?.indicadores_clave?.tasa_no_show_promedio || 0,
          uniquePatients: report?.resumen_general?.pacientes_unicos || 0,
          recurringPercentage: report?.resumen_general?.porcentaje_recurrentes || 0,
          peakHour: report?.distribucion_horarios?.hora_pico_frecuente || 'N/A',
          monthName: report?.mes || 'Mes actual'
        };
      } catch (err) {
        console.error('Error fetching monthly stats:', err);
        return null;
      }
    },
    refetchInterval: 300000 // 5 minutes
  });

  // 8. Weekly Metrics usando get_weekly_metrics
  const weeklyMetrics = useQuery({
    queryKey: ['weekly-metrics'],
    queryFn: async (): Promise<WeeklyMetrics[]> => {
      try {
        const { data: metrics, error } = await supabase
          .rpc('get_weekly_metrics' as any);
        
        if (error) throw error;
        
        // Map the database response to match the WeeklyMetrics interface
        return (metrics || []).map((week: any) => ({
          periodo: week.periodo,
          rangoFechas: week.rango_fechas,
          fechaInicio: week.fecha_inicio,
          fechaFin: week.fecha_fin,
          totalAgendadas: week.total_agendadas || 0,
          confirmadas: week.confirmadas || 0,
          pendientes: week.pendientes || 0,
          noShows: week.no_shows || 0,
          canceladas: week.canceladas || 0,
          completadas: week.completadas || 0,
          tasaConfirmacion: week.tasa_confirmacion || 0,
          icono: week.icono,
          orden: week.orden,
          estadoSemana: week.estado_semana,
          tienesCitas: (week.total_agendadas || 0) > 0,
          alertas: week.alertas || null,
          porcentajePendientes: week.porcentaje_pendientes || 0,
          porcentajeNoShows: week.porcentaje_no_shows || 0
        }));
      } catch (err) {
        console.error('Error fetching weekly metrics:', err);
        return [];
      }
    },
    refetchInterval: 30000
  });

  // 9. Day Metrics usando get_metrics_by_day
  const dayMetrics = useQuery({
    queryKey: ['day-metrics'],
    queryFn: async (): Promise<DayMetrics[]> => {
      try {
        const { data, error } = await supabase.rpc('get_metrics_by_day' as any);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching day metrics:', err);
        return [];
      }
    },
    refetchInterval: 30000
  });

  // 10. Heatmap Data usando get_heatmap_data
  const heatmapData = useQuery({
    queryKey: ['heatmap-data'],
    queryFn: async (): Promise<HeatmapData | null> => {
      try {
        const { data, error } = await supabase
          .rpc('get_heatmap_data' as any);
        
        if (error) throw error;
        
        const result = data?.[0]?.get_heatmap_data || data?.get_heatmap_data || data;
        
        if (!result) {
          return null;
        }

        return {
          heatmapData: result.heatmapData || [],
          resumen: result.resumen || {
            horasPico: [],
            diasMasOcupados: [],
            totalCitasEnHeatmap: 0,
            mejorHorario: 'N/A'
          }
        };
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
        return null;
      }
    },
    refetchInterval: 30000
  });

  // 11. Hour Metrics usando get_metrics_by_hour
  const hourMetrics = useQuery({
    queryKey: ['hour-metrics'],
    queryFn: async (): Promise<HourMetrics[]> => {
      try {
        const { data, error } = await supabase.rpc('get_metrics_by_hour' as any);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching hour metrics:', err);
        return [];
      }
    },
    refetchInterval: 30000
  });

  // Utility functions
  const refreshMetrics = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    queryClient.invalidateQueries({ queryKey: ['trend-data'] });
    queryClient.invalidateQueries({ queryKey: ['hourly-distribution'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-stats'] });
    queryClient.invalidateQueries({ queryKey: ['appointment-states'] });
    queryClient.invalidateQueries({ queryKey: ['comparison-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['weekly-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['day-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['heatmap-data'] });
    queryClient.invalidateQueries({ queryKey: ['hour-metrics'] });
  };

  const detectNoShows = async () => {
    try {
      const { data, error } = await supabase.rpc('detectar_no_shows');
      if (error) throw error;
      
      const result = data as any;
      const noShowsDetected = result?.no_shows_detectados || 0;
      
      console.log(`✅ ${noShowsDetected} no-shows detectados`);
      
      // Mostrar notificación
      if (noShowsDetected > 0) {
        toast({
          title: "No-shows detectados",
          description: `Se detectaron ${noShowsDetected} no-shows`,
        });
      }
      
      // Recargar métricas
      await refreshMetrics();
      
      return result;
    } catch (err) {
      console.error('Error detectando no-shows:', err);
      toast({
        title: "Error",
        description: "Error al detectar no-shows",
        variant: "destructive",
      });
      throw err;
    }
  };

  const detectNoShowsConfig = async (horasVentana: number = 24, minutosGracia: number = 15) => {
    try {
      const { data, error } = await supabase.rpc('detectar_no_shows_config' as any, {
        p_horas_ventana: horasVentana,
        p_minutos_gracia: minutosGracia
      });
      if (error) throw error;
      
      const result = data as any;
      const noShowsDetected = result?.no_shows_detectados || 0;
      const config = result?.configuracion || {};
      
      console.log(`✅ ${noShowsDetected} no-shows detectados (ventana: ${config.horas_ventana}h, gracia: ${config.minutos_gracia}min)`);
      
      // Mostrar notificación con detalles de configuración
      if (noShowsDetected > 0) {
        toast({
          title: "No-shows detectados",
          description: `Se detectaron ${noShowsDetected} no-shows con configuración personalizada`,
        });
      } else {
        toast({
          title: "Detección completada",
          description: `No se encontraron no-shows (ventana: ${config.horas_ventana}h, gracia: ${config.minutos_gracia}min)`,
        });
      }
      
      // Recargar métricas
      await refreshMetrics();
      
      return result;
    } catch (err) {
      console.error('Error detectando no-shows con configuración:', err);
      toast({
        title: "Error",
        description: "Error al detectar no-shows con configuración",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Return consolidated interface
  return {
    // Primary metrics
    todayMetrics: dailyMetrics.data,
    alerts: alerts.data || [],
    timeDistribution: hourlyDistribution.data || [],
    weeklyTrends: trendData.data || [],
    monthlyStats: monthlyStats.data,
    weeklyMetrics: weeklyMetrics.data || [],
    
    // New metrics
    dayMetrics: dayMetrics.data || [],
    heatmapData: heatmapData.data,
    hourMetrics: hourMetrics.data || [],
    
    // States and loading
    loading: dailyMetrics.isLoading || alerts.isLoading || hourlyDistribution.isLoading || trendData.isLoading || monthlyStats.isLoading || weeklyMetrics.isLoading || dayMetrics.isLoading || heatmapData.isLoading || hourMetrics.isLoading,
    error: dailyMetrics.error?.message || alerts.error?.message || hourlyDistribution.error?.message || trendData.error?.message || monthlyStats.error?.message || weeklyMetrics.error?.message || dayMetrics.error?.message || heatmapData.error?.message || hourMetrics.error?.message,
    
    // Utility functions
    refreshMetrics,
    detectNoShows,
    detectNoShowsConfig,
    
    // Legacy interface (for backward compatibility)
    dailyMetrics,
    comparisonMetrics,
    trendData,
    hourlyDistribution,
    appointmentStates,
    alertsQuery: alerts,
    problematicPatients,
    weeklyMetricsQuery: weeklyMetrics,
    
    // New query objects (for backward compatibility)
    dayMetricsQuery: dayMetrics,
    heatmapDataQuery: heatmapData,
    hourMetricsQuery: hourMetrics
  };
};

// Export useAlerts for convenience
export { useAlerts } from './useAlerts';