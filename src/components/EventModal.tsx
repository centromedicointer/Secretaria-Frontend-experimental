import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatInTimeZone } from "date-fns-tz";

const MEXICO_TIMEZONE = 'America/Mexico_City';

// Generate time options with 30-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      options.push({ value: timeString, label: displayTime });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
}

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventData: any) => Promise<void>;
  selectedDate?: Date;
  editingEvent?: GCalEvent | null;
  isLoading?: boolean;
}

const eventSchema = z.object({
  summary: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  startDate: z.string().min(1, "La fecha es obligatoria"),
  startTime: z.string().min(1, "La hora es obligatoria"),
});

type EventFormData = z.infer<typeof eventSchema>;

export const EventModal: React.FC<EventModalProps> = ({
  open,
  onOpenChange,
  onSave,
  selectedDate,
  editingEvent,
  isLoading = false,
}) => {
  const isEditing = !!editingEvent;
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      summary: "",
      description: "",
      startDate: "",
      startTime: "09:00",
    },
  });

  // Reset form when modal opens/closes or editing event changes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      return;
    }

    if (isEditing && editingEvent) {
      const startStr = editingEvent.start.dateTime || editingEvent.start.date;
      const isAllDay = Boolean(editingEvent.start.date);

      form.reset({
        summary: editingEvent.summary || "",
        description: editingEvent.description || "",
        startDate: startStr ? startStr.slice(0, 10) : "",
        startTime: startStr && !isAllDay ? startStr.slice(11, 16) : "09:00",
      });
    } else if (selectedDate) {
      const dateStr = formatInTimeZone(selectedDate, MEXICO_TIMEZONE, 'yyyy-MM-dd');
      form.reset({
        summary: "",
        description: "",
        startDate: dateStr,
        startTime: "09:00",
      });
    }
  }, [open, isEditing, editingEvent, selectedDate, form]);

  // Auto-calculate end time (always 30 minutes after start time)
  const calculateEndDateTime = (startDate: string, startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    let endHours = hours;
    let endMinutes = minutes + 30;
    let endDate = startDate;
    
    if (endMinutes >= 60) {
      endHours += 1;
      endMinutes -= 60;
    }
    
    // Handle day overflow
    if (endHours >= 24) {
      endHours = 0;
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      endDate = nextDay.toISOString().slice(0, 10);
    }
    
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    return { endDate, endTime };
  };

  const handleSubmit = async (data: EventFormData) => {
    try {
      const { endDate, endTime } = calculateEndDateTime(data.startDate, data.startTime);
      const startDateTime = `${data.startDate}T${data.startTime}:00`;
      const endDateTime = `${endDate}T${endTime}:00`;

      const eventData = {
        summary: data.summary,
        description: data.description || undefined,
        location: "Avenida 25 Oriente #30", // Fixed location
        start: { 
          dateTime: startDateTime, 
          timeZone: MEXICO_TIMEZONE 
        },
        end: { 
          dateTime: endDateTime, 
          timeZone: MEXICO_TIMEZONE 
        },
      };

      await onSave(eventData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Evento" : "Agendar Consulta"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica los detalles del evento"
              : "Completa los detalles para crear un nuevo evento en tu calendario"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Título del evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción del evento (opcional)"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Ubicación:</span> Avenida 25 Oriente #30
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de inicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona hora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Duración:</span> 30 minutos
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (isEditing ? "Actualizando..." : "Agendando...") 
                : (isEditing ? "Actualizar" : "Agendar Consulta")
              }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};