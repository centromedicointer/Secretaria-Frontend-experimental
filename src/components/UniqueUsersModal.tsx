import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Phone, MessageSquare, Calendar } from 'lucide-react';
import { formatDateTimeInMexicoTime } from '@/lib/dateUtils';

interface UniqueUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
}

export const UniqueUsersModal = ({ isOpen, onClose, selectedDate }: UniqueUsersModalProps) => {
  const targetDate = selectedDate || new Date().toISOString().split('T')[0];
  
  const { data: uniqueUsers, isLoading } = useQuery({
    queryKey: ['unique-users', targetDate],
    queryFn: async () => {
      const startOfDay = `${targetDate}T00:00:00`;
      const endOfDay = `${targetDate}T23:59:59`;
      
      const { data, error } = await supabase
        .from('n8n_mensajes')
        .select('phone_number, nombre, fecha_recibido')
        .gte('fecha_recibido', startOfDay)
        .lte('fecha_recibido', endOfDay)
        .order('fecha_recibido', { ascending: false });

      if (error) throw error;
      
      // Group by phone number to get unique users
      const userMap = new Map();
      data?.forEach(message => {
        const phone = message.phone_number;
        if (!userMap.has(phone)) {
          userMap.set(phone, {
            phone_number: phone,
            nombre: message.nombre || 'Usuario sin nombre',
            first_message: message.fecha_recibido,
            message_count: 1
          });
        } else {
          const existing = userMap.get(phone);
          existing.message_count += 1;
          // Keep the earliest message time
          if (message.fecha_recibido < existing.first_message) {
            existing.first_message = message.fecha_recibido;
          }
        }
      });
      
      return Array.from(userMap.values()).sort((a, b) => 
        new Date(b.first_message).getTime() - new Date(a.first_message).getTime()
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Usuarios Únicos del {formatDate(targetDate)}
            {uniqueUsers && (
              <span className="text-sm font-normal text-muted-foreground">
                ({uniqueUsers.length} usuarios)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Cargando usuarios...</p>
            </div>
          ) : uniqueUsers && uniqueUsers.length > 0 ? (
            <div className="space-y-3">
              {uniqueUsers.map((user, index) => (
                <Card key={user.phone_number} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              {user.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone_number}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <MessageSquare className="h-3 w-3" />
                          {user.message_count} mensaje{user.message_count !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDateTimeInMexicoTime(user.first_message)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
              <p className="text-sm text-muted-foreground">
                No se encontraron usuarios únicos para el {formatDate(targetDate)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
