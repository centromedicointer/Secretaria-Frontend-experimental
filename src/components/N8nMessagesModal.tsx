
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { formatDateTimeInMexicoTime } from '@/lib/dateUtils';
import { N8nMessagesFilters } from './N8nMessagesFilters';
import { N8nMessagesTable } from './N8nMessagesTable';

interface N8nMessage {
  id: string;
  nombre?: string;
  phone_number: string;
  pregunta: string;
  respuesta?: string;
  fecha_recibido?: string;
  fecha_respuesta?: string;
  id_pregunta?: string;
  id_respuesta?: string;
}

interface N8nMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const N8nMessagesModal: React.FC<N8nMessagesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchQuestion, setSearchQuestion] = useState('');
  const [searchAnswer, setSearchAnswer] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: rawMessages, isLoading } = useQuery({
    queryKey: ['n8n-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_mensajes')
        .select('*')
        .order('fecha_recibido', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
    refetchInterval: 30000,
  });

  // Convert the raw data to match our interface
  const messages: N8nMessage[] = useMemo(() => {
    if (!rawMessages) return [];
    
    return rawMessages.map(msg => ({
      ...msg,
      id: msg.id.toString(), // Convert number to string
    }));
  }, [rawMessages]);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];

    return messages.filter((message) => {
      const nameMatch = !searchName || 
        (message.nombre && message.nombre.toLowerCase().includes(searchName.toLowerCase()));
      
      const phoneMatch = !searchPhone || 
        message.phone_number.includes(searchPhone);
      
      const dateMatch = !searchDate || 
        (message.fecha_recibido && formatDateTimeInMexicoTime(message.fecha_recibido).includes(searchDate)) ||
        (message.fecha_respuesta && formatDateTimeInMexicoTime(message.fecha_respuesta).includes(searchDate));
      
      const questionMatch = !searchQuestion || 
        (message.pregunta && message.pregunta.toLowerCase().includes(searchQuestion.toLowerCase()));
      
      const answerMatch = !searchAnswer || 
        (message.respuesta && message.respuesta.toLowerCase().includes(searchAnswer.toLowerCase()));

      return nameMatch && phoneMatch && dateMatch && questionMatch && answerMatch;
    });
  }, [messages, searchName, searchPhone, searchDate, searchQuestion, searchAnswer]);

  const clearAllFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchDate('');
    setSearchQuestion('');
    setSearchAnswer('');
  };

  const hasActiveFilters = Boolean(searchName || searchPhone || searchDate || searchQuestion || searchAnswer);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensajes N8n - Preguntas y Respuestas
          </DialogTitle>
        </DialogHeader>

        <N8nMessagesFilters
          searchName={searchName}
          setSearchName={setSearchName}
          searchPhone={searchPhone}
          setSearchPhone={setSearchPhone}
          searchDate={searchDate}
          setSearchDate={setSearchDate}
          searchQuestion={searchQuestion}
          setSearchQuestion={setSearchQuestion}
          searchAnswer={searchAnswer}
          setSearchAnswer={setSearchAnswer}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          clearAllFilters={clearAllFilters}
          filteredCount={filteredMessages.length}
          totalCount={messages?.length || 0}
        />

        <ScrollArea className="h-[60vh]">
          <N8nMessagesTable
            messages={filteredMessages}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            clearAllFilters={clearAllFilters}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
