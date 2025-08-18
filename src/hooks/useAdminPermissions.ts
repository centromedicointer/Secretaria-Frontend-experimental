
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DashboardType } from './useDashboardPermissions';

interface UserPermission {
  user_id: string;
  user_email: string;
  evolution_access: boolean;
  n8n_access: boolean;
  secretaria_access: boolean;
}

export const useAdminPermissions = () => {
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsersAndPermissions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'No se pudieron cargar los usuarios',
          variant: 'destructive',
        });
        return;
      }

      setUsers(data.users);
    } catch (error) {
      console.error('Error in fetchUsersAndPermissions:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (userId: string, dashboardType: DashboardType, hasAccess: boolean) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          dashboardType,
          hasAccess
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo actualizar el permiso',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Éxito',
        description: `Permiso ${hasAccess ? 'otorgado' : 'revocado'} correctamente`,
      });

      // Recargar datos
      await fetchUsersAndPermissions();
      return true;
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: 'Error',
        description: 'Error al actualizar el permiso',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUsersAndPermissions();
  }, []);

  return {
    users,
    loading,
    updatePermission,
    refresh: fetchUsersAndPermissions,
  };
};
