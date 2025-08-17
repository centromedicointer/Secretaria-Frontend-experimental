
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface N8nConnectionStatusProps {
  config: {
    baseUrl?: string;
    workflowId?: string;
  };
  isConnecting: boolean;
  onDisconnect: () => Promise<void>;
}

export const N8nConnectionStatus: React.FC<N8nConnectionStatusProps> = ({ config, isConnecting, onDisconnect }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white/60 p-4 rounded-lg space-y-2">
        <p className="text-sm break-all"><strong>URL:</strong> {config.baseUrl}</p>
        <p className="text-sm"><strong>Workflow ID:</strong> {config.workflowId || 'Todos'}</p>
      </div>
      <Button 
        onClick={onDisconnect}
        variant="outline"
        className="w-full"
        disabled={isConnecting}
      >
        {isConnecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Desconectando...</> : "Desconectar"}
      </Button>
    </div>
  );
};
