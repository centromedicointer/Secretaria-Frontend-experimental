
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { N8nMessageRow } from './N8nMessageRow';

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

interface N8nMessagesTableProps {
  messages: N8nMessage[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
}

export const N8nMessagesTable: React.FC<N8nMessagesTableProps> = ({
  messages,
  isLoading,
  hasActiveFilters,
  clearAllFilters,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Pregunta</TableHead>
          <TableHead>Respuesta</TableHead>
          <TableHead>Fecha Pregunta</TableHead>
          <TableHead>Fecha Respuesta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages?.map((message) => (
          <N8nMessageRow key={message.id} message={message} />
        ))}
        {(!messages || messages.length === 0) && !isLoading && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <div className="text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {hasActiveFilters 
                    ? 'No se encontraron mensajes con los filtros aplicados' 
                    : 'No hay mensajes disponibles'
                  }
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="mt-2"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
