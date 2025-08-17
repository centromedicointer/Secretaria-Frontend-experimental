import React from 'react';
import { useAppointmentAnalytics } from '@/hooks/useAppointmentAnalytics';

export const WeeklyMetrics = () => {
  const { weeklyMetrics, loading } = useAppointmentAnalytics();

  if (loading) {
    return <div className="animate-pulse bg-muted h-32 rounded-lg"></div>;
  }

  return (
    <div className="bg-card rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">📊 Vista Semanal de Citas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {weeklyMetrics.map((week) => (
          <div 
            key={week.periodo}
            className={`border rounded-lg p-4 ${
              week.estadoSemana === 'actual' 
                ? 'border-primary bg-primary/5' 
                : 'border-border'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{week.icono}</span>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {week.periodo}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {week.rangoFechas}
                  </p>
                </div>
              </div>
              {week.estadoSemana === 'actual' && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  ACTUAL
                </span>
              )}
            </div>

            {/* Métricas */}
            <div className="space-y-2">
              {/* Total de citas */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total citas:</span>
                <span className="font-bold text-lg text-foreground">
                  {week.totalAgendadas}
                </span>
              </div>

              {/* Desglose si hay citas */}
              {week.tienesCitas && (
                <>
                  <div className="border-t border-border pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">✓ Confirmadas:</span>
                      <span className="font-medium text-foreground">{week.confirmadas}</span>
                    </div>
                    
                    {week.pendientes > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-600 dark:text-yellow-400">⏳ Pendientes:</span>
                        <span className="font-medium text-foreground">{week.pendientes}</span>
                      </div>
                    )}
                    
                    {week.canceladas > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600 dark:text-red-400">✗ Canceladas:</span>
                        <span className="font-medium text-foreground">{week.canceladas}</span>
                      </div>
                    )}
                    
                    {week.noShows > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600 dark:text-red-400">👻 No-shows:</span>
                        <span className="font-medium text-foreground">{week.noShows}</span>
                      </div>
                    )}
                  </div>

                  {/* Tasa de confirmación */}
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Confirmación:
                      </span>
                      <span className={`font-bold ${
                        week.tasaConfirmacion >= 70 ? 'text-green-600 dark:text-green-400' :
                        week.tasaConfirmacion >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {week.tasaConfirmacion}%
                      </span>
                    </div>
                    
                    {/* Barra de progreso */}
                    <div className="mt-1 w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          week.tasaConfirmacion >= 70 ? 'bg-green-500' :
                          week.tasaConfirmacion >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(week.tasaConfirmacion, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              )}

              {/* Sin citas */}
              {!week.tienesCitas && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Sin citas agendadas
                </div>
              )}

              {/* Alertas */}
              {week.alertas && (
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ {week.alertas}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen rápido */}
      {weeklyMetrics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {weeklyMetrics.reduce((sum, w) => sum + w.totalAgendadas, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total en 3 semanas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {weeklyMetrics.reduce((sum, w) => sum + w.confirmadas, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Confirmadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {weeklyMetrics.reduce((sum, w) => sum + w.pendientes, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};