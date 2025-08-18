import React, { useState, useEffect } from 'react';
import { GoogleCalendarSetup } from './GoogleCalendarSetup';
import { GoogleCalendarWidgetDirect } from './GoogleCalendarWidgetDirect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Calendar, Eye, EyeOff } from 'lucide-react';

export const GoogleCalendarManager: React.FC = () => {
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [showSetup, setShowSetup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Cargar configuración guardada
    const savedCalendarId = localStorage.getItem('selected_calendar_id');
    const hasAuth = localStorage.getItem('google_calendar_auth');
    
    setIsAuthenticated(!!hasAuth);
    
    if (savedCalendarId && hasAuth) {
      setSelectedCalendarId(savedCalendarId);
    } else {
      // Si no hay configuración, mostrar setup automáticamente
      setShowSetup(true);
    }
  }, []);

  const handleCalendarSelect = (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    setShowSetup(false);
    
    // Forzar re-render del componente
    console.log('📅 Calendar selected:', calendarId);
  };

  const handleShowSetup = () => {
    setShowSetup(!showSetup);
  };

  if (!isAuthenticated || showSetup) {
    return (
      <div className="space-y-4">
        {isAuthenticated && selectedCalendarId && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleShowSetup}>
              {showSetup ? <EyeOff className="mr-2 h-4 w-4" /> : <Settings className="mr-2 h-4 w-4" />}
              {showSetup ? 'Ocultar configuración' : 'Configurar calendario'}
            </Button>
          </div>
        )}
        
        <GoogleCalendarSetup
          onCalendarSelect={handleCalendarSelect}
          currentCalendarId={selectedCalendarId}
        />
        
        {selectedCalendarId && !showSetup && (
          <GoogleCalendarWidget calendarId={selectedCalendarId} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Google Calendar</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleShowSetup}>
          <Settings className="mr-2 h-4 w-4" />
          Configurar
        </Button>
      </div>

      {/* Widget del calendario */}
      {selectedCalendarId && (
        <GoogleCalendarWidgetDirect calendarId={selectedCalendarId} />
      )}

      {!selectedCalendarId && (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay un calendario seleccionado
            </p>
            <Button onClick={() => setShowSetup(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configurar calendario
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};