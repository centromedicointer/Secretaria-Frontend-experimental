
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Workflow, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  // Estados para login
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      let loginEmail = identifier;

      // Si no parece un email, asumir que es un username
      if (!identifier.includes('@')) {
        const { data, error: rpcError } = await supabase.rpc('get_email_by_username', {
          p_username: identifier,
        });

        if (rpcError || !data) {
          setLoginLoading(false);
          toast({
            title: 'Error al iniciar sesión',
            description: rpcError?.message || 'Nombre de usuario no encontrado.',
            variant: 'destructive',
          });
          return;
        }
        loginEmail = data;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast({
          title: 'Error al iniciar sesión',
          description: 'Credenciales incorrectas. Por favor, verifica tus datos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Inicio de sesión exitoso',
          description: '¡Bienvenido de nuevo!',
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error durante el inicio de sesión.',
        variant: 'destructive',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto p-2 bg-blue-600 rounded-lg w-fit mb-4">
            <Workflow className="h-8 w-8 text-white" />
          </div>
          <CardTitle>Hub de Dashboards</CardTitle>
          <CardDescription>
            Accede a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email o nombre de usuario</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="tu@email.com o tu_usuario"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loginLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loginPassword">Contraseña</Label>
              <div className="relative">
                <Input
                  id="loginPassword"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loginLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  disabled={loginLoading}
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loginLoading}>
              {loginLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
