import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface DashboardConfigProps {
  onConfigChange: (config: DashboardConfig) => void;
}

export interface DashboardConfig {
  weeklyMetrics: boolean;
  weeklyMetricsFlexible: boolean;
  appointmentAnalytics: boolean;
  evolutionMetrics: boolean;
  dashboardSecretaria: boolean;
  dashboardSistema: boolean;
  metricasIA: boolean;
  clasificadorMetrics: boolean;
  timelineMetrics: boolean;
  recordatoriosAnalysis: boolean;
  confirmationMetrics: boolean;
  notificationMetrics: boolean;
}

const DEFAULT_CONFIG: DashboardConfig = {
  weeklyMetrics: true,
  weeklyMetricsFlexible: true,
  appointmentAnalytics: true,
  evolutionMetrics: true,
  dashboardSecretaria: true,
  dashboardSistema: true,
  metricasIA: true,
  clasificadorMetrics: true,
  timelineMetrics: true,
  recordatoriosAnalysis: true,
  confirmationMetrics: true,
  notificationMetrics: true,
};

const SECTION_LABELS: Record<keyof DashboardConfig, string> = {
  weeklyMetrics: 'Métricas Semanales',
  weeklyMetricsFlexible: 'Métricas Semanales Flexible',
  appointmentAnalytics: 'Analytics de Citas',
  evolutionMetrics: 'Evolution Metrics',
  dashboardSecretaria: 'Dashboard de Secretaria',
  dashboardSistema: 'Métricas del Sistema',
  metricasIA: 'Métricas de IA',
  clasificadorMetrics: 'Métricas del Clasificador',
  timelineMetrics: 'Timeline de Citas',
  recordatoriosAnalysis: 'Análisis de Recordatorios',
  confirmationMetrics: 'Métricas de Confirmación',
  notificationMetrics: 'Métricas de Notificación',
};

export const DashboardConfig: React.FC<DashboardConfigProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [open, setOpen] = useState(false);

  // Cargar configuración guardada al montar el componente
  useEffect(() => {
    const savedConfig = localStorage.getItem('dashboardConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
        onConfigChange({ ...DEFAULT_CONFIG, ...parsed });
      } catch (error) {
        console.error('Error parsing dashboard config:', error);
      }
    }
  }, [onConfigChange]);

  const handleToggle = (key: keyof DashboardConfig) => {
    const newConfig = {
      ...config,
      [key]: !config[key],
    };
    setConfig(newConfig);
    localStorage.setItem('dashboardConfig', JSON.stringify(newConfig));
    onConfigChange(newConfig);
  };

  const toggleAll = (enabled: boolean) => {
    const newConfig = Object.keys(DEFAULT_CONFIG).reduce((acc, key) => {
      acc[key as keyof DashboardConfig] = enabled;
      return acc;
    }, {} as DashboardConfig);
    
    setConfig(newConfig);
    localStorage.setItem('dashboardConfig', JSON.stringify(newConfig));
    onConfigChange(newConfig);
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.setItem('dashboardConfig', JSON.stringify(DEFAULT_CONFIG));
    onConfigChange(DEFAULT_CONFIG);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
        >
          <Settings className="h-4 w-4 mr-2" />
          Configurar Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Dashboard
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Controles globales */}
          <div className="flex gap-2 pb-4 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(true)}
              className="flex-1"
            >
              Activar Todo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(false)}
              className="flex-1"
            >
              Desactivar Todo
            </Button>
          </div>

          {/* Lista de secciones */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <label htmlFor={key} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                  {label}
                </label>
                <Switch
                  id={key}
                  checked={config[key as keyof DashboardConfig]}
                  onCheckedChange={() => handleToggle(key as keyof DashboardConfig)}
                />
              </div>
            ))}
          </div>

          {/* Botón de reset */}
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="w-full"
            >
              Restaurar por defecto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};