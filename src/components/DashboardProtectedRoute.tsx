
import { ReactNode } from 'react';
import { useDashboardPermissions, DashboardType } from '@/hooks/useDashboardPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

interface DashboardProtectedRouteProps {
  children: ReactNode;
  requiredDashboard: DashboardType;
  dashboardName: string;
}

const DashboardProtectedRoute = ({ 
  children, 
  requiredDashboard, 
  dashboardName 
}: DashboardProtectedRouteProps) => {
  // TEMPORALMENTE DESACTIVADO PARA WEB CRAWLER
  // TODO: Reactivar verificación de permisos después del crawling
  return <>{children}</>;
  
  /*
  const { hasAccess, permissions, loading } = useDashboardPermissions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Los administradores tienen acceso a todos los dashboards
  const hasAccesToDashboard = permissions?.isAdmin || hasAccess(requiredDashboard);

  if (!hasAccesToDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
        <Card className="w-full max-w-md mx-4 text-center">
          <CardHeader>
            <div className="mx-auto p-2 bg-red-100 rounded-lg w-fit mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              No tienes permisos para acceder al <strong>{dashboardName}</strong>.
            </p>
            <p className="text-sm text-gray-500">
              Contacta a tu administrador para solicitar acceso a este dashboard.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
  */
};

export default DashboardProtectedRoute;
