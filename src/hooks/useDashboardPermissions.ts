
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DashboardType = 'evolution' | 'n8n' | 'secretaria';

interface DashboardPermissions {
  evolution: boolean;
  n8n: boolean;
  secretaria: boolean;
  isAdmin: boolean;
}

export const useDashboardPermissions = () => {
  const [permissions, setPermissions] = useState<DashboardPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setPermissions({ evolution: false, n8n: false, secretaria: false, isAdmin: false });
          setLoading(false);
          return;
        }

        console.log('User ID:', user.id);

        // Obtener permisos de dashboard
        const { data: dashboardData, error: dashboardError } = await supabase
          .from('user_dashboard_permissions')
          .select('dashboard_type')
          .eq('user_id', user.id);

        if (dashboardError) {
          console.error('Error fetching dashboard permissions:', dashboardError);
          toast({
            title: 'Error',
            description: 'No se pudieron cargar los permisos de dashboard',
            variant: 'destructive',
          });
          setPermissions({ evolution: false, n8n: false, secretaria: false, isAdmin: false });
          setLoading(false);
          return;
        }

        // Verificar si es admin consultando directamente la tabla user_roles
        // sin usar la función has_role para evitar recursión
        const { data: adminData, error: adminError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('Admin check result:', adminData, 'Error:', adminError);

        if (adminError) {
          console.error('Error checking admin role:', adminError);
          // Si hay error al verificar admin, continuamos sin privilegios de admin
        }

        const userPermissions = dashboardData?.map(p => p.dashboard_type as DashboardType) || [];
        const isAdmin = !!adminData;
        
        setPermissions({
          evolution: userPermissions.includes('evolution') || isAdmin,
          n8n: userPermissions.includes('n8n') || isAdmin,
          secretaria: userPermissions.includes('secretaria') || isAdmin,
          isAdmin: isAdmin
        });

        console.log('Final permissions:', {
          evolution: userPermissions.includes('evolution') || isAdmin,
          n8n: userPermissions.includes('n8n') || isAdmin,
          secretaria: userPermissions.includes('secretaria') || isAdmin,
          isAdmin: isAdmin
        });

      } catch (error) {
        console.error('Error in fetchPermissions:', error);
        setPermissions({ evolution: false, n8n: false, secretaria: false, isAdmin: false });
        toast({
          title: 'Error',
          description: 'Error al cargar los permisos',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [toast]);

  const hasAccess = (dashboardType: DashboardType): boolean => {
    return permissions?.[dashboardType] || false;
  };

  return {
    permissions,
    loading,
    hasAccess,
  };
};
