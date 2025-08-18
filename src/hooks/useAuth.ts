
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStoredUser, setStoredUser, logoutUser, type AuthUser } from '@/lib/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    const storedUser = getStoredUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  // Function to update user state (for login)
  const updateUser = (newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      setStoredUser(newUser);
    }
  };

  const signOut = async () => {
    try {
      logoutUser();
      setUser(null);
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Error al cerrar sesión',
        variant: 'destructive',
      });
    }
  };

  return {
    user,
    session: user ? { user } : null, // Compatibility with existing code
    loading,
    signOut,
    updateUser, // Export the updateUser function
  };
};
