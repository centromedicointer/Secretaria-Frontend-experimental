
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { useN8nConnection } from '@/hooks/useN8nConnection';
import { N8nConnectionForm } from '@/components/n8n/N8nConnectionForm';
import { N8nConnectionStatus } from '@/components/n8n/N8nConnectionStatus';

interface N8nConnectionProps {
  onConnectionChange: (isConnected: boolean, config: any) => void;
}

export const N8nConnection: React.FC<N8nConnectionProps> = ({ onConnectionChange }) => {
  const { 
    isLoading, 
    isConnecting, 
    isConnected, 
    config, 
    handleConnect, 
    handleDisconnect 
  } = useN8nConnection({ onConnectionChange });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48 space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      );
    }

    if (!isConnected) {
      return <N8nConnectionForm isConnecting={isConnecting} onConnect={handleConnect} />;
    }

    return <N8nConnectionStatus isConnecting={isConnecting} onDisconnect={handleDisconnect} config={config} />;
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">Conexión N8n</CardTitle>
          {isConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
              <XCircle className="h-3 w-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </div>
        <CardDescription>
          Configura tu conexión con N8n para visualizar datos del workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
};
