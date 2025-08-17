
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
      
      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No hay sesión activa',
          variant: 'destructive',
        });
        return;
      }

      // Llamar a la función edge
      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los usuarios',
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
      if (hasAccess) {
        // Otorgar permiso
        const { error } = await supabase
          .from('user_dashboard_permissions')
          .insert({
            user_id: userId,
            dashboard_type: dashboardType,
          });

        if (error) {
          console.error('Error granting permission:', error);
          toast({
            title: 'Error',
            description: 'No se pudo otorgar el permiso',
            variant: 'destructive',
          });
          return false;
        }
      } else {
        // Revocar permiso
        const { error } = await supabase
          .from('user_dashboard_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('dashboard_type', dashboardType);

        if (error) {
          console.error('Error revoking permission:', error);
          toast({
            title: 'Error',
            description: 'No se pudo revocar el permiso',
            variant: 'destructive',
          });
          return false;
        }
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
