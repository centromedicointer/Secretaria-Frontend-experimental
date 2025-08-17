
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  updated_at: string | null;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el perfil',
          variant: 'destructive',
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { username?: string; full_name?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar si el username está disponible
      if (updates.username) {
        const { data: isAvailable } = await supabase.rpc('is_username_available', {
          p_username: updates.username,
          p_user_id: user.id
        });

        if (!isAvailable) {
          toast({
            title: 'Error',
            description: 'Este nombre de usuario ya está en uso',
            variant: 'destructive',
          });
          return false;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el perfil',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Éxito',
        description: 'Perfil actualizado correctamente',
      });

      await fetchProfile();
      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      toast({
        title: 'Error',
        description: 'Error al actualizar el perfil',
        variant: 'destructive',
      });
      return false;
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const { data } = await supabase.rpc('is_username_available', {
        p_username: username
      });
      return data || false;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    updateProfile,
    checkUsernameAvailability,
    refetch: fetchProfile,
  };
};
