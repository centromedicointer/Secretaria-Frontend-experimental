import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const WeeklyMetricsFlexible = () => {
  const [numWeeks, setNumWeeks] = useState(3);
  const [includePast, setIncludePast] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_weekly_metrics_flexible' as any, {
          p_num_weeks: numWeeks,
          p_include_past: includePast,
          p_reference_date: new Date().toISOString().split('T')[0]
        });
      
      if (error) throw error;
      setMetrics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [numWeeks, includePast]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Controles */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📊 Vista Semanal Flexible</h3>
        
        <div className="flex gap-3">
          {/* Selector de número de semanas */}
          <select 
            value={numWeeks}
            onChange={(e) => setNumWeeks(Number(e.target.value))}
            className="px-3 py-1 border rounded"
          >
            <option value="3">3 semanas</option>
            <option value="5">5 semanas</option>
            <option value="7">7 semanas</option>
            <option value="10">10 semanas</option>
          </select>
          
          {/* Toggle pasado/futuro */}
          <button
            onClick={() => setIncludePast(!includePast)}
            className={`px-3 py-1 rounded ${
              includePast 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {includePast ? '📅 Con pasadas' : '📆 Solo futuras'}
          </button>
        </div>
      </div>

      {/* Grid de métricas */}
      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {metrics.map((week: any) => (
            <div 
              key={week.periodo}
              className={`border rounded p-3 ${
                week.estadoSemana === 'actual' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{week.icono}</span>
                <span className="text-xs text-gray-500">
                  {week.rangoFechas}
                </span>
              </div>
              
              <div className="font-semibold text-sm">
                {week.periodo}
              </div>
              
              <div className="text-2xl font-bold">
                {week.totalAgendadas}
              </div>
              
              <div className="text-xs text-gray-600">
                {week.confirmadas} confirmadas
              </div>
              
              {week.tasaConfirmacion > 0 && (
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full"
                      style={{ width: `${week.tasaConfirmacion}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};