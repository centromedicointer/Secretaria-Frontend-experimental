
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, MessageSquare, Bot } from 'lucide-react';
import { formatDateTimeInMexicoTime } from '@/lib/dateUtils';

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

interface N8nMessageRowProps {
  message: N8nMessage;
}

export const N8nMessageRow: React.FC<N8nMessageRowProps> = ({ message }) => {
  // Logs detallados para debugging
  console.log('Raw fecha_recibido:', message.fecha_recibido);
  if (message.fecha_recibido) {
    const utcDate = new Date(message.fecha_recibido + (message.fecha_recibido.endsWith('Z') ? '' : 'Z'));
    console.log('UTC Date object:', utcDate);
    console.log('UTC time in milliseconds:', utcDate.getTime());
    console.log('Formatted fecha_recibido:', formatDateTimeInMexicoTime(message.fecha_recibido));
  }
  
  console.log('Raw fecha_respuesta:', message.fecha_respuesta);
  if (message.fecha_respuesta) {
    const utcDate = new Date(message.fecha_respuesta + (message.fecha_respuesta.endsWith('Z') ? '' : 'Z'));
    console.log('UTC Date object (respuesta):', utcDate);
    console.log('Formatted fecha_respuesta:', formatDateTimeInMexicoTime(message.fecha_respuesta));
  }

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          <span className="font-medium">
            {message.nombre || 'Usuario'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm">
          {message.phone_number}
        </span>
      </TableCell>
      <TableCell>
        <div className="max-w-md">
          <div className="flex items-start gap-2 mb-1">
            <MessageSquare className="h-4 w-4 text-green-600 mt-0.5" />
            <span className="text-sm">
              {message.pregunta}
            </span>
          </div>
          {message.id_pregunta && (
            <Badge variant="outline" className="text-xs">
              ID: {message.id_pregunta}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-md">
          {message.respuesta ? (
            <>
              <div className="flex items-start gap-2 mb-1">
                <Bot className="h-4 w-4 text-purple-600 mt-0.5" />
                <span className="text-sm">
                  {message.respuesta}
                </span>
              </div>
              {message.id_respuesta && (
                <Badge variant="outline" className="text-xs">
                  ID: {message.id_respuesta}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-sm">
              Sin respuesta
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">
          {message.fecha_recibido
            ? formatDateTimeInMexicoTime(message.fecha_recibido)
            : 'N/A'}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm">
          {message.fecha_respuesta
            ? formatDateTimeInMexicoTime(message.fecha_respuesta)
            : 'N/A'}
        </span>
      </TableCell>
    </TableRow>
  );
};
