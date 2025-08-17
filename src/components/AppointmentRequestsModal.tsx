import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Phone, User, MessageSquare, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDateTimeInMexicoTime } from '@/lib/dateUtils';
import { Badge } from '@/components/ui/badge';

interface AppointmentRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
}

export const AppointmentRequestsModal = ({ isOpen, onClose, selectedDate }: AppointmentRequestsModalProps) => {
  const targetDate = selectedDate || new Date().toISOString().split('T')[0];
  
  // Helper function to normalize phone numbers
  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleanNumber = phone.replace(/\D/g, '');
    
    // If it starts with 521, remove it (Mexico country code)
    if (cleanNumber.startsWith('521') && cleanNumber.length === 13) {
      return cleanNumber.substring(3);
    }
    
    // If it starts with 52, remove it 
    if (cleanNumber.startsWith('52') && cleanNumber.length === 12) {
      return cleanNumber.substring(2);
    }
    
    // Return the last 10 digits (Mexican phone format)
    return cleanNumber.length > 10 ? cleanNumber.slice(-10) : cleanNumber;
  };

  const { data: appointmentRequests, isLoading } = useQuery({
    queryKey: ['appointment-requests', targetDate],
    queryFn: async () => {
      // Get messages from the last 7 days instead of just one day
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString();
      
      // Get ALL messages from the last 7 days
      const { data: allMessages, error } = await supabase
        .from('n8n_mensajes')
        .select('*')
        .gte('fecha_recibido', startDate)
        .order('fecha_recibido', { ascending: true });

      if (error) throw error;
      
      // Find unique phone numbers that mentioned "cita"
      const phoneNumbersWithCita = new Set();
      const citaMessagesByPhone = new Map();
      
      (allMessages || []).forEach(message => {
        if (message.pregunta?.toLowerCase().includes('cita')) {
          phoneNumbersWithCita.add(message.phone_number);
          if (!citaMessagesByPhone.has(message.phone_number)) {
            citaMessagesByPhone.set(message.phone_number, []);
          }
          citaMessagesByPhone.get(message.phone_number).push(message);
        }
      });

      if (phoneNumbersWithCita.size === 0) {
        return [];
      }

      // For each phone number that mentioned "cita", get their complete conversation
      const requestsWithStatus = await Promise.all(
        Array.from(phoneNumbersWithCita).map(async (phone: string) => {
          const citaMessages = citaMessagesByPhone.get(phone) || [];
          const firstCitaMessage = citaMessages[0]; // Most recent cita message
          
          // Get ALL messages from this phone number for the entire day
          const dayMessages = (allMessages || []).filter(msg => msg.phone_number === phone);
          
          // Log para debugging
          console.log(`Procesando teléfono: ${phone}, nombre: ${firstCitaMessage?.nombre}`);
          
          // Normalize phone number for appointment lookup
          const normalizedPhone = normalizePhoneNumber(phone);
          console.log(`Teléfono normalizado: ${normalizedPhone}`);
          
          // Check if there's an appointment for this phone number (try both formats)
          let appointment = null;
          
          // First try with original phone format
          const { data: appointment1 } = await supabase
            .from('appointments')
            .select('*')
            .eq('telefono', phone)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          console.log(`Búsqueda con teléfono original (${phone}):`, appointment1);
          
          // If not found, try with normalized phone
          if (!appointment1) {
            const { data: appointment2 } = await supabase
              .from('appointments')
              .select('*')
              .eq('telefono', normalizedPhone)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            appointment = appointment2;
            console.log(`Búsqueda con teléfono normalizado (${normalizedPhone}):`, appointment2);
          } else {
            appointment = appointment1;
          }
          
          // Also try variations with country codes and other formats
          if (!appointment) {
            const phoneVariations = [
              `521${normalizedPhone}`, // With Mexico code
              `52${normalizedPhone}`,  // With country code only
              `+521${normalizedPhone}`, // With + prefix
              `+52${normalizedPhone}`,   // With + and country code
              normalizedPhone.startsWith('9') ? `1${normalizedPhone}` : null, // Add 1 prefix if starts with 9
              phone.replace(/\s+/g, ''), // Remove spaces
              phone.replace(/\D/g, ''), // Only digits
            ].filter(Boolean);
            
            console.log(`Variaciones de teléfono para ${phone}:`, phoneVariations);
            
            for (const phoneVar of phoneVariations) {
              const { data: appointmentVar } = await supabase
                .from('appointments')
                .select('*')
                .eq('telefono', phoneVar)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              console.log(`Búsqueda con variación (${phoneVar}):`, appointmentVar);
              
              if (appointmentVar) {
                appointment = appointmentVar;
                console.log(`✅ ENCONTRADA cita para ${phone} usando variación: ${phoneVar}`);
                break;
              }
            }
          }
          
          // Si aún no encuentra, buscar por nombre del paciente en appointments
          if (!appointment && firstCitaMessage?.nombre) {
            const nombreLimpio = firstCitaMessage.nombre.trim().toLowerCase();
            const { data: appointmentByName, error } = await supabase
              .from('appointments')
              .select('*')
              .ilike('paciente', `%${nombreLimpio}%`)
              .order('created_at', { ascending: false })
              .limit(5);
              
            console.log(`Búsqueda por nombre (${nombreLimpio}):`, appointmentByName);
            
            if (appointmentByName && appointmentByName.length > 0) {
              // Tomar la cita más reciente que coincida por nombre
              appointment = appointmentByName[0];
              console.log(`✅ ENCONTRADA cita por nombre para ${firstCitaMessage.nombre}:`, appointment);
            }
          }

          // Check if there are multiple appointments (indicates rescheduling) - use same logic
          let allAppointments = [];
          const appointmentQueries = [
            phone,
            normalizedPhone,
            `521${normalizedPhone}`,
            `52${normalizedPhone}`,
            `+521${normalizedPhone}`,
            `+52${normalizedPhone}`
          ];
          
          for (const phoneQuery of appointmentQueries) {
            const { data: apps } = await supabase
              .from('appointments')
              .select('*')
              .eq('telefono', phoneQuery)
              .order('created_at', { ascending: false });
            
            if (apps && apps.length > 0) {
              allAppointments = apps;
              break;
            }
          }

          // Check for notifications sent to this phone
          const { data: notifications } = await supabase
            .from('n8n_logs_notificaciones')
            .select('*')
            .eq('telefono', phone)
            .gte('fecha_notificacion', startDate);

          // Find the conversation flow - start from first message of the day until last message
          const conversationFlow = dayMessages.sort((a, b) => 
            new Date(a.fecha_recibido).getTime() - new Date(b.fecha_recibido).getTime()
          );

          const result = {
            ...firstCitaMessage,
            appointment: appointment,
            allAppointments: allAppointments || [],
            notifications: notifications || [],
            conversation: conversationFlow,
            citaMessages: citaMessages,
            totalMessages: dayMessages.length,
            hasAppointment: !!appointment,
            isRescheduled: (allAppointments?.length || 0) > 1,
            hasNotification: (notifications?.length || 0) > 0,
            appointmentStatus: appointment?.estado || 'sin_cita'
          };
          
          console.log(`Resultado para ${phone}:`, {
            hasAppointment: result.hasAppointment,
            appointmentStatus: result.appointmentStatus,
            appointment: appointment
          });
          
          return result;
        })
      );

      return requestsWithStatus.sort((a, b) => 
        new Date(b.fecha_recibido).getTime() - new Date(a.fecha_recibido).getTime()
      );
    },
    enabled: isOpen,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string, hasAppointment: boolean) => {
    if (!hasAppointment) {
      return <Badge variant="destructive">Sin cita agendada</Badge>;
    }
    
    switch (status) {
      case 'pendiente_confirmacion':
        return <Badge variant="secondary">Pendiente confirmación</Badge>;
      case 'confirmada':
      case 'confirmado':
        return <Badge variant="default">Confirmada</Badge>;
      case 'cancelada':
      case 'cancelado':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Cancelada</Badge>;
      case 'reagendado':
        return <Badge variant="outline" className="border-amber-200 text-amber-800">Reagendada</Badge>;
      case 'completada':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completada</Badge>;
      default:
        return <Badge variant="outline">Estado: {status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Análisis de Solicitudes de Cita (últimos 7 días)
            {appointmentRequests && (
              <span className="text-sm font-normal text-muted-foreground">
                ({appointmentRequests.length} total)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Cargando solicitudes...</p>
            </div>
          ) : appointmentRequests && appointmentRequests.length > 0 ? (
            <div className="space-y-6">
              {/* Citas Agendadas */}
              {(() => {
                const citasAgendadas = appointmentRequests.filter(req => req.hasAppointment);
                return citasAgendadas.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-green-200">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-green-800">
                        Citas Agendadas ({citasAgendadas.length})
                      </h3>
                      <span className="text-sm text-green-600">
                        ✓ Solicitud procesada exitosamente
                      </span>
                    </div>
                    {citasAgendadas.map((request) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-400">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">
                                    {request.nombre || 'Usuario sin nombre'}
                                  </span>
                                  {getStatusBadge(request.appointmentStatus, request.hasAppointment)}
                                </div>
                                
                                {/* Fecha de la Cita - Prominente */}
                                {request.appointment && (
                                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Calendar className="h-4 w-4 text-green-600" />
                                      <span className="font-semibold text-green-900">Cita Agendada:</span>
                                    </div>
                                    <div className="text-lg font-bold text-green-800">
                                      {formatDateTimeInMexicoTime(request.appointment.fecha_original)}
                                    </div>
                                    <div className="text-sm text-green-700">
                                      Paciente: {request.appointment.paciente}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Additional Status Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {/* Phone Badge */}
                                  <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                                    📱 {request.phone_number}
                                  </div>
                                  
                                  {/* Notification Badge */}
                                  <Badge 
                                    variant={request.hasNotification ? "default" : "destructive"} 
                                    className={`text-xs ${request.hasNotification 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-red-100 text-red-800 border-red-200'}`}
                                  >
                                    {request.hasNotification ? '✓ Notificación enviada' : '✗ Sin notificación'}
                                  </Badge>
                                  
                                  {/* Rescheduled Badge */}
                                  {request.isRescheduled && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                                      🔄 Reagendada ({request.allAppointments.length} citas)
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDateTimeInMexicoTime(request.fecha_recibido)}
                              </div>
                            </div>
                          </div>

                          {/* Conversation Context */}
                          {request.conversation && request.conversation.length > 1 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Conversación ({request.conversation.length} mensajes)
                              </h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                                {request.conversation.map((msg, index) => (
                                  <div key={msg.id} className="text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-gray-500">
                                        {formatDateTimeInMexicoTime(msg.fecha_recibido)}
                                      </span>
                                      {msg.pregunta.toLowerCase().includes('cita') && (
                                        <Badge variant="outline" className="text-xs">Menciona cita</Badge>
                                      )}
                                    </div>
                                    <div className="bg-white p-2 rounded border-l-2 border-green-300">
                                      <p className="text-gray-800">{msg.pregunta}</p>
                                      {msg.respuesta && (
                                        <div className="mt-2 p-2 bg-green-50 rounded text-green-800 border-l-2 border-green-300">
                                          <p className="text-xs font-medium mb-1">Respuesta:</p>
                                          <p>{msg.respuesta}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Solicitudes Sin Agendar */}
              {(() => {
                const solicitudesSinAgendar = appointmentRequests.filter(req => !req.hasAppointment);
                return solicitudesSinAgendar.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-red-200">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-red-800">
                        Solicitudes Sin Agendar ({solicitudesSinAgendar.length})
                      </h3>
                      <span className="text-sm text-red-600">
                        ⚠️ Requieren atención
                      </span>
                    </div>
                    {solicitudesSinAgendar.map((request) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-400">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-red-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">
                                    {request.nombre || 'Usuario sin nombre'}
                                  </span>
                                  {getStatusBadge(request.appointmentStatus, request.hasAppointment)}
                                </div>
                                
                                {/* Alerta de Sin Cita */}
                                <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="font-semibold text-red-900">Sin cita agendada</span>
                                  </div>
                                  <div className="text-sm text-red-700">
                                    El paciente solicitó una cita pero no se procesó la solicitud
                                  </div>
                                </div>
                                
                                {/* Additional Status Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {/* Phone Badge */}
                                  <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                                    📱 {request.phone_number}
                                  </div>
                                  
                                  {/* Notification Badge */}
                                  <Badge 
                                    variant={request.hasNotification ? "default" : "destructive"} 
                                    className={`text-xs ${request.hasNotification 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-red-100 text-red-800 border-red-200'}`}
                                  >
                                    {request.hasNotification ? '✓ Notificación enviada' : '✗ Sin notificación'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDateTimeInMexicoTime(request.fecha_recibido)}
                              </div>
                            </div>
                          </div>

                          {/* Conversation Context */}
                          {request.conversation && request.conversation.length > 1 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Conversación ({request.conversation.length} mensajes)
                              </h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                                {request.conversation.map((msg, index) => (
                                  <div key={msg.id} className="text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-gray-500">
                                        {formatDateTimeInMexicoTime(msg.fecha_recibido)}
                                      </span>
                                      {msg.pregunta.toLowerCase().includes('cita') && (
                                        <Badge variant="outline" className="text-xs">Menciona cita</Badge>
                                      )}
                                    </div>
                                    <div className="bg-white p-2 rounded border-l-2 border-red-300">
                                      <p className="text-gray-800">{msg.pregunta}</p>
                                      {msg.respuesta && (
                                        <div className="mt-2 p-2 bg-red-50 rounded text-red-800 border-l-2 border-red-300">
                                          <p className="text-xs font-medium mb-1">Respuesta:</p>
                                          <p>{msg.respuesta}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes de cita</h3>
              <p className="text-sm text-muted-foreground">
                No se encontraron solicitudes de cita en los últimos 7 días
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};