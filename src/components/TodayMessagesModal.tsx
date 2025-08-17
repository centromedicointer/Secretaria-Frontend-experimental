import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, User, Phone, Clock } from 'lucide-react';
import { formatDateTimeInMexicoTime } from '@/lib/dateUtils';

interface TodayMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
}

export const TodayMessagesModal = ({ isOpen, onClose, selectedDate }: TodayMessagesModalProps) => {
  const targetDate = selectedDate || new Date().toISOString().split('T')[0];
  
  const { data: todayMessages, isLoading } = useQuery({
    queryKey: ['today-messages', targetDate],
    queryFn: async () => {
      const startOfDay = `${targetDate}T00:00:00`;
      const endOfDay = `${targetDate}T23:59:59`;
      
      const { data, error } = await supabase
        .from('n8n_mensajes')
        .select('*')
        .gte('fecha_recibido', startOfDay)
        .lte('fecha_recibido', endOfDay)
        .order('fecha_recibido', { ascending: false });

      if (error) throw error;
      return data || [];
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Mensajes del {formatDate(targetDate)}
            {todayMessages && (
              <span className="text-sm font-normal text-muted-foreground">
                ({todayMessages.length} mensajes)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Cargando mensajes...</p>
            </div>
          ) : todayMessages && todayMessages.length > 0 ? (
            <div className="space-y-3">
              {todayMessages.map((message) => (
                <Card key={message.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm">
                            {message.nombre || 'Usuario sin nombre'}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {message.phone_number}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                            <p className="text-sm text-gray-700 font-medium mb-1">Pregunta:</p>
                            <p className="text-sm text-gray-900">{message.pregunta}</p>
                          </div>
                          
                          {message.respuesta && (
                            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                              <p className="text-sm text-gray-700 font-medium mb-1">Respuesta:</p>
                              <p className="text-sm text-gray-900">{message.respuesta}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Recibido: {formatDateTimeInMexicoTime(message.fecha_recibido)}
                        </div>
                        {message.fecha_respuesta && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Clock className="h-3 w-3" />
                            Respondido: {formatDateTimeInMexicoTime(message.fecha_respuesta)}
                          </div>
                        )}
                        {!message.fecha_respuesta && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Sin respuesta
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h3>
              <p className="text-sm text-muted-foreground">
                No se encontraron mensajes para el {formatDate(targetDate)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};