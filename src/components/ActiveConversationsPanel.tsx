import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, User } from 'lucide-react';

const ActiveConversationsPanel = () => {
  const { data: activeChats, isLoading } = useQuery({
    queryKey: ['activeChats'],
    queryFn: async () => {
      // Get recent messages from n8n_mensajes table
      const { data: messages } = await supabase
        .from('n8n_mensajes')
        .select('*')
        .order('fecha_recibido', { ascending: false })
        .limit(10);

      return messages || [];
    },
    refetchInterval: 5000,
  });

  const getTimeSince = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversaciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversaciones Recientes ({activeChats?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeChats?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay conversaciones recientes
            </p>
          ) : (
            activeChats?.map((message) => (
              <div
                key={message.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {message.nombre || 'Usuario Anónimo'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    WhatsApp
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{message.phone_number}</span>
                </div>
                
                <div className="text-sm">
                  <p className="text-muted-foreground truncate">
                    {message.pregunta ? message.pregunta.substring(0, 80) + '...' : 'Sin mensaje'}
                  </p>
                </div>
                
                {message.fecha_recibido && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Recibido: {getTimeSince(message.fecha_recibido)}
                    </span>
                    {message.fecha_respuesta && (
                      <span>• Respondido: {getTimeSince(message.fecha_respuesta)}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveConversationsPanel;