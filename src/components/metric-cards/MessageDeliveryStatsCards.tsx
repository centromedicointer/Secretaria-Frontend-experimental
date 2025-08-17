
import React from 'react';
import { TrendingUp, Mail, AlertTriangle } from 'lucide-react';
import { MetricCard } from './MetricCard';

interface MensajesStats {
  total: number;
  entregados: number;
  leidos: number;
  fallidos: number;
}

interface MessageDeliveryStatsCardsProps {
  mensajesStats: MensajesStats;
}

export const MessageDeliveryStatsCards: React.FC<MessageDeliveryStatsCardsProps> = ({
  mensajesStats
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Mensajes Entregados"
        value={mensajesStats.entregados || 0}
        description={mensajesStats.total > 0 ? `${((mensajesStats.entregados / mensajesStats.total) * 100).toFixed(1)}% del total` : '0% del total'}
        icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        valueColor="text-green-600"
      />

      <MetricCard
        title="Mensajes Leídos"
        value={mensajesStats.leidos || 0}
        description={mensajesStats.total > 0 ? `${((mensajesStats.leidos / mensajesStats.total) * 100).toFixed(1)}% del total` : '0% del total'}
        icon={<Mail className="h-4 w-4 text-blue-600" />}
        valueColor="text-blue-600"
      />

      <MetricCard
        title="Mensajes Fallidos"
        value={mensajesStats.fallidos || 0}
        description={mensajesStats.total > 0 ? `${((mensajesStats.fallidos / mensajesStats.total) * 100).toFixed(1)}% del total` : '0% del total'}
        icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        valueColor="text-red-600"
      />
    </div>
  );
};
