import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Phone, Calendar, MessageCircle } from 'lucide-react';

const PatientTrackingPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      // Get messages grouped by phone number to simulate patient tracking
      const { data: messages } = await supabase
        .from('n8n_mensajes')
        .select('phone_number, nombre, fecha_recibido, pregunta')
        .order('fecha_recibido', { ascending: false })
        .limit(100);

      if (!messages) return [];

      // Group by phone number to get unique patients
      const patientsMap = new Map();
      
      messages.forEach((message) => {
        const phone = message.phone_number;
        if (!patientsMap.has(phone)) {
          patientsMap.set(phone, {
            phone_number: phone,
            nombre: message.nombre || 'Usuario Anónimo',
            message_count: 1,
            last_interaction: message.fecha_recibido,
            recent_messages: [message]
          });
        } else {
          const patient = patientsMap.get(phone);
          patient.message_count++;
          if (patient.recent_messages.length < 5) {
            patient.recent_messages.push(message);
          }
        }
      });

      return Array.from(patientsMap.values());
    },
    refetchInterval: 30000,
  });

  const filteredPatients = patients?.filter(patient => 
    patient.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number?.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seguimiento de Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <Users className="h-5 w-5" />
          Seguimiento de Pacientes ({patients?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Patient List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPatients?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No se encontraron pacientes
              </p>
            ) : (
              filteredPatients?.map((patient) => (
                <div
                  key={patient.phone_number}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedPatient === patient.phone_number ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPatient(patient.phone_number)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {patient.nombre}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" />
                        <span>{patient.phone_number}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {patient.message_count} mensajes
                      </Badge>
                    </div>
                  </div>
                  
                  {patient.last_interaction && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3" />
                      <span>Última interacción: {formatDate(patient.last_interaction)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Patient Details */}
          <div className="border rounded-lg p-4">
            {selectedPatient ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Historial de Mensajes</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Cerrar
                  </Button>
                </div>

                {/* Recent Messages */}
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Mensajes Recientes
                  </h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {patients?.find(p => p.phone_number === selectedPatient)?.recent_messages?.map((message, index) => (
                      <div
                        key={index}
                        className="text-sm border rounded p-2 space-y-1"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {formatDate(message.fecha_recibido)}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {message.pregunta ? message.pregunta.substring(0, 100) + '...' : 'Sin contenido'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Selecciona un paciente para ver su historial
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientTrackingPanel;