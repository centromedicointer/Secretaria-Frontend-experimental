

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDashboardPermissions } from '@/hooks/useDashboardPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, BarChart3, Workflow, MessageSquare } from 'lucide-react';
import SecurityAlert from '@/components/SecurityAlert';

const Index = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { permissions, loading } = useDashboardPermissions();

  // Definir todas las tarjetas disponibles
  const allDashboards = [
    {
      key: "evolution-dashboard",
      title: "Secretaria",
      description: "Métricas y análisis de Evolution API",
      icon: <BarChart3 className="h-8 w-8 text-white" />,
      iconBg: "bg-gradient-to-r from-green-500 to-emerald-600",
      route: "/evolution",
      permission: "evolution" as const,
    },
    {
      key: "n8n-dashboard",
      title: "N8n Dashboard", 
      description: "Gestión y monitoreo de N8n workflows",
      icon: <Workflow className="h-8 w-8 text-white" />,
      iconBg: "bg-gradient-to-r from-blue-500 to-cyan-600",
      route: "/n8n",
      permission: "n8n" as const,
    },
    {
      key: "secretaria-dashboard",
      title: "Secretaria Simple",
      description: "Gestión inteligente de conversaciones y tareas",
      icon: <MessageSquare className="h-8 w-8 text-white" />,
      iconBg: "bg-gradient-to-r from-purple-500 to-pink-600",
      route: "/secretaria",
      permission: "secretaria" as const,
    }
  ];

  // TEMPORALMENTE: Mostrar todos los dashboards para el web crawler
  const availableDashboards = allDashboards;
  
  // Original code (commented for web crawler):
  /*
  const availableDashboards = allDashboards.filter(dashboard => {
    return permissions?.[dashboard.permission] === true;
  });
  */

  console.log('Permissions:', permissions);
  console.log('Available dashboards:', availableDashboards);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded mr-3 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">Hub de Dashboards</h1>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-mono">
                    v 1.0.0.2
                  </span>
                </div>
                <p className="text-sm text-gray-600">Bienvenido, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70">
                <Settings className="h-4 w-4 mr-1" />
                Mi Perfil
              </Button>
              {permissions?.isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70">
                  <Settings className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={logout} className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            Selecciona un Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            Accede a los dashboards disponibles para monitorear y gestionar tus herramientas
          </p>
        </div>

        {/* Dashboard Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando dashboards...</p>
            </div>
          </div>
        ) : availableDashboards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {availableDashboards.map((dashboard) => (
              <DashboardCard
                key={dashboard.key}
                title={dashboard.title}
                description={dashboard.description}
                icon={dashboard.icon}
                iconBg={dashboard.iconBg}
                route={dashboard.route}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No hay dashboards disponibles</h3>
              <p className="text-gray-600 mb-4">
                No tienes permisos para acceder a ningún dashboard en este momento.
              </p>
              <p className="text-sm text-gray-500">
                Contacta a tu administrador para solicitar acceso a los dashboards.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  route: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  iconBg,
  route
}) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-white/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/30 relative h-[180px] hover:scale-105 group">
      <div className="absolute top-3 right-3">
        <Badge className="bg-green-100/80 text-green-700 border-green-200/50 text-xs px-2 py-1 backdrop-blur-sm">
          Disponible
        </Badge>
      </div>
      
      <CardContent className="p-4 h-full flex items-center">
        {/* Icon on the left */}
        <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        
        {/* Content on the right */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-4">
            <CardTitle className="text-lg font-bold text-gray-900 mb-1">
              {title}
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm">
              {description}
            </CardDescription>
          </div>
          
          {/* Button */}
          <div className="w-full">
            <Button 
              onClick={() => navigate(route)} 
              variant="outline"
              size="sm"
              className="w-full"
            >
              Acceder
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Index;

