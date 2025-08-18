// Database types for PostgreSQL direct connection
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface UserDashboardPermission {
  id: string;
  user_id: string;
  dashboard_type: 'evolution' | 'n8n' | 'secretaria';
  created_at: string;
}

export interface EvolutionMetricas {
  id: string;
  total_conversaciones: number;
  mensajes_enviados: number;
  mensajes_recibidos: number;
  imagenes_enviadas: number;
  imagenes_recibidas: number;
  audios_enviados: number;
  audios_recibidos: number;
  videos_enviados: number;
  videos_recibidos: number;
  documentos_enviados: number;
  documentos_recibidos: number;
  total_llamadas: number;
  llamadas_exitosas: number;
  llamadas_fallidas: number;
  updated_at: string;
}

export interface KpiHistorico {
  id: string;
  fecha_kpi: string;
  nuevas_conversaciones: number;
  mensajes_texto: number;
  mensajes_multimedia: number;
  tiempo_respuesta_promedio: string;
  satisfaccion_cliente: number;
  updated_at: string;
}

export interface Mensajes {
  id: string;
  estado: string;
  fecha_envio: string | null;
  fecha_entrega: string | null;
  fecha_lectura: string | null;
  created_at: string;
}

export interface ClientControl {
  id: string;
  phone_number: string;
  bot_active: boolean;
  human_agent: string | null;
  updated_at: string;
}

export interface WorkflowControl {
  id: string;
  is_active: boolean;
  updated_by: string;
  last_updated: string;
}

export interface AppointmentAnalytics {
  fecha: string;
  total_agendadas: number;
  total_confirmadas: number;
  total_canceladas: number;
  total_completadas: number;
  total_no_show: number;
  tasa_confirmacion: number;
  tasa_cancelacion: number;
  tasa_completadas: number;
  tasa_no_show: number;
}

export interface N8nUsuariosUnicos {
  fecha: string;
  usuarios_unicos: number;
  mensajes_totales: number;
}