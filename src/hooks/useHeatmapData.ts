import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeatmapCell {
  dia: string;
  hora: string;
  totalCitas: number;
  confirmadas: number;
  tasaConfirmacion: number;
  intensidad: 'vacio' | 'bajo' | 'medio' | 'alto';
  color: string;
}

export interface HeatmapResumen {
  horasPico: string[];
  diasMasOcupados: string[];
  totalCitasEnHeatmap: number;
  mejorHorario: string;
}

export interface HeatmapData {
  heatmapData: HeatmapCell[];
  resumen: HeatmapResumen;
}

export const useHeatmapData = () => {
  return useQuery({
    queryKey: ['heatmap-data'],
    queryFn: async (): Promise<HeatmapData | null> => {
      try {
        const { data, error } = await supabase
          .rpc('get_heatmap_data' as any);
        
        if (error) throw error;
        
        console.log('Heatmap raw data:', data); // Debug log
        
        const result = data?.[0]?.get_heatmap_data || data?.get_heatmap_data;
        if (!result) {
          console.log('No heatmap result found');
          return null;
        }

        console.log('Parsed heatmap result:', result); // Debug log

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
        throw err;
      }
    },
    refetchInterval: 30000
  });
};