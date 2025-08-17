
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardProtectedRoute from '@/components/DashboardProtectedRoute';
import { N8nConnection } from '@/components/N8nConnection';
import { N8nMetricsGrid } from '@/components/N8nMetricsGrid';
import { ExecutionHistory } from '@/components/ExecutionHistory';
import { DataVisualization } from '@/components/DataVisualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Workflow, Database, TrendingUp, ArrowLeft } from 'lucide-react';

const N8nDashboard = () => {
  const [isN8nConnected, setIsN8nConnected] = useState(false);
  const navigate = useNavigate();

  const handleN8nConnectionChange = (connected: boolean, config: any) => {
    setIsN8nConnected(connected);
    console.log("Estado de conexión N8n actualizado:", { connected, config });
  };

  return (
    <DashboardProtectedRoute 
      requiredDashboard="n8n" 
      dashboardName="Dashboard N8n"
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Workflow className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard N8n</h1>
                  <p className="text-gray-600">Monitorea y visualiza tus workflows</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={isN8nConnected ? "default" : "secondary"} className="text-sm">
                  N8n: {isN8nConnected ? "Conectado" : "Sin conexión"}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Connection Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-1">
                <N8nConnection onConnectionChange={handleN8nConnectionChange} />
              </div>
              <div className="lg:col-span-1">
                <Card className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-6 w-6" />
                      Estado del Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">
                        {isN8nConnected ? '✓' : '✗'}
                      </div>
                      <div className="text-lg opacity-90">N8n Connection</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* N8n specific sections */}
            {isN8nConnected && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Métricas Completas de N8n</h2>
                  </div>
                  <N8nMetricsGrid isConnected={isN8nConnected} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Visualización de Datos (N8n)</h2>
                  <DataVisualization isConnected={isN8nConnected} />
                </div>
                <div>
                  <ExecutionHistory isConnected={isN8nConnected} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </DashboardProtectedRoute>
  );
};

export default N8nDashboard;
