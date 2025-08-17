export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_analytics: {
        Row: {
          citas_confirmadas_con_recordatorio: number | null
          citas_confirmadas_sin_recordatorio: number | null
          citas_manana: number | null
          citas_mediodia: number | null
          confirmadas_2h_24h: number | null
          confirmadas_30min_2h: number | null
          confirmadas_5_30min: number | null
          confirmadas_mas_24h: number | null
          confirmadas_menos_5min: number | null
          dia_semana: number | null
          es_festivo: boolean | null
          fecha: string
          hora_pico: string | null
          metadata: Json | null
          pacientes_multiples_citas: number | null
          pacientes_nuevos: number | null
          pacientes_recurrentes: number | null
          promedio_recordatorios_por_cita: number | null
          tasa_cancelacion: number | null
          tasa_completadas: number | null
          tasa_confirmacion: number | null
          tasa_no_show: number | null
          tiempo_maximo_confirmacion: unknown | null
          tiempo_mediano_confirmacion: unknown | null
          tiempo_minimo_confirmacion: unknown | null
          tiempo_promedio_confirmacion: unknown | null
          total_agendadas: number | null
          total_canceladas: number | null
          total_completadas: number | null
          total_confirmadas: number | null
          total_no_show: number | null
          total_recordatorios_enviados: number | null
          updated_at: string | null
        }
        Insert: {
          citas_confirmadas_con_recordatorio?: number | null
          citas_confirmadas_sin_recordatorio?: number | null
          citas_manana?: number | null
          citas_mediodia?: number | null
          confirmadas_2h_24h?: number | null
          confirmadas_30min_2h?: number | null
          confirmadas_5_30min?: number | null
          confirmadas_mas_24h?: number | null
          confirmadas_menos_5min?: number | null
          dia_semana?: number | null
          es_festivo?: boolean | null
          fecha: string
          hora_pico?: string | null
          metadata?: Json | null
          pacientes_multiples_citas?: number | null
          pacientes_nuevos?: number | null
          pacientes_recurrentes?: number | null
          promedio_recordatorios_por_cita?: number | null
          tasa_cancelacion?: number | null
          tasa_completadas?: number | null
          tasa_confirmacion?: number | null
          tasa_no_show?: number | null
          tiempo_maximo_confirmacion?: unknown | null
          tiempo_mediano_confirmacion?: unknown | null
          tiempo_minimo_confirmacion?: unknown | null
          tiempo_promedio_confirmacion?: unknown | null
          total_agendadas?: number | null
          total_canceladas?: number | null
          total_completadas?: number | null
          total_confirmadas?: number | null
          total_no_show?: number | null
          total_recordatorios_enviados?: number | null
          updated_at?: string | null
        }
        Update: {
          citas_confirmadas_con_recordatorio?: number | null
          citas_confirmadas_sin_recordatorio?: number | null
          citas_manana?: number | null
          citas_mediodia?: number | null
          confirmadas_2h_24h?: number | null
          confirmadas_30min_2h?: number | null
          confirmadas_5_30min?: number | null
          confirmadas_mas_24h?: number | null
          confirmadas_menos_5min?: number | null
          dia_semana?: number | null
          es_festivo?: boolean | null
          fecha?: string
          hora_pico?: string | null
          metadata?: Json | null
          pacientes_multiples_citas?: number | null
          pacientes_nuevos?: number | null
          pacientes_recurrentes?: number | null
          promedio_recordatorios_por_cita?: number | null
          tasa_cancelacion?: number | null
          tasa_completadas?: number | null
          tasa_confirmacion?: number | null
          tasa_no_show?: number | null
          tiempo_maximo_confirmacion?: unknown | null
          tiempo_mediano_confirmacion?: unknown | null
          tiempo_minimo_confirmacion?: unknown | null
          tiempo_promedio_confirmacion?: unknown | null
          total_agendadas?: number | null
          total_canceladas?: number | null
          total_completadas?: number | null
          total_confirmadas?: number | null
          total_no_show?: number | null
          total_recordatorios_enviados?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      appointment_timeline: {
        Row: {
          created_at: string | null
          descripcion: string | null
          evento_tipo: string
          fecha_evento: string | null
          google_event_id: string
          id: number
          metadata: Json | null
          usuario_origen: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          evento_tipo: string
          fecha_evento?: string | null
          google_event_id: string
          id?: number
          metadata?: Json | null
          usuario_origen?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          evento_tipo?: string
          fecha_evento?: string | null
          google_event_id?: string
          id?: number
          metadata?: Json | null
          usuario_origen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_timeline_google_event_id_fkey"
            columns: ["google_event_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["google_event_id"]
          },
          {
            foreignKeyName: "appointment_timeline_google_event_id_fkey"
            columns: ["google_event_id"]
            isOneToOne: false
            referencedRelation: "v_appointments_secure"
            referencedColumns: ["google_event_id"]
          },
          {
            foreignKeyName: "appointment_timeline_google_event_id_fkey"
            columns: ["google_event_id"]
            isOneToOne: false
            referencedRelation: "v_citas_activas"
            referencedColumns: ["google_event_id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          estado: string
          fecha_notificacion: string | null
          fecha_original: string
          fecha_recordatorio: string | null
          google_event_id: string
          observaciones: string | null
          paciente: string
          status: string | null
          telefono: string | null
          tiempo_hasta_confirmacion: unknown | null
          tipo_recordatorio: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_notificacion?: string | null
          fecha_original: string
          fecha_recordatorio?: string | null
          google_event_id: string
          observaciones?: string | null
          paciente: string
          status?: string | null
          telefono?: string | null
          tiempo_hasta_confirmacion?: unknown | null
          tipo_recordatorio?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_notificacion?: string | null
          fecha_original?: string
          fecha_recordatorio?: string | null
          google_event_id?: string
          observaciones?: string | null
          paciente?: string
          status?: string | null
          telefono?: string | null
          tiempo_hasta_confirmacion?: unknown | null
          tipo_recordatorio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      appointments_recordatorios: {
        Row: {
          canal: string | null
          fecha_envio: string | null
          google_event_id: string | null
          id: number
          mensaje: string | null
          respuesta_recibida: boolean | null
          tiempo_respuesta: unknown | null
          tipo_recordatorio: string | null
        }
        Insert: {
          canal?: string | null
          fecha_envio?: string | null
          google_event_id?: string | null
          id?: number
          mensaje?: string | null
          respuesta_recibida?: boolean | null
          tiempo_respuesta?: unknown | null
          tipo_recordatorio?: string | null
        }
        Update: {
          canal?: string | null
          fecha_envio?: string | null
          google_event_id?: string | null
          id?: number
          mensaje?: string | null
          respuesta_recibida?: boolean | null
          tiempo_respuesta?: unknown | null
          tipo_recordatorio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_recordatorios_google_event_id_fkey"
            columns: ["google_event_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["google_event_id"]
          },
          {
            foreignKeyName: "appointments_recordatorios_google_event_id_fkey"
            columns: ["google_event_id"]
            isOneToOne: false
            referencedRelation: "v_appointments_secure"
            referencedColumns: ["google_event_id"]
          },
          {
            foreignKeyName: "appointments_recordatorios_google_event_id_fkey"
            columns: ["google_event_id"]
            isOneToOne: false
            referencedRelation: "v_citas_activas"
            referencedColumns: ["google_event_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          active: boolean | null
          app: string | null
          bot_message: string | null
          conversation_id: string | null
          created_at: string
          id: number
          message_type: string | null
          phone: string | null
          user_id: string | null
          user_message: string | null
          user_name: string | null
        }
        Insert: {
          active?: boolean | null
          app?: string | null
          bot_message?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          message_type?: string | null
          phone?: string | null
          user_id?: string | null
          user_message?: string | null
          user_name?: string | null
        }
        Update: {
          active?: boolean | null
          app?: string | null
          bot_message?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          message_type?: string | null
          phone?: string | null
          user_id?: string | null
          user_message?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          app: string | null
          conversation_id: string | null
          created_at: string
          id: number
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          app?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          app?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: number
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_control: {
        Row: {
          bot_active: boolean | null
          human_agent: string | null
          id: number
          last_interaction: string | null
          nombre_paciente: string | null
          phone_number: string
        }
        Insert: {
          bot_active?: boolean | null
          human_agent?: string | null
          id?: number
          last_interaction?: string | null
          nombre_paciente?: string | null
          phone_number: string
        }
        Update: {
          bot_active?: boolean | null
          human_agent?: string | null
          id?: number
          last_interaction?: string | null
          nombre_paciente?: string | null
          phone_number?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          active: boolean | null
          app: string | null
          cliente_name: string | null
          created_at: string
          email: string | null
          id: number
          lat: string | null
          location: string | null
          long: string | null
          phone: string | null
        }
        Insert: {
          active?: boolean | null
          app?: string | null
          cliente_name?: string | null
          created_at?: string
          email?: string | null
          id?: number
          lat?: string | null
          location?: string | null
          long?: string | null
          phone?: string | null
        }
        Update: {
          active?: boolean | null
          app?: string | null
          cliente_name?: string | null
          created_at?: string
          email?: string | null
          id?: number
          lat?: string | null
          location?: string | null
          long?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      evolution_metricas: {
        Row: {
          audios_enviados: number | null
          audios_recibidos: number | null
          documentos_recibidos: number | null
          errores_total: number
          fecha_inicio: string
          id: number
          imagenes_enviadas: number | null
          imagenes_recibidas: number | null
          llamadas_exitosas: number
          mensajes_abiertos: number | null
          mensajes_enviados: number
          mensajes_recibidos: number
          stickers_recibidos: number | null
          total_chats: number | null
          total_llamadas: number
          updated_at: string
          usuarios_optout: number | null
          usuarios_unicos: number | null
          videos_recibidos: number | null
        }
        Insert: {
          audios_enviados?: number | null
          audios_recibidos?: number | null
          documentos_recibidos?: number | null
          errores_total?: number
          fecha_inicio?: string
          id?: number
          imagenes_enviadas?: number | null
          imagenes_recibidas?: number | null
          llamadas_exitosas?: number
          mensajes_abiertos?: number | null
          mensajes_enviados?: number
          mensajes_recibidos?: number
          stickers_recibidos?: number | null
          total_chats?: number | null
          total_llamadas?: number
          updated_at?: string
          usuarios_optout?: number | null
          usuarios_unicos?: number | null
          videos_recibidos?: number | null
        }
        Update: {
          audios_enviados?: number | null
          audios_recibidos?: number | null
          documentos_recibidos?: number | null
          errores_total?: number
          fecha_inicio?: string
          id?: number
          imagenes_enviadas?: number | null
          imagenes_recibidas?: number | null
          llamadas_exitosas?: number
          mensajes_abiertos?: number | null
          mensajes_enviados?: number
          mensajes_recibidos?: number
          stickers_recibidos?: number | null
          total_chats?: number | null
          total_llamadas?: number
          updated_at?: string
          usuarios_optout?: number | null
          usuarios_unicos?: number | null
          videos_recibidos?: number | null
        }
        Relationships: []
      }
      job_execution_log: {
        Row: {
          duration: unknown | null
          error_message: string | null
          execution_time: string | null
          id: number
          job_name: string
          resultado: Json | null
          status: string | null
        }
        Insert: {
          duration?: unknown | null
          error_message?: string | null
          execution_time?: string | null
          id?: number
          job_name: string
          resultado?: Json | null
          status?: string | null
        }
        Update: {
          duration?: unknown | null
          error_message?: string | null
          execution_time?: string | null
          id?: number
          job_name?: string
          resultado?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      kpi_historico: {
        Row: {
          conversaciones_iniciadas_empresa: number | null
          conversaciones_iniciadas_usuario: number | null
          csat: number | null
          fecha_kpi: string
          id: number
          mensajes_documentos_enviados: number | null
          mensajes_documentos_recibidos: number | null
          tasa_audios_enviados: string | null
          tasa_audios_recibidos: string | null
          tasa_entrega: string | null
          tasa_error: string | null
          tasa_imagenes_enviadas: string | null
          tasa_imagenes_recibidas: string | null
          tasa_multimedia_total: string | null
          tasa_resolucion_primer_contacto: number | null
          tasa_respuesta: string | null
          tiempo_promedio_respuesta: unknown | null
          usuarios_unicos: number | null
        }
        Insert: {
          conversaciones_iniciadas_empresa?: number | null
          conversaciones_iniciadas_usuario?: number | null
          csat?: number | null
          fecha_kpi: string
          id?: number
          mensajes_documentos_enviados?: number | null
          mensajes_documentos_recibidos?: number | null
          tasa_audios_enviados?: string | null
          tasa_audios_recibidos?: string | null
          tasa_entrega?: string | null
          tasa_error?: string | null
          tasa_imagenes_enviadas?: string | null
          tasa_imagenes_recibidas?: string | null
          tasa_multimedia_total?: string | null
          tasa_resolucion_primer_contacto?: number | null
          tasa_respuesta?: string | null
          tiempo_promedio_respuesta?: unknown | null
          usuarios_unicos?: number | null
        }
        Update: {
          conversaciones_iniciadas_empresa?: number | null
          conversaciones_iniciadas_usuario?: number | null
          csat?: number | null
          fecha_kpi?: string
          id?: number
          mensajes_documentos_enviados?: number | null
          mensajes_documentos_recibidos?: number | null
          tasa_audios_enviados?: string | null
          tasa_audios_recibidos?: string | null
          tasa_entrega?: string | null
          tasa_error?: string | null
          tasa_imagenes_enviadas?: string | null
          tasa_imagenes_recibidas?: string | null
          tasa_multimedia_total?: string | null
          tasa_resolucion_primer_contacto?: number | null
          tasa_respuesta?: string | null
          tiempo_promedio_respuesta?: unknown | null
          usuarios_unicos?: number | null
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          contenido: string | null
          estado: string
          fecha_entrega: string | null
          fecha_envio: string | null
          fecha_lectura: string | null
          id: string
          instancia: string | null
          usuario: string
        }
        Insert: {
          contenido?: string | null
          estado: string
          fecha_entrega?: string | null
          fecha_envio?: string | null
          fecha_lectura?: string | null
          id: string
          instancia?: string | null
          usuario: string
        }
        Update: {
          contenido?: string | null
          estado?: string
          fecha_entrega?: string | null
          fecha_envio?: string | null
          fecha_lectura?: string | null
          id?: string
          instancia?: string | null
          usuario?: string
        }
        Relationships: []
      }
      n8n_connections: {
        Row: {
          api_key: string
          base_url: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          api_key: string
          base_url: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          api_key?: string
          base_url?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: []
      }
      n8n_errores_whatsapp: {
        Row: {
          created_at: string | null
          error_message: string | null
          estado: string | null
          event_id: string | null
          fecha_archivado: string | null
          fecha_cita: string | null
          fecha_enviado: string | null
          fecha_error: string | null
          id: number
          id_original: number | null
          intentos: number | null
          mensaje_pendiente: string
          motivo_archivado: string | null
          nombre_paciente: string | null
          observaciones: string | null
          telefono: string
          tipo_notificacion: string | null
          tipo_recordatorio: string | null
          ultimo_intento: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          estado?: string | null
          event_id?: string | null
          fecha_archivado?: string | null
          fecha_cita?: string | null
          fecha_enviado?: string | null
          fecha_error?: string | null
          id?: number
          id_original?: number | null
          intentos?: number | null
          mensaje_pendiente: string
          motivo_archivado?: string | null
          nombre_paciente?: string | null
          observaciones?: string | null
          telefono: string
          tipo_notificacion?: string | null
          tipo_recordatorio?: string | null
          ultimo_intento?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          estado?: string | null
          event_id?: string | null
          fecha_archivado?: string | null
          fecha_cita?: string | null
          fecha_enviado?: string | null
          fecha_error?: string | null
          id?: number
          id_original?: number | null
          intentos?: number | null
          mensaje_pendiente?: string
          motivo_archivado?: string | null
          nombre_paciente?: string | null
          observaciones?: string | null
          telefono?: string
          tipo_notificacion?: string | null
          tipo_recordatorio?: string | null
          ultimo_intento?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      n8n_errores_whatsapp_historico: {
        Row: {
          created_at: string | null
          error_message: string | null
          estado: string | null
          event_id: string | null
          fecha_archivado: string | null
          fecha_cita: string | null
          fecha_enviado: string | null
          fecha_error: string | null
          id: number
          id_original: number | null
          intentos: number | null
          mensaje_pendiente: string | null
          motivo_archivado: string | null
          nombre_paciente: string | null
          observaciones: string | null
          telefono: string | null
          tipo_notificacion: string | null
          tipo_recordatorio: string | null
          ultimo_intento: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          estado?: string | null
          event_id?: string | null
          fecha_archivado?: string | null
          fecha_cita?: string | null
          fecha_enviado?: string | null
          fecha_error?: string | null
          id?: number
          id_original?: number | null
          intentos?: number | null
          mensaje_pendiente?: string | null
          motivo_archivado?: string | null
          nombre_paciente?: string | null
          observaciones?: string | null
          telefono?: string | null
          tipo_notificacion?: string | null
          tipo_recordatorio?: string | null
          ultimo_intento?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          estado?: string | null
          event_id?: string | null
          fecha_archivado?: string | null
          fecha_cita?: string | null
          fecha_enviado?: string | null
          fecha_error?: string | null
          id?: number
          id_original?: number | null
          intentos?: number | null
          mensaje_pendiente?: string | null
          motivo_archivado?: string | null
          nombre_paciente?: string | null
          observaciones?: string | null
          telefono?: string | null
          tipo_notificacion?: string | null
          tipo_recordatorio?: string | null
          ultimo_intento?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      n8n_fila_mensagens: {
        Row: {
          id: number
          id_mensagem: string
          mensagem: string
          telefone: string
          timestamp: string
        }
        Insert: {
          id?: number
          id_mensagem: string
          mensagem: string
          telefone: string
          timestamp: string
        }
        Update: {
          id?: number
          id_mensagem?: string
          mensagem?: string
          telefone?: string
          timestamp?: string
        }
        Relationships: []
      }
      n8n_fila_mensagens_personal: {
        Row: {
          id: number
          id_mensagem: string
          mensagem: string
          telefone: string
          timestamp: string
        }
        Insert: {
          id?: number
          id_mensagem: string
          mensagem: string
          telefone: string
          timestamp: string
        }
        Update: {
          id?: number
          id_mensagem?: string
          mensagem?: string
          telefone?: string
          timestamp?: string
        }
        Relationships: []
      }
      n8n_historico_mensagens: {
        Row: {
          created_at: string
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_historico_mensagens_personal: {
        Row: {
          created_at: string
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_job_config: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          function_to_call: string
          id: number
          job_name: string
          schedule_cron: string
          workflow_id: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          function_to_call: string
          id?: number
          job_name: string
          schedule_cron: string
          workflow_id?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          function_to_call?: string
          id?: number
          job_name?: string
          schedule_cron?: string
          workflow_id?: string | null
        }
        Relationships: []
      }
      n8n_logs_notificaciones: {
        Row: {
          event_id: string | null
          fecha_cita: string | null
          fecha_notificacion: string | null
          id: number
          mensaje_enviado: string | null
          nombre_paciente: string | null
          telefono: string
          tipo_cambio: string | null
          tipo_notificacion: string | null
        }
        Insert: {
          event_id?: string | null
          fecha_cita?: string | null
          fecha_notificacion?: string | null
          id?: number
          mensaje_enviado?: string | null
          nombre_paciente?: string | null
          telefono: string
          tipo_cambio?: string | null
          tipo_notificacion?: string | null
        }
        Update: {
          event_id?: string | null
          fecha_cita?: string | null
          fecha_notificacion?: string | null
          id?: number
          mensaje_enviado?: string | null
          nombre_paciente?: string | null
          telefono?: string
          tipo_cambio?: string | null
          tipo_notificacion?: string | null
        }
        Relationships: []
      }
      n8n_mensajes: {
        Row: {
          fecha_recibido: string | null
          fecha_respuesta: string | null
          id: number
          id_pregunta: string | null
          id_respuesta: string | null
          nombre: string | null
          phone_number: string
          pregunta: string
          respuesta: string | null
        }
        Insert: {
          fecha_recibido?: string | null
          fecha_respuesta?: string | null
          id?: never
          id_pregunta?: string | null
          id_respuesta?: string | null
          nombre?: string | null
          phone_number: string
          pregunta: string
          respuesta?: string | null
        }
        Update: {
          fecha_recibido?: string | null
          fecha_respuesta?: string | null
          id?: never
          id_pregunta?: string | null
          id_respuesta?: string | null
          nombre?: string | null
          phone_number?: string
          pregunta?: string
          respuesta?: string | null
        }
        Relationships: []
      }
      n8n_metricas_clasificador: {
        Row: {
          advertencias_horario: Json | null
          cambios_de_contexto: number | null
          conversacion_compleja: boolean | null
          costo_estimado: number | null
          error_mensaje: string | null
          es_urgente: boolean | null
          id: number
          longitud_mensaje: number | null
          max_tokens: number | null
          menciona_dia: boolean | null
          menciona_hora: boolean | null
          mensaje_original: string | null
          mensajes_en_historial: number | null
          modelo_usado: string | null
          multiples_personas: boolean | null
          nombre_usuario: string | null
          personas_involucradas: string[] | null
          prioridad: string | null
          quiere_cita: boolean | null
          razon_clasificacion: string | null
          respuesta_exitosa: boolean | null
          telefono: string | null
          tiempo_respuesta_esperado: string | null
          tiempo_respuesta_real: number | null
          timestamp: string | null
          tipo_mensaje: string | null
        }
        Insert: {
          advertencias_horario?: Json | null
          cambios_de_contexto?: number | null
          conversacion_compleja?: boolean | null
          costo_estimado?: number | null
          error_mensaje?: string | null
          es_urgente?: boolean | null
          id?: number
          longitud_mensaje?: number | null
          max_tokens?: number | null
          menciona_dia?: boolean | null
          menciona_hora?: boolean | null
          mensaje_original?: string | null
          mensajes_en_historial?: number | null
          modelo_usado?: string | null
          multiples_personas?: boolean | null
          nombre_usuario?: string | null
          personas_involucradas?: string[] | null
          prioridad?: string | null
          quiere_cita?: boolean | null
          razon_clasificacion?: string | null
          respuesta_exitosa?: boolean | null
          telefono?: string | null
          tiempo_respuesta_esperado?: string | null
          tiempo_respuesta_real?: number | null
          timestamp?: string | null
          tipo_mensaje?: string | null
        }
        Update: {
          advertencias_horario?: Json | null
          cambios_de_contexto?: number | null
          conversacion_compleja?: boolean | null
          costo_estimado?: number | null
          error_mensaje?: string | null
          es_urgente?: boolean | null
          id?: number
          longitud_mensaje?: number | null
          max_tokens?: number | null
          menciona_dia?: boolean | null
          menciona_hora?: boolean | null
          mensaje_original?: string | null
          mensajes_en_historial?: number | null
          modelo_usado?: string | null
          multiples_personas?: boolean | null
          nombre_usuario?: string | null
          personas_involucradas?: string[] | null
          prioridad?: string | null
          quiere_cita?: boolean | null
          razon_clasificacion?: string | null
          respuesta_exitosa?: boolean | null
          telefono?: string | null
          tiempo_respuesta_esperado?: string | null
          tiempo_respuesta_real?: number | null
          timestamp?: string | null
          tipo_mensaje?: string | null
        }
        Relationships: []
      }
      n8n_sesiones_chat: {
        Row: {
          canal_comunicacion: string | null
          duracion_sesion: unknown | null
          nombre_usuario: string | null
          session_id: string
          telefono: string | null
          timestamp_fin: string | null
          timestamp_inicio: string | null
          total_mensajes: number | null
        }
        Insert: {
          canal_comunicacion?: string | null
          duracion_sesion?: unknown | null
          nombre_usuario?: string | null
          session_id?: string
          telefono?: string | null
          timestamp_fin?: string | null
          timestamp_inicio?: string | null
          total_mensajes?: number | null
        }
        Update: {
          canal_comunicacion?: string | null
          duracion_sesion?: unknown | null
          nombre_usuario?: string | null
          session_id?: string
          telefono?: string | null
          timestamp_fin?: string | null
          timestamp_inicio?: string | null
          total_mensajes?: number | null
        }
        Relationships: []
      }
      n8n_usuarios_unicos: {
        Row: {
          id: number
          nombre_paciente: string | null
          numero: string | null
        }
        Insert: {
          id?: number
          nombre_paciente?: string | null
          numero?: string | null
        }
        Update: {
          id?: number
          nombre_paciente?: string | null
          numero?: string | null
        }
        Relationships: []
      }
      notificaciones_modificaciones: {
        Row: {
          event_id: string | null
          fecha_notificacion: string | null
          id: number
          mensaje_enviado: string | null
          nombre_paciente: string | null
          telefono: string | null
          tipo_cambio: string | null
        }
        Insert: {
          event_id?: string | null
          fecha_notificacion?: string | null
          id?: number
          mensaje_enviado?: string | null
          nombre_paciente?: string | null
          telefono?: string | null
          tipo_cambio?: string | null
        }
        Update: {
          event_id?: string | null
          fecha_notificacion?: string | null
          id?: number
          mensaje_enviado?: string | null
          nombre_paciente?: string | null
          telefono?: string | null
          tipo_cambio?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reportes_generados: {
        Row: {
          contenido: Json
          destinatarios: string[] | null
          enviado: boolean | null
          fecha_envio: string | null
          fecha_generacion: string | null
          id: number
          tipo: string
        }
        Insert: {
          contenido: Json
          destinatarios?: string[] | null
          enviado?: boolean | null
          fecha_envio?: string | null
          fecha_generacion?: string | null
          id?: number
          tipo: string
        }
        Update: {
          contenido?: Json
          destinatarios?: string[] | null
          enviado?: boolean | null
          fecha_envio?: string | null
          fecha_generacion?: string | null
          id?: number
          tipo?: string
        }
        Relationships: []
      }
      user_dashboard_permissions: {
        Row: {
          dashboard_type: Database["public"]["Enums"]["dashboard_type"]
          granted_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          dashboard_type: Database["public"]["Enums"]["dashboard_type"]
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          dashboard_type?: Database["public"]["Enums"]["dashboard_type"]
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_control: {
        Row: {
          id: number
          is_active: boolean | null
          last_updated: string | null
          updated_by: string | null
          workflow_name: string
        }
        Insert: {
          id?: number
          is_active?: boolean | null
          last_updated?: string | null
          updated_by?: string | null
          workflow_name: string
        }
        Update: {
          id?: number
          is_active?: boolean | null
          last_updated?: string | null
          updated_by?: string | null
          workflow_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_analisis_pacientes: {
        Row: {
          clasificacion_riesgo: string | null
          minutos_promedio_confirmacion: number | null
          paciente: string | null
          tasa_confirmacion_personal: number | null
          tasa_no_show_personal: number | null
          telefono: string | null
          tipo_paciente: string | null
          total_citas: number | null
          ultima_visita: string | null
        }
        Relationships: []
      }
      v_appointments_secure: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_original: string | null
          google_event_id: string | null
          observaciones: string | null
          paciente: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_original?: string | null
          google_event_id?: string | null
          observaciones?: string | null
          paciente?: string | null
          telefono?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_original?: string | null
          google_event_id?: string | null
          observaciones?: string | null
          paciente?: string | null
          telefono?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      v_citas_activas: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_mexico: string | null
          fecha_original: string | null
          google_event_id: string | null
          paciente: string | null
          proximidad: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_mexico?: never
          fecha_original?: string | null
          google_event_id?: string | null
          paciente?: string | null
          proximidad?: never
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_mexico?: never
          fecha_original?: string | null
          google_event_id?: string | null
          paciente?: string | null
          proximidad?: never
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_dashboard_hoy: {
        Row: {
          citas_confirmadas_con_recordatorio: number | null
          citas_confirmadas_sin_recordatorio: number | null
          citas_manana: number | null
          citas_mediodia: number | null
          confirmadas_2h_24h: number | null
          confirmadas_30min_2h: number | null
          confirmadas_5_30min: number | null
          confirmadas_mas_24h: number | null
          confirmadas_menos_5min: number | null
          dia_semana: number | null
          es_festivo: boolean | null
          estado_confirmaciones: string | null
          estado_no_shows: string | null
          fecha: string | null
          hora_pico: string | null
          metadata: Json | null
          pacientes_multiples_citas: number | null
          pacientes_nuevos: number | null
          pacientes_recurrentes: number | null
          promedio_recordatorios_por_cita: number | null
          tasa_cancelacion: number | null
          tasa_completadas: number | null
          tasa_confirmacion: number | null
          tasa_no_show: number | null
          tiempo_maximo_confirmacion: unknown | null
          tiempo_mediano_confirmacion: unknown | null
          tiempo_minimo_confirmacion: unknown | null
          tiempo_promedio_confirmacion: unknown | null
          tiempo_promedio_formato: string | null
          total_agendadas: number | null
          total_canceladas: number | null
          total_completadas: number | null
          total_confirmadas: number | null
          total_no_show: number | null
          total_recordatorios_enviados: number | null
          updated_at: string | null
        }
        Insert: {
          citas_confirmadas_con_recordatorio?: number | null
          citas_confirmadas_sin_recordatorio?: number | null
          citas_manana?: number | null
          citas_mediodia?: number | null
          confirmadas_2h_24h?: number | null
          confirmadas_30min_2h?: number | null
          confirmadas_5_30min?: number | null
          confirmadas_mas_24h?: number | null
          confirmadas_menos_5min?: number | null
          dia_semana?: number | null
          es_festivo?: boolean | null
          estado_confirmaciones?: never
          estado_no_shows?: never
          fecha?: string | null
          hora_pico?: string | null
          metadata?: Json | null
          pacientes_multiples_citas?: number | null
          pacientes_nuevos?: number | null
          pacientes_recurrentes?: number | null
          promedio_recordatorios_por_cita?: number | null
          tasa_cancelacion?: number | null
          tasa_completadas?: number | null
          tasa_confirmacion?: number | null
          tasa_no_show?: number | null
          tiempo_maximo_confirmacion?: unknown | null
          tiempo_mediano_confirmacion?: unknown | null
          tiempo_minimo_confirmacion?: unknown | null
          tiempo_promedio_confirmacion?: unknown | null
          tiempo_promedio_formato?: never
          total_agendadas?: number | null
          total_canceladas?: number | null
          total_completadas?: number | null
          total_confirmadas?: number | null
          total_no_show?: number | null
          total_recordatorios_enviados?: number | null
          updated_at?: string | null
        }
        Update: {
          citas_confirmadas_con_recordatorio?: number | null
          citas_confirmadas_sin_recordatorio?: number | null
          citas_manana?: number | null
          citas_mediodia?: number | null
          confirmadas_2h_24h?: number | null
          confirmadas_30min_2h?: number | null
          confirmadas_5_30min?: number | null
          confirmadas_mas_24h?: number | null
          confirmadas_menos_5min?: number | null
          dia_semana?: number | null
          es_festivo?: boolean | null
          estado_confirmaciones?: never
          estado_no_shows?: never
          fecha?: string | null
          hora_pico?: string | null
          metadata?: Json | null
          pacientes_multiples_citas?: number | null
          pacientes_nuevos?: number | null
          pacientes_recurrentes?: number | null
          promedio_recordatorios_por_cita?: number | null
          tasa_cancelacion?: number | null
          tasa_completadas?: number | null
          tasa_confirmacion?: number | null
          tasa_no_show?: number | null
          tiempo_maximo_confirmacion?: unknown | null
          tiempo_mediano_confirmacion?: unknown | null
          tiempo_minimo_confirmacion?: unknown | null
          tiempo_promedio_confirmacion?: unknown | null
          tiempo_promedio_formato?: never
          total_agendadas?: number | null
          total_canceladas?: number | null
          total_completadas?: number | null
          total_confirmadas?: number | null
          total_no_show?: number | null
          total_recordatorios_enviados?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_dashboard_rendimiento: {
        Row: {
          categoria: string | null
          citas: number | null
          fecha: string | null
          posicion: number | null
          valor: string | null
        }
        Relationships: []
      }
      v_dashboard_secretaria: {
        Row: {
          fecha: string | null
          sin_respuesta: number | null
          solicitudes_cita: number | null
          tiempo_respuesta_seg: number | null
          total_mensajes: number | null
          usuarios_unicos: number | null
        }
        Relationships: []
      }
      v_dashboard_semana: {
        Row: {
          dia: string | null
          fecha: string | null
          minutos_promedio: number | null
          tasa_confirmacion: number | null
          tasa_no_show: number | null
          tipo_dia: string | null
          total_agendadas: number | null
          total_canceladas: number | null
          total_confirmadas: number | null
          total_no_show: number | null
        }
        Insert: {
          dia?: never
          fecha?: string | null
          minutos_promedio?: never
          tasa_confirmacion?: number | null
          tasa_no_show?: number | null
          tipo_dia?: never
          total_agendadas?: number | null
          total_canceladas?: number | null
          total_confirmadas?: number | null
          total_no_show?: number | null
        }
        Update: {
          dia?: never
          fecha?: string | null
          minutos_promedio?: never
          tasa_confirmacion?: number | null
          tasa_no_show?: number | null
          tipo_dia?: never
          total_agendadas?: number | null
          total_canceladas?: number | null
          total_confirmadas?: number | null
          total_no_show?: number | null
        }
        Relationships: []
      }
      v_dashboard_sistema: {
        Row: {
          errores_pendientes: number | null
          mensajes_sin_respuesta: number | null
          mensajes_totales: number | null
          sesiones_activas: number | null
          ultimo_kpi: string | null
          usuarios_totales: number | null
        }
        Relationships: []
      }
      v_dashboard_tendencias: {
        Row: {
          citas_por_dia: number | null
          indicador: string | null
          periodo: string | null
          tasa_confirmacion: number | null
          tasa_no_show: number | null
          total_citas_semana: number | null
          total_confirmadas_semana: number | null
        }
        Relationships: []
      }
      v_distribucion_horaria: {
        Row: {
          horario: string | null
          porcentaje: number | null
          promedio_diario: number | null
          total_citas: number | null
        }
        Relationships: []
      }
      v_estadisticas_errores: {
        Row: {
          enviados_reintento: number | null
          fallidos: number | null
          fecha: string | null
          pendientes: number | null
          total_errores: number | null
        }
        Relationships: []
      }
      v_heatmap_ocupacion: {
        Row: {
          color_hex: string | null
          confirmadas: number | null
          dia_corto: string | null
          dia_num: number | null
          hora: number | null
          hora_formato: string | null
          intensidad: string | null
          no_shows: number | null
          tasa_confirmacion: number | null
          total_citas: number | null
        }
        Relationships: []
      }
      v_mensajes_pendientes: {
        Row: {
          error_message: string | null
          fecha_cita: string | null
          fecha_error: string | null
          id: number | null
          intentos: number | null
          nombre_paciente: string | null
          telefono: string | null
          ultimo_intento: string | null
        }
        Insert: {
          error_message?: string | null
          fecha_cita?: string | null
          fecha_error?: string | null
          id?: number | null
          intentos?: number | null
          nombre_paciente?: string | null
          telefono?: string | null
          ultimo_intento?: string | null
        }
        Update: {
          error_message?: string | null
          fecha_cita?: string | null
          fecha_error?: string | null
          id?: number | null
          intentos?: number | null
          nombre_paciente?: string | null
          telefono?: string | null
          ultimo_intento?: string | null
        }
        Relationships: []
      }
      v_metricas_comparacion: {
        Row: {
          periodo: string | null
          promedio_citas: number | null
          promedio_confirmacion: number | null
          promedio_no_show: number | null
          total_citas: number | null
        }
        Relationships: []
      }
      v_metricas_confirmacion: {
        Row: {
          con_recordatorio: number | null
          confirmadas: number | null
          confirmadas_5_30min: number | null
          confirmadas_5min: number | null
          confirmadas_mas_30min: number | null
          fecha_cita: string | null
          minutos_promedio: number | null
          tasa_confirmacion: number | null
          total_citas: number | null
        }
        Relationships: []
      }
      v_metricas_por_dia_semana: {
        Row: {
          canceladas: number | null
          color_dia: string | null
          confirmadas: number | null
          dia_nombre: string | null
          dia_num: number | null
          no_shows: number | null
          pendientes: number | null
          tasa_confirmacion: number | null
          tasa_no_show: number | null
          tipo_dia: string | null
          total_citas: number | null
        }
        Relationships: []
      }
      v_metricas_por_horario: {
        Row: {
          bloque_horario: string | null
          canceladas: number | null
          confirmadas: number | null
          icono: string | null
          no_shows: number | null
          pendientes: number | null
          tasa_confirmacion: number | null
          total_citas: number | null
        }
        Relationships: []
      }
      v_metricas_resumen: {
        Row: {
          casos_multiples: number | null
          casos_urgentes: number | null
          costo_total: number | null
          fecha: string | null
          modelo_usado: string | null
          promedio_longitud: number | null
          tasa_exito: number | null
          total_mensajes: number | null
        }
        Relationships: []
      }
      v_metricas_semanales: {
        Row: {
          canceladas: number | null
          completadas: number | null
          confirmadas: number | null
          fin: string | null
          icono: string | null
          inicio: string | null
          no_shows: number | null
          orden: number | null
          pendientes: number | null
          periodo: string | null
          rango_fechas: string | null
          tasa_confirmacion: number | null
          total_agendadas: number | null
        }
        Relationships: []
      }
      v_pacientes_problematicos: {
        Row: {
          historial_reciente: string | null
          paciente: string | null
          porcentaje_no_show: number | null
          telefono: string | null
          total_cancelaciones: number | null
          total_citas: number | null
          total_no_shows: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      actualizar_metricas_dia: {
        Args: { p_fecha: string }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calcular_kpis_diarios: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_old_sensitive_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      confirmar_cita: {
        Args: { p_telefono: string }
        Returns: {
          citas_confirmadas: number
          mensaje: string
        }[]
      }
      desactivar_job_analytics: {
        Args: { p_nombre: string }
        Returns: boolean
      }
      detectar_no_shows: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ejecutar_job_con_log: {
        Args: { p_function_call: string; p_job_name: string }
        Returns: Json
      }
      ejecutar_mantenimiento_completo: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generar_alertas: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generar_reporte_mensual: {
        Args: { p_año?: number; p_mes?: number }
        Returns: Json
      }
      generar_reporte_semanal: {
        Args: { p_fecha?: string }
        Returns: Json
      }
      get_alerts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_dashboard_today: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_dashboard_today_direct: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_email_by_username: {
        Args: { p_username: string }
        Returns: string
      }
      get_heatmap_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_metrics_by_day: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_metrics_by_hour: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_monthly_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_time_distribution: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_trends_data: {
        Args: { days_back?: number }
        Returns: Json
      }
      get_weekly_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_weekly_metrics_flexible: {
        Args: {
          p_include_past?: boolean
          p_num_weeks?: number
          p_reference_date?: string
        }
        Returns: Json
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_dashboard_access: {
        Args: {
          dashboard_param: Database["public"]["Enums"]["dashboard_type"]
          user_id_param: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never> | { user_id_param?: string }
        Returns: boolean
      }
      is_username_available: {
        Args: { p_user_id?: string; p_username: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      job_proceso_nocturno: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      job_reporte_semanal: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      limpiar_datos_antiguos: {
        Args: {
          p_dias_errores?: number
          p_dias_kpi?: number
          p_dias_logs?: number
        }
        Returns: {
          errores_movidos: number
          kpis_eliminados: number
          logs_eliminados: number
          mensaje: string
        }[]
      }
      listar_jobs_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          activo: boolean
          comando: string
          job_id: number
          nombre: string
          programacion: string
        }[]
      }
      marcar_cita_completada: {
        Args: { p_google_event_id: string }
        Returns: Json
      }
      mask_phone_number: {
        Args: { phone_number: string }
        Returns: string
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      obtener_timeline_cita: {
        Args: { p_google_event_id: string }
        Returns: {
          descripcion: string
          evento: string
          fecha: string
          tiempo_transcurrido: string
        }[]
      }
      procesar_error_whatsapp: {
        Args: {
          p_error: string
          p_event_id?: string
          p_mensaje: string
          p_nombre: string
          p_telefono: string
        }
        Returns: number
      }
      procesar_metrica_whatsapp: {
        Args: {
          p_abiertos: number
          p_audios: number
          p_documentos: number
          p_imagenes: number
          p_mensajes: number
          p_message_id: string
          p_nombre_paciente: string
          p_numero: string
          p_optout: number
          p_stickers: number
          p_timestamp: string
          p_unicos: number
          p_videos: number
        }
        Returns: undefined
      }
      reagendar_cita: {
        Args: {
          p_google_event_id: string
          p_nueva_fecha: string
          p_nuevo_event_id?: string
        }
        Returns: {
          mensaje: string
          nueva_fecha: string
          nuevo_id: string
        }[]
      }
      registrar_cita: {
        Args: {
          p_estado?: string
          p_fecha_cita: string
          p_google_event_id: string
          p_paciente: string
          p_telefono: string
        }
        Returns: {
          accion: string
          estado: string
          fecha_cita: string
          id: string
          paciente: string
        }[]
      }
      registrar_evento_manual: {
        Args: {
          p_descripcion?: string
          p_evento_tipo: string
          p_google_event_id: string
          p_metadata?: Json
          p_usuario_origen?: string
        }
        Returns: undefined
      }
      registrar_recordatorio_enviado: {
        Args: {
          p_google_event_id: string
          p_mensaje?: string
          p_tipo_recordatorio?: string
        }
        Returns: {
          mensaje: string
          primera_notificacion: boolean
          recordatorio_numero: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      dashboard_type: "evolution" | "n8n" | "secretaria"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      dashboard_type: ["evolution", "n8n", "secretaria"],
    },
  },
} as const
