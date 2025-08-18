import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, RefreshCw } from "lucide-react";

const MEXICO_TIMEZONE = 'America/Mexico_City';

interface GoogleCalendarWidgetDirectProps {
  calendarId: string;
}

interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  recurrence?: string[];
}

export const GoogleCalendarWidgetDirect: React.FC<GoogleCalendarWidgetDirectProps> = ({
  calendarId,
}) => {
  console.log('🗓️ GoogleCalendarWidgetDirect rendered with calendarId:', calendarId);
  
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const timeMin = startOfMonth(displayMonth).toISOString();
  const timeMax = endOfMonth(displayMonth).toISOString();

  // Efecto para invalidar query cuando cambia el calendarId
  useEffect(() => {
    if (calendarId) {
      console.log('📅 Calendar ID changed, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
    }
  }, [calendarId, queryClient]);

  // Obtener token de autenticación
  const getAccessToken = (): string | null => {
    const auth = localStorage.getItem('google_calendar_auth');
    if (!auth) return null;
    
    try {
      const tokens = JSON.parse(auth);
      return tokens.access_token;
    } catch {
      return null;
    }
  };

  const { data: events, isLoading, error, refetch } = useQuery<GCalEvent[]>({
    queryKey: [
      "google-calendar-events",
      calendarId,
      displayMonth.getUTCFullYear(),
      displayMonth.getUTCMonth(),
    ],
    queryFn: async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No hay token de acceso. Vuelve a autenticarte.');
      }

      console.log('Fetching calendar events directly from Google Calendar API...');
      
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=250`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado
          localStorage.removeItem('google_calendar_auth');
          throw new Error('Sesión expirada. Vuelve a autenticarte.');
        }
        throw new Error(`Error al obtener eventos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Retrieved ${data.items?.length || 0} events from Google Calendar`);
      return data.items || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 1,
    enabled: !!calendarId && !!getAccessToken(),
  });

  const handleCalendarDateClick = (date: Date | undefined) => {
    setSelected(date);
  };

  const eventDates = useMemo(() => {
    if (!events) return [] as Date[];
    const set = new Set<string>();
    
    for (const ev of events) {
      const startStr = ev.start.dateTime || ev.start.date;
      if (!startStr) continue;
      
      let key: string;
      if (ev.start.dateTime) {
        // Evento con hora específica
        key = formatInTimeZone(new Date(startStr), MEXICO_TIMEZONE, 'yyyy-MM-dd');
      } else {
        // Evento de todo el día
        key = startStr; // Ya viene en formato yyyy-MM-dd
      }
      
      set.add(key);
    }
    
    return Array.from(set).map((k) => new Date(k + 'T12:00:00'));
  }, [events]);

  const eventsOfSelectedDay = useMemo(() => {
    if (!events || !selected) return [] as GCalEvent[];
    return events.filter((ev) => {
      const startStr = ev.start.dateTime || ev.start.date;
      if (!startStr) return false;
      const d = parseISO(startStr);
      return isSameDay(d, selected);
    });
  }, [events, selected]);

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Actualizando",
      description: "Cargando eventos del calendario...",
    });
  };

  const openGoogleCalendar = () => {
    const url = `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}`;
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-4">
            {(error as Error).message}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
            <Button onClick={openGoogleCalendar} variant="outline" size="sm">
              Abrir Google Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
      <div className="rounded-lg border p-3 relative">
        <Calendar
          mode="single"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={selected}
          onSelect={handleCalendarDateClick}
          modifiers={{ event: eventDates }}
          modifiersClassNames={{
            event: "bg-primary/20 text-primary rounded-md font-medium",
          }}
          showOutsideDays
        />
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 
            className="text-base font-semibold cursor-pointer hover:text-primary transition-colors"
            onClick={() => selected && eventsOfSelectedDay.length > 0 && setShowDayEventsModal(true)}
          >
            Eventos {selected ? selected.toLocaleDateString() : "(selecciona un día)"}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={openGoogleCalendar}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Ver en Google
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        )}

        {!isLoading && eventsOfSelectedDay.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay eventos para este día.</p>
        )}

        <ul className="space-y-3">
          {eventsOfSelectedDay.map((ev) => {
            const startStr = ev.start.dateTime || ev.start.date;
            const endStr = ev.end.dateTime || ev.end.date;
            const isAllDay = Boolean(ev.start.date && ev.end.date);

            const startTime = startStr
              ? formatInTimeZone(new Date(startStr), MEXICO_TIMEZONE, "HH:mm")
              : "";
            const endTime = endStr
              ? formatInTimeZone(new Date(endStr), MEXICO_TIMEZONE, "HH:mm")
              : "";

            return (
              <li key={ev.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium leading-none mb-1">
                      {ev.summary || "(Sin título)"}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ev.description.length > 100 
                          ? ev.description.substring(0, 100) + "..."
                          : ev.description
                        }
                      </p>
                    )}
                    {ev.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {ev.location}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {isAllDay ? "Todo el día" : `${startTime} - ${endTime}`}
                    </span>
                  </div>
                </div>
                {ev.htmlLink && (
                  <a
                    href={ev.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    Ver en Google Calendar
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Modal de eventos del día */}
      <Dialog open={showDayEventsModal} onOpenChange={setShowDayEventsModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Eventos del {selected ? selected.toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {eventsOfSelectedDay.map((ev) => {
              const startStr = ev.start.dateTime || ev.start.date;
              const endStr = ev.end.dateTime || ev.end.date;
              const isAllDay = Boolean(ev.start.date && ev.end.date);

              const startTime = startStr
                ? formatInTimeZone(new Date(startStr), MEXICO_TIMEZONE, "HH:mm")
                : "";
              const endTime = endStr
                ? formatInTimeZone(new Date(endStr), MEXICO_TIMEZONE, "HH:mm")
                : "";

              return (
                <div key={ev.id} className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h4 className="text-xl font-bold text-foreground">
                        {ev.summary || "(Sin título)"}
                      </h4>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          🕐 {isAllDay ? "Todo el día" : `${startTime} - ${endTime}`}
                        </span>
                      </div>
                      
                      {ev.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>📍</span>
                          <span className="font-medium">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {ev.description && (
                    <div className="pt-3 border-t border-border">
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {ev.htmlLink && (
                    <div className="pt-2 border-t border-border">
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        🔗 Ver en Google Calendar
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
            {eventsOfSelectedDay.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay eventos para este día
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};