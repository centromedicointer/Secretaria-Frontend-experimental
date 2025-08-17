import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";
import { EventModal } from "./EventModal";
import { EventActions } from "./EventActions";
import { CreateEventButton } from "./CreateEventButton";
import { BlockTimeModal } from "./BlockTimeModal";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Lock } from "lucide-react";

const MEXICO_TIMEZONE = 'America/Mexico_City';

interface GoogleCalendarWidgetProps {
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
  extendedProperties?: { private?: Record<string, string> };
  recurringEventId?: string;
}

export const GoogleCalendarWidget: React.FC<GoogleCalendarWidgetProps> = ({
  calendarId,
}) => {
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GCalEvent | null>(null);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>(undefined);
  const [blockedWeekly, setBlockedWeekly] = useState<{ [day: number]: string[] }>({});
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const timeMin = startOfMonth(displayMonth).toISOString();
  const timeMax = endOfMonth(displayMonth).toISOString();

  const { data: events, isLoading, error } = useQuery<GCalEvent[]>({
    queryKey: [
      "gcal-events-private",
      calendarId,
      displayMonth.getUTCFullYear(),
      displayMonth.getUTCMonth(),
    ],
    queryFn: async () => {
      console.log('Fetching private calendar events via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          operation: 'GET',
          calendarId,
          timeMin,
          timeMax,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Error al obtener el calendario: ${error.message}`);
      }

      if (!data.success) {
        console.error('Calendar function returned error:', data.error);
        throw new Error(data.error || "Error desconocido al obtener el calendario");
      }

      console.log(`Retrieved ${data.events.length} events from private calendar`);
      return data.events as GCalEvent[];
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  // Helpers for blocked time sync
  const BLOCK_SUMMARY = 'Bloqueado';
  const APP_PRIVATE = { app: 'evolution-calendar', type: 'blocked' } as const;
  const dayKeyToByDay = ['MO','TU','WE','TH','FR','SA','SU']; // 0=Lun -> MO
  const byDayToDayKey: Record<string, number> = { MO:0, TU:1, WE:2, TH:3, FR:4, SA:5, SU:6 };

  const isOurBlocked = (ev: any) => {
    const hasMarker = ev?.description?.includes('[APP:EVOLUTION][BLOCKED]');
    const hasPrivate = ev?.extendedProperties?.private?.app === 'evolution-calendar' && ev?.extendedProperties?.private?.type === 'blocked';
    return ev?.summary === BLOCK_SUMMARY && (hasMarker || hasPrivate);
  };

  const toMinutes = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  const toTime = (mins: number) => {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  };
  const expandRange = (from: string, to: string) => {
    const start = toMinutes(from);
    const end = toMinutes(to);
    const out: string[] = [];
    if (!(end > start)) return out;
    for (let t = start; t < end; t += 30) out.push(toTime(t));
    return out;
  };
  const slotsToRanges = (slots: string[]) => {
    const sorted = Array.from(new Set(slots)).sort();
    const ranges: Array<{ from: string; to: string }> = [];
    if (sorted.length === 0) return ranges;
    let start = toMinutes(sorted[0]);
    let endExclusive = start + 30;
    for (let i = 1; i < sorted.length; i++) {
      const cur = toMinutes(sorted[i]);
      if (cur === endExclusive) {
        endExclusive += 30;
      } else {
        ranges.push({ from: toTime(start), to: toTime(endExclusive) });
        start = cur;
        endExclusive = cur + 30;
      }
    }
    ranges.push({ from: toTime(start), to: toTime(endExclusive) });
    return ranges;
  };

  const nextDateForDay = (dayKey: number) => {
    const today = new Date();
    const current = (today.getDay() + 6) % 7; // convert Sun(0)..Sat(6) to Mon(0)..Sun(6)
    const diff = (dayKey - current + 7) % 7;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    return formatInTimeZone(d, MEXICO_TIMEZONE, 'yyyy-MM-dd');
  };

  const deleteEventSilently = async (eventId: string) => {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { operation: 'DELETE', calendarId, eventId },
    });
    if (error || !data?.success) {
      console.warn('Failed to delete blocked event', eventId, error || data?.error);
    }
  };
  const createEventSilently = async (eventData: any) => {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { operation: 'CREATE', calendarId, eventData },
    });
    if (error || !data?.success) {
      throw new Error(error?.message || data?.error || 'Fallo al crear evento de bloqueo');
    }
  };

  // Derivar bloques existentes desde Google para precargar el modal
  React.useEffect(() => {
    if (!events) return;
    const weekly: { [k: number]: Set<string> } = {};
    const byDate: Record<string, Set<string>> = {};

    for (const ev of events) {
      if (!isOurBlocked(ev)) continue;
      const startStr = ev.start.dateTime; const endStr = ev.end.dateTime;
      if (!startStr || !endStr) continue;
      const startTime = formatInTimeZone(new Date(startStr), MEXICO_TIMEZONE, 'HH:mm');
      const endTime = formatInTimeZone(new Date(endStr), MEXICO_TIMEZONE, 'HH:mm');
      const slots = expandRange(startTime, endTime);

      const rrule = (ev.recurrence || []).find(r => r.startsWith('RRULE:')) || '';
      const m = rrule.match(/BYDAY=([^;]+)/);
      if (m) {
        const codes = m[1].split(',');
        for (const code of codes) {
          const dk = byDayToDayKey[code];
          if (dk === undefined) continue;
          weekly[dk] = weekly[dk] || new Set<string>();
          for (const s of slots) weekly[dk].add(s);
        }
      } else {
        const dateKey = formatInTimeZone(new Date(startStr), MEXICO_TIMEZONE, 'yyyy-MM-dd');
        byDate[dateKey] = byDate[dateKey] || new Set<string>();
        for (const s of slots) byDate[dateKey].add(s);
      }
    }

    const weeklyObj: { [k: number]: string[] } = {};
    Object.entries(weekly).forEach(([k, v]) => weeklyObj[Number(k)] = Array.from(v).sort());
    const byDateObj: Record<string, string[]> = {};
    Object.entries(byDate).forEach(([k, v]) => byDateObj[k] = Array.from(v).sort());

    setBlockedWeekly(weeklyObj);
    setBlockedDates(byDateObj);
  }, [events]);

  // Event management functions
  const handleCreateEvent = async (eventData: any) => {
    setIsOperationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          operation: 'CREATE',
          calendarId,
          eventData,
        },
      });

      if (error) {
        console.error('Error creating event:', error);
        throw new Error(`Error al crear el evento: ${error.message}`);
      }

      if (!data.success) {
        console.error('Event creation failed:', data.error);
        throw new Error(data.error || "Error desconocido al crear el evento");
      }

      toast({
        title: "Evento creado",
        description: "El evento se ha creado exitosamente en tu calendario.",
      });

      // Refresh events
      queryClient.invalidateQueries({ queryKey: ["gcal-events-private", calendarId] });
    } catch (error) {
      console.error('Create event error:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleUpdateEvent = async (eventData: any) => {
    if (!editingEvent) return;
    
    setIsOperationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          operation: 'UPDATE',
          calendarId,
          eventId: editingEvent.id,
          eventData,
        },
      });

      if (error) {
        console.error('Error updating event:', error);
        throw new Error(`Error al actualizar el evento: ${error.message}`);
      }

      if (!data.success) {
        console.error('Event update failed:', data.error);
        throw new Error(data.error || "Error desconocido al actualizar el evento");
      }

      toast({
        title: "Evento actualizado",
        description: "El evento se ha actualizado exitosamente.",
      });

      // Refresh events
      queryClient.invalidateQueries({ queryKey: ["gcal-events-private", calendarId] });
    } catch (error) {
      console.error('Update event error:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteEvent = async (event: GCalEvent) => {
    setIsOperationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          operation: 'DELETE',
          calendarId,
          eventId: event.id,
        },
      });

      if (error) {
        console.error('Error deleting event:', error);
        throw new Error(`Error al eliminar el evento: ${error.message}`);
      }

      if (!data.success) {
        console.error('Event deletion failed:', data.error);
        throw new Error(data.error || "Error desconocido al eliminar el evento");
      }

      toast({
        title: "Evento eliminado",
        description: "El evento se ha eliminado exitosamente.",
      });

      // Refresh events
      queryClient.invalidateQueries({ queryKey: ["gcal-events-private", calendarId] });
    } catch (error) {
      console.error('Delete event error:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleSaveEvent = async (eventData: any) => {
    if (editingEvent) {
      await handleUpdateEvent(eventData);
    } else {
      await handleCreateEvent(eventData);
    }
  };

  const handleSaveBlockTime = async (
    blockData:
      | { mode: 'weekly'; days: { [dayKey: number]: string[] }; description?: string }
      | { mode: 'date'; date: string; times: string[]; description?: string }
  ) => {
    setIsOperationLoading(true);
    try {
      // Persistir en memoria local para UX inmediata
      if (blockData.mode === 'weekly') {
        setBlockedWeekly(blockData.days);
      } else {
        setBlockedDates((prev) => ({ ...prev, [blockData.date]: blockData.times }));
      }

      const currentEvents = events || [];

      // Eliminar bloqueos anteriores de nuestra app
      if (blockData.mode === 'weekly') {
        const toDelete = currentEvents.filter((ev) => isOurBlocked(ev) && (ev.recurrence && ev.recurrence.length > 0));
        await Promise.all(toDelete.map((ev) => deleteEventSilently(ev.id)));

        // Crear eventos recurrentes por día y rango
        for (const [dayKeyStr, slots] of Object.entries(blockData.days)) {
          if (!slots || slots.length === 0) continue;
          const ranges = slotsToRanges(slots);
          const baseDate = nextDateForDay(Number(dayKeyStr));
          const byDay = dayKeyToByDay[Number(dayKeyStr)];
          for (const r of ranges) {
            const eventData = {
              summary: BLOCK_SUMMARY,
              description: `${blockData.description || ''}${blockData.description ? '\n' : ''}[APP:EVOLUTION][BLOCKED]`,
              start: { dateTime: `${baseDate}T${r.from}:00`, timeZone: MEXICO_TIMEZONE },
              end: { dateTime: `${baseDate}T${r.to}:00`, timeZone: MEXICO_TIMEZONE },
              recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`],
              extendedProperties: { private: APP_PRIVATE },
            };
            await createEventSilently(eventData);
          }
        }
      } else {
        // Bloqueo por fecha específica
        const dateKey = blockData.date;
        const toDelete = currentEvents.filter((ev) => {
          if (!isOurBlocked(ev)) return false;
          const startStr = ev.start.dateTime || ev.start.date;
          if (!startStr) return false;
          const k = formatInTimeZone(new Date(startStr), MEXICO_TIMEZONE, 'yyyy-MM-dd');
          return k === dateKey;
        });
        await Promise.all(toDelete.map((ev) => deleteEventSilently(ev.id)));

        const ranges = slotsToRanges(blockData.times);
        for (const r of ranges) {
          const eventData = {
            summary: BLOCK_SUMMARY,
            description: `${blockData.description || ''}${blockData.description ? '\n' : ''}[APP:EVOLUTION][BLOCKED]`,
            start: { dateTime: `${dateKey}T${r.from}:00`, timeZone: MEXICO_TIMEZONE },
            end: { dateTime: `${dateKey}T${r.to}:00`, timeZone: MEXICO_TIMEZONE },
            extendedProperties: { private: APP_PRIVATE },
          };
          await createEventSilently(eventData);
        }
      }

      toast({
        title: 'Bloqueos sincronizados',
        description: 'Se actualizaron en Google Calendar.',
      });
      setShowBlockModal(false);
      queryClient.invalidateQueries({ queryKey: ["gcal-events-private", calendarId] });
    } catch (error) {
      console.error('Sync blocked times error:', error);
      toast({
        title: 'Error al sincronizar',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsOperationLoading(false);
    }
  };

  const openCreateModal = (date?: Date) => {
    setEditingEvent(null);
    if (date) {
      setSelected(date);
    }
    setShowEventModal(true);
  };

  const openEditModal = (event: GCalEvent) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleCalendarDateClick = (date: Date | undefined) => {
    setSelected(date);
    // Optional: Open create modal when clicking on a date
    // if (date) {
    //   openCreateModal(date);
    // }
  };

  const eventDates = useMemo(() => {
    if (!events) return [] as Date[];
    const set = new Set<string>();
    
    // Agregar fechas de eventos normales
    for (const ev of events) {
      const startStr = ev.start.dateTime || ev.start.date;
      if (!startStr) continue;
      
      // Usar fecha en timezone México para evitar problemas de UTC
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
    
    // Agregar fechas específicas con horarios bloqueados
    for (const dateKey in blockedDates) {
      if (blockedDates[dateKey] && blockedDates[dateKey].length > 0) {
        set.add(dateKey);
      }
    }
    
    // Agregar fechas de horarios semanales bloqueados (próximas 12 semanas)
    const today = new Date();
    for (let week = 0; week < 12; week++) {
      for (const dayKeyStr in blockedWeekly) {
        if (blockedWeekly[Number(dayKeyStr)] && blockedWeekly[Number(dayKeyStr)].length > 0) {
          const dayKey = Number(dayKeyStr);
          const current = (today.getDay() + 6) % 7; // convert Sun(0)..Sat(6) to Mon(0)..Sun(6)
          const diff = (dayKey - current + 7) % 7;
          const d = new Date(today);
          d.setDate(today.getDate() + diff + (week * 7));
          const key = formatInTimeZone(d, MEXICO_TIMEZONE, 'yyyy-MM-dd');
          set.add(key);
        }
      }
    }
    
    return Array.from(set).map((k) => new Date(k + 'T12:00:00'));
  }, [events, blockedDates, blockedWeekly]);

  const eventsOfSelectedDay = useMemo(() => {
    if (!events || !selected) return [] as GCalEvent[];
    return events.filter((ev) => {
      const startStr = ev.start.dateTime || ev.start.date;
      if (!startStr) return false;
      const d = parseISO(startStr);
      return isSameDay(d, selected);
    });
  }, [events, selected]);

  const eventsOfHoveredDay = useMemo(() => {
    if (!events || !hoveredDate) return [] as GCalEvent[];
    return events.filter((ev) => {
      const startStr = ev.start.dateTime || ev.start.date;
      if (!startStr) return false;
      const d = parseISO(startStr);
      return isSameDay(d, hoveredDate);
    });
  }, [events, hoveredDate]);

  const toggleDescriptionExpansion = (eventId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  const extractPhoneNumber = (description: string): string | null => {
    if (!description) return null;
    
    // Buscar números de teléfono mexicanos (10 dígitos o con código de país 521)
    const phonePatterns = [
      /(?:521)?(\d{10})/g,           // 10 dígitos con o sin código 521
      /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g, // Formato XXX-XXX-XXXX
      /\((\d{3})\)\s*(\d{3})[-.\s]?(\d{4})/g, // Formato (XXX) XXX-XXXX
      /Teléfono:\s*(\d+)/gi,        // Palabra "Teléfono:" seguida de número
      /Móvil:\s*(\d+)/gi,           // Palabra "Móvil:" seguida de número
    ];

    for (const pattern of phonePatterns) {
      const matches = description.match(pattern);
      if (matches && matches[0]) {
        // Limpiar el número (solo dígitos)
        const cleanNumber = matches[0].replace(/\D/g, '');
        if (cleanNumber.length >= 10) {
          return cleanNumber;
        }
      }
    }
    
    return null;
  };

  const checkNotificationStatus = (description: string): { hasNotification: boolean; date?: string; isRescheduled: boolean } => {
    if (!description) return { hasNotification: false, isRescheduled: false };
    
    // Buscar diferentes patrones de notificación con fechas
    const notificationPatterns = [
      /\[NOTIFICACIÓN ENVIADA POR AGENTE WORKFLOW:\s*([^\]]+)\]/i,
      /RECORDATORIO ENVIADO[:\s]*([^\n\r]*)/i,
      /NOTIFICACIÓN ENVIADA[:\s]*([^\n\r]*)/i
    ];
    
    let hasNotification = false;
    let date = '';
    
    for (const pattern of notificationPatterns) {
      const match = description.match(pattern);
      if (match) {
        hasNotification = true;
        if (match[1] && match[1].trim()) {
          // Limpiar la fecha capturada de caracteres extra
          date = match[1].trim().replace(/[^\w\s/:,-]/g, '').trim();
          // Si la fecha está vacía después de limpiar, usar "Enviado"
          if (!date) {
            date = 'Enviado';
          }
        } else {
          date = 'Enviado';
        }
        break;
      }
    }
    
    // Buscar si fue reagendada
    const rescheduledPattern = /reagendad[oa]/i;
    const isRescheduled = rescheduledPattern.test(description);
    
    return { hasNotification, date, isRescheduled };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
      <div className="rounded-lg border p-3 relative">
        <Calendar
          mode="single"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={selected}
          onSelect={handleCalendarDateClick}
          onDayMouseEnter={(date: Date | undefined) => setHoveredDate(date)}
          onDayMouseLeave={() => setHoveredDate(undefined)}
          modifiers={{ event: eventDates }}
          modifiersClassNames={{
            event: "bg-muted/80 text-muted-foreground rounded-md",
          }}
          showOutsideDays
        />
        {hoveredDate && eventsOfHoveredDay.length > 0 && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 max-h-48 bg-popover border rounded-lg shadow-lg z-20 p-2 overflow-y-auto pointer-events-none">
            <div className="text-xs font-medium mb-2 text-muted-foreground">
              Eventos del {hoveredDate.toLocaleDateString('es-MX')}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {eventsOfHoveredDay.map((ev) => {
                const startStr = ev.start.dateTime || ev.start.date;
                const isAllDay = Boolean(ev.start.date && ev.end.date);
                const startTime = startStr
                  ? formatInTimeZone(new Date(startStr), MEXICO_TIMEZONE, "HH:mm")
                  : "";
                return (
                  <div key={ev.id} className="text-[10px] font-medium bg-muted/50 rounded px-2 py-1">
                    {isAllDay ? "Todo el día" : startTime} • {ev.summary || "(Sin título)"}
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowBlockModal(true)}
              disabled={isOperationLoading}
            >
              <Lock className="h-4 w-4" />
              Bloquear horarios
            </Button>
            <CreateEventButton 
              onClick={() => openCreateModal(selected)} 
              disabled={isOperationLoading}
            />
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">
            {(error as Error).message}
          </p>
        )}

        {!isLoading && !error && eventsOfSelectedDay.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay eventos para este día.</p>
        )}

        <ul className="space-y-3">
          {eventsOfSelectedDay.map((ev) => {
            const phoneNumber = extractPhoneNumber(ev.description || '');
            const notificationStatus = checkNotificationStatus(ev.description || '');
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
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium leading-none">
                        {ev.summary || "(Sin título)"}
                      </p>
                        <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                          📱 {phoneNumber || "s/n teléfono"}
                        </div>
                    </div>
                      {(phoneNumber || notificationStatus.isRescheduled) && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1">
                            {phoneNumber && (
                              <>
                                {notificationStatus.hasNotification ? (
                                  <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                    <Check size={12} />
                                    {notificationStatus.date}
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                    <X size={12} />
                                    {"Sin notificar"}
                                  </div>
                                )}
                              </>
                            )}
                            {notificationStatus.isRescheduled && (
                              <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                <Check size={12} />
                                {"Reagendada"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    {ev.description && (
                      <div className="mt-1">
                        <p 
                          className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => {
                            const newExpanded = new Set(expandedDescriptions);
                            if (newExpanded.has(ev.id)) {
                              newExpanded.delete(ev.id);
                            } else {
                              newExpanded.add(ev.id);
                            }
                            setExpandedDescriptions(newExpanded);
                          }}
                        >
                          {expandedDescriptions.has(ev.id) 
                            ? ev.description 
                            : truncateDescription(ev.description, 140)
                          }
                          {!expandedDescriptions.has(ev.id) && ev.description.length > 140 && (
                            <span className="text-primary ml-1 font-medium">...ver más</span>
                          )}
                          {expandedDescriptions.has(ev.id) && (
                            <span className="text-primary ml-1 font-medium">ver menos</span>
                          )}
                        </p>
                      </div>
                    )}
                    {ev.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ev.location}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {isAllDay ? "Todo el día" : `${startTime} - ${endTime}`}
                    </span>
                    <EventActions
                      onEdit={() => openEditModal(ev)}
                      onDelete={() => handleDeleteEvent(ev)}
                      isDeleting={isOperationLoading}
                    />
                  </div>
                </div>
                <a
                  href={`https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Ver en Google Calendar
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <EventModal
        open={showEventModal}
        onOpenChange={(open) => {
          setShowEventModal(open);
          if (!open) {
            setEditingEvent(null);
          }
        }}
        onSave={handleSaveEvent}
        selectedDate={selected}
        editingEvent={editingEvent}
        isLoading={isOperationLoading}
      />

      <BlockTimeModal
        open={showBlockModal}
        onOpenChange={setShowBlockModal}
        onSave={handleSaveBlockTime}
        selectedDate={selected}
        isLoading={isOperationLoading}
        initialWeeklyDays={blockedWeekly}
        initialDateTimes={selected ? { 
          date: formatInTimeZone(selected, MEXICO_TIMEZONE, 'yyyy-MM-dd'), 
          times: blockedDates[formatInTimeZone(selected, MEXICO_TIMEZONE, 'yyyy-MM-dd')] || []
        } : undefined}
      />

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
              const phoneNumber = extractPhoneNumber(ev.description || '');
              const notificationStatus = checkNotificationStatus(ev.description || '');
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
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-xl font-bold text-foreground">
                        {ev.summary || "(Sin título)"}
                      </h4>
                      <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                            📱 {phoneNumber || "s/n teléfono"}
                          </div>
                        {phoneNumber && (
                          <>
                            {notificationStatus.hasNotification ? (
                              <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                <Check size={14} />
                                {notificationStatus.date}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                <X size={14} />
                                {"Sin notificar"}
                              </div>
                            )}
                          </>
                        )}
                        {notificationStatus.isRescheduled && (
                          <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            <Check size={14} />
                            {"Reagendada"}
                          </div>
                        )}
                      </div>
                    </div>
                      
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
                    
                    <div className="flex-shrink-0">
                      <EventActions
                        onEdit={() => {
                          setShowDayEventsModal(false);
                          openEditModal(ev);
                        }}
                        onDelete={() => {
                          setShowDayEventsModal(false);
                          handleDeleteEvent(ev);
                        }}
                        isDeleting={isOperationLoading}
                      />
                    </div>
                  </div>
                  
                  {ev.description && (
                    <div className="pt-3 border-t border-border">
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {expandedDescriptions.has(ev.id) 
                            ? ev.description 
                            : truncateDescription(ev.description, 150)}
                        </p>
                        {ev.description.length > 150 && (
                          <button
                            onClick={() => toggleDescriptionExpansion(ev.id)}
                            className="text-primary hover:text-primary/80 text-xs font-medium mt-2 transition-colors"
                          >
                            {expandedDescriptions.has(ev.id) ? "Ver menos" : "Ver más"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-border">
                    <a
                      href={`https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      🔗 Ver en Google Calendar
                    </a>
                  </div>
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
