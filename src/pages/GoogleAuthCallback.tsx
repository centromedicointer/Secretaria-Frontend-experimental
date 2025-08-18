import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export const GoogleAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        if (error) {
          // Enviar error al parent window
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: `Error de autorización: ${error}`
          }, window.location.origin);
          window.close();
          return;
        }

        if (!code) {
          throw new Error('No se recibió código de autorización');
        }

        // Intercambiar código por tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: `${window.location.origin}/#/auth/google/callback`,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Error al obtener tokens de acceso');
        }

        const tokens = await tokenResponse.json();
        
        // Enviar tokens al parent window
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          tokens: tokens
        }, window.location.origin);
        
        // Cerrar ventana de callback
        window.close();
        
      } catch (error) {
        console.error('Google auth callback error:', error);
        
        // Enviar error al parent window
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: (error as Error).message
        }, window.location.origin);
        
        window.close();
      }
    };

    handleGoogleCallback();
  }, [searchParams]);

  // Si no se puede cerrar automáticamente la ventana
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Procesando autenticación...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Completando el proceso de autenticación con Google Calendar.
            Esta ventana se cerrará automáticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};