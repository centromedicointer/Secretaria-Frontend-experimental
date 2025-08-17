import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PhoneSearchInput } from './PhoneSearchInput';
import { formatDateTimeInMexicoTime } from '@/lib/dateUtils';

export const ClientControlTable = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: clientControlData, isLoading, refetch } = useQuery({
    queryKey: ['client-control-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_control')
        .select('*')
        .eq('bot_active', false)
        .order('last_interaction', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  const filteredData = useMemo(() => {
    if (!clientControlData) return [];
    if (!searchTerm) return clientControlData;
    
    return clientControlData.filter(client =>
      client.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientControlData, searchTerm]);

  const handlePhoneClick = async (phoneNumber: string, currentBotActive: boolean) => {
    try {
      console.log(`Toggling bot status for phone: ${phoneNumber}`);
      console.log(`Current bot_active: ${currentBotActive}`);
      
      const newBotStatus = !currentBotActive;
      console.log(`New bot_active will be: ${newBotStatus}`);
      
      const updateData = {
        bot_active: newBotStatus,
        human_agent: 'Aplicacion web',
        last_interaction: new Date().toISOString()
      };
      
      console.log('Update data:', updateData);
      
      const { data, error } = await supabase
        .from('client_control')
        .update(updateData)
        .eq('phone_number', phoneNumber)
        .select();

      if (error) {
        console.error('Error updating client control:', error);
        toast({
          title: "Error",
          description: "Error al actualizar el estado del bot.",
          variant: "destructive",
        });
        return;
      }

      console.log('Update successful, updated rows:', data);
      await refetch();

      toast({
        title: "Estado Actualizado",
        description: `Bot ${newBotStatus ? 'activado' : 'desactivado'} para ${phoneNumber}`,
      });
    } catch (error) {
      console.error('Error toggling bot status:', error);
      toast({
        title: "Error",
        description: "Error al cambiar el estado del bot.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Clientes con Bot Desactivado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientControlData || clientControlData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Clientes con Bot Desactivado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            No hay clientes con bot desactivado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Clientes con Bot Desactivado ({filteredData.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PhoneSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por número de teléfono..."
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Número de Teléfono
                </TableHead>
                <TableHead>Agente Humano</TableHead>
                <TableHead>Última Interacción (México)</TableHead>
                <TableHead>Estado Bot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((client) => (
                <TableRow key={client.id}>
                  <TableCell 
                    className="font-mono cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => handlePhoneClick(client.phone_number, client.bot_active)}
                    title="Clic para cambiar estado del bot"
                  >
                    {client.phone_number}
                  </TableCell>
                  <TableCell>
                    {client.human_agent ? (
                      <Badge variant="default" className="bg-red-600 text-white">
                        {client.human_agent}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Sin asignar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.last_interaction 
                      ? formatDateTimeInMexicoTime(client.last_interaction)
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Desactivado
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && searchTerm && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No se encontraron resultados para "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
