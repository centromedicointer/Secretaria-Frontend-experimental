
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { hasDashboardPermission } from '@/lib/auth';

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
  const { user } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        if (!user) {
          setPermissions({ evolution: false, n8n: false, secretaria: false, isAdmin: false });
          setLoading(false);
          return;
        }

        console.log('User ID:', user.id);
        console.log('User permissions:', user.dashboardPermissions);
        console.log('User roles:', user.roles);

        const userPermissions = {
          evolution: hasDashboardPermission(user, 'evolution'),
          n8n: hasDashboardPermission(user, 'n8n'),
          secretaria: hasDashboardPermission(user, 'secretaria'),
          isAdmin: user.isAdmin
        };
        
        setPermissions(userPermissions);

        console.log('Final permissions:', userPermissions);

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
  }, [user, toast]);

  const hasAccess = (dashboardType: DashboardType): boolean => {
    return permissions?.[dashboardType] || false;
  };

  return {
    permissions,
    loading,
    hasAccess,
  };
};
