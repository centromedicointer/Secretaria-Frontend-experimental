import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Settings, ExternalLink } from 'lucide-react';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

interface GoogleCalendarSetupProps {
  onCalendarSelect: (calendarId: string) => void;
  currentCalendarId?: string;
}

export const GoogleCalendarSetup: React.FC<GoogleCalendarSetupProps> = ({
  onCalendarSelect,
  currentCalendarId
}) => {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Verificar si ya estamos autenticados
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    // Verificar si tenemos tokens guardados
    const hasAuth = localStorage.getItem('google_calendar_auth');
    setIsAuthenticated(!!hasAuth);
    
    if (hasAuth) {
      loadCalendars();
    }
  };

  const authenticateWithGoogle = async () => {
    console.log('🚀 authenticateWithGoogle called!');
    try {
      // Configuración OAuth2 para Google Calendar
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/google-auth-callback.html`;
      const scope = 'https://www.googleapis.com/auth/calendar';
      
      // Debug info
      console.log('Auth configuration:', {
        clientId,
        redirectUri,
        scope,
        origin: window.location.origin
      });
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;

      console.log('🌐 Auth URL completa:', authUrl);
      console.log('🔑 Client ID being used:', clientId);
      console.log('🔗 Redirect URI:', redirectUri);

      // Validar que tenemos client ID
      if (!clientId || clientId === 'your-google-client-id') {
        throw new Error('Client ID de Google no está configurado. Verifica tu archivo .env.local');
      }

      // Abrir URL en una nueva pestaña para debug
      console.log('⚠️  DEBUG: Copiando URL para verificar manualmente...');
      navigator.clipboard?.writeText(authUrl);

      // Abrir ventana de autenticación
      const authWindow = window.open(
        authUrl, 
        'google-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        throw new Error('No se pudo abrir la ventana de autenticación. Verifica que los pop-ups estén permitidos.');
      }

      // Escuchar el callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          localStorage.setItem('google_calendar_auth', JSON.stringify(event.data.tokens));
          setIsAuthenticated(true);
          loadCalendars();
          authWindow?.close();
          
          toast({
            title: "Autenticación exitosa",
            description: "Conectado a Google Calendar",
          });
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          toast({
            title: "Error de autenticación",
            description: event.data.error,
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Cleanup
      return () => window.removeEventListener('message', handleMessage);
      
    } catch (error) {
      console.error('🚨 Authentication error:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      toast({
        title: "Error",
        description: `No se pudo iniciar la autenticación: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const loadCalendars = async () => {
    setIsLoading(true);
    try {
      const auth = localStorage.getItem('google_calendar_auth');
      if (!auth) {
        throw new Error('No authentication found');
      }

      const tokens = JSON.parse(auth);
      
      // Llamar a la API de Google Calendar para obtener calendarios
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, solicitar nueva autenticación
          localStorage.removeItem('google_calendar_auth');
          setIsAuthenticated(false);
          throw new Error('Sesión expirada. Vuelve a autenticarte.');
        }
        throw new Error('Error al obtener calendarios');
      }

      const data = await response.json();
      setCalendars(data.items || []);
      
    } catch (error) {
      console.error('Error loading calendars:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalendarChange = (calendarId: string) => {
    onCalendarSelect(calendarId);
    
    // Guardar selección en localStorage
    localStorage.setItem('selected_calendar_id', calendarId);
    
    const selectedCalendar = calendars.find(cal => cal.id === calendarId);
    toast({
      title: "Calendario seleccionado",
      description: `Usando: ${selectedCalendar?.summary || calendarId}`,
    });
  };

  const disconnectGoogle = () => {
    localStorage.removeItem('google_calendar_auth');
    localStorage.removeItem('selected_calendar_id');
    setIsAuthenticated(false);
    setCalendars([]);
    
    toast({
      title: "Desconectado",
      description: "Se ha desconectado de Google Calendar",
    });
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conecta tu cuenta de Google para acceder a tus calendarios
          </p>
          <Button onClick={authenticateWithGoogle} className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Conectar con Google Calendar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Seleccionar Calendario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Calendario activo:</label>
          <Select value={currentCalendarId} onValueChange={handleCalendarChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un calendario" />
            </SelectTrigger>
            <SelectContent>
              {calendars.map((calendar) => (
                <SelectItem key={calendar.id} value={calendar.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {calendar.summary}
                      {calendar.primary && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-1 rounded">
                          Principal
                        </span>
                      )}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentCalendarId && (
          <div className="text-xs text-muted-foreground">
            <strong>ID del calendario:</strong> {currentCalendarId}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadCalendars} disabled={isLoading}>
            {isLoading ? "Cargando..." : "Recargar calendarios"}
          </Button>
          
          <Button variant="outline" size="sm" onClick={disconnectGoogle}>
            Desconectar
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://calendar.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Google Calendar
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};