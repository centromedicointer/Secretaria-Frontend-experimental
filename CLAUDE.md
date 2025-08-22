# CLAUDE.md - Frontend Dashboard

This file provides guidance to Claude Code when working with the React dashboard in this **SEPARATE** repository.

## Project Overview

This is a **Sistema de Gestión Médica con WhatsApp Enterprise** - a comprehensive React dashboard for real-time medical appointment management, WhatsApp automation, and analytics that connects to PostgreSQL via Supabase.

**Repository Structure**: This frontend is now in a separate repository from the main backend system for independent development and deployment.

## Architecture

```
PostgreSQL Database → Supabase API → React Dashboard (This Frontend)
        ↓                ↓              ↓
   RLS Security    Real-time Subs    Component UI
   Custom Functions   React Query     shadcn/ui
```

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling (port 8082)
- **Supabase** for database connection and real-time subscriptions
- **Tailwind CSS** + **shadcn/ui** for styling
- **React Router v6** with HashRouter for navigation
- **Recharts** for data visualization and analytics
- **React Query (@tanstack/react-query)** for server state management
- **Radix UI** components for accessibility

## Key Components

### Core Pages
- `src/pages/Index.tsx` - Hub de dashboards con control de permisos por usuario
- `src/pages/EvolutionDashboard.tsx` - Dashboard principal de secretaria con métricas WhatsApp
- `src/pages/EvolutionDashboardSimple.tsx` - Versión simplificada del dashboard
- `src/pages/N8nDashboard.tsx` - Monitoreo de workflows y automatización
- `src/pages/Login.tsx` - Autenticación con Supabase Auth
- `src/pages/Admin.tsx` - Panel de administración de usuarios y permisos
- `src/pages/Profile.tsx` - Gestión de perfil de usuario

### Specialized Components
#### Analytics & Visualizations
- `src/components/analytics/AppointmentAnalyticsDashboard.tsx` - Dashboard completo de citas médicas
- `src/components/analytics/HeatmapOcupacion.tsx` - Heatmap de ocupación por hora/día
- `src/components/analytics/MetricasPorDia.tsx` - Métricas agregadas por día
- `src/components/analytics/MetricasPorHora.tsx` - Distribución horaria de citas
- `src/components/analytics/WeeklyTrendsChart.tsx` - Tendencias semanales

#### Metric Cards (Modular Dashboard Components)
- `src/components/metric-cards/DashboardSecretariaCards.tsx` - Métricas de secretaria virtual
- `src/components/metric-cards/ConfirmationMetricsCards.tsx` - Análisis de confirmaciones
- `src/components/metric-cards/ClasificadorMetricsCards.tsx` - Métricas de IA para clasificación
- `src/components/metric-cards/TimelineMetricsCards.tsx` - Timeline de eventos de citas
- `src/components/metric-cards/NotificationMetricsCards.tsx` - Métricas de notificaciones

### Data Integration
- `src/integrations/supabase/client.ts` - Cliente Supabase configurado
- `src/integrations/supabase/types.ts` - Tipos TypeScript generados automáticamente
- `src/hooks/` - Custom React hooks para data fetching
  - `useAppointmentAnalytics.ts` - Hook para analytics de citas
  - `useDashboardPermissions.ts` - Control de permisos por dashboard
  - `useAuth.ts` - Gestión de autenticación
- `src/components/` - Componentes UI reutilizables con shadcn/ui

## Development Commands

### Setup and Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Required environment variables:
VITE_SUPABASE_URL=https://vdrfdlpwycoghtpqdgvx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Integration

### Core Tables (42 tables total)
#### Medical Appointments System
- `appointments` - Gestión completa de citas médicas con Google Calendar integration
- `appointment_analytics` - Métricas detalladas y KPIs de citas por fecha
- `appointment_timeline` - Timeline de eventos de cada cita (confirmación, reagendado, etc.)
- `appointments_recordatorios` - Historial de recordatorios enviados por cita

#### WhatsApp & Evolution API
- `evolution_metricas` - Métricas en tiempo real de WhatsApp (mensajes, audios, imágenes)
- `chat_messages` - Mensajes individuales del chat
- `chats` - Conversaciones y sesiones de chat
- `customers` - Base de datos de clientes/pacientes

#### N8n Automation & AI
- `n8n_mensajes` - Procesamiento de mensajes con IA
- `n8n_metricas_clasificador` - Métricas del clasificador de IA (GPT)
- `n8n_errores_whatsapp` - Cola de errores y reintentos de WhatsApp
- `n8n_sesiones_chat` - Sesiones y duraciones de chat
- `n8n_connections` - Configuraciones de conexión a N8n por usuario

#### System Control & Security
- `client_control` - Control bot activo vs agente humano por cliente
- `workflow_control` - Estado de workflows (activo/inactivo)
- `user_roles` - Roles de usuario (admin, moderator, user)
- `user_dashboard_permissions` - Permisos granulares por dashboard

### Optimized Views (16 views for performance)
- `v_dashboard_hoy` - Vista principal del dashboard de hoy con métricas calculadas
- `v_dashboard_semana` - Comparación semanal de métricas
- `v_heatmap_ocupacion` - Datos pre-calculados para heatmap de ocupación
- `v_metricas_por_dia` - Métricas agregadas por día de la semana
- `v_metricas_por_horario` - Distribución por bloques horarios
- `v_dashboard_secretaria` - Métricas específicas de secretaria virtual
- `v_dashboard_sistema` - Estado general del sistema
- `v_analisis_pacientes` - Análisis de comportamiento de pacientes

### Advanced Database Functions (30+ functions)
- `confirmar_cita(p_telefono)` - Confirma citas por teléfono
- `detectar_no_shows()` - Detección automática de no-shows
- `registrar_cita()` - Registro de nuevas citas con validaciones
- `procesar_metrica_whatsapp()` - Procesamiento de métricas en tiempo real
- `get_heatmap_data()` - Datos optimizados para visualizaciones
- `actualizar_metricas_dia(p_fecha)` - Recálculo de métricas diarias

### Data Fetching Patterns
```typescript
// Real-time metrics with auto-refresh
const { data: metrics, isLoading } = useQuery({
  queryKey: ['evolution-metrics'],
  queryFn: () => supabase
    .from('evolution_metricas')
    .select('*')
    .single(),
  refetchInterval: 30000 // Auto-refresh every 30s
});

// Complex analytics with view optimization
const { data: heatmapData } = useQuery({
  queryKey: ['heatmap-ocupacion'],
  queryFn: () => supabase
    .from('v_heatmap_ocupacion')
    .select('*')
    .order('dia_num', { ascending: true })
    .order('hora', { ascending: true })
});

// Function calls for server-side processing
const detectNoShows = async () => {
  const { data } = await supabase.rpc('detectar_no_shows');
  return data;
};
```

## Common Development Tasks

### Adding New Dashboard Components
1. Create component in `src/components/`
2. Add data fetching hook if needed
3. Update routing in `src/App.tsx`
4. Add to navigation if required

### Connecting to New Database Tables
1. Add types in `src/integrations/supabase/types.ts`
2. Create custom hook in `src/hooks/`
3. Use in components with proper error handling

### Styling Guidelines
- Use Tailwind CSS classes
- Follow existing component patterns
- Ensure responsive design
- Use consistent color scheme

### Performance Considerations
- Use React Query for caching
- Implement proper loading states
- Optimize re-renders with useMemo/useCallback
- Lazy load heavy components

## Detailed File Structure

```
📁 Secretaria-Frontend-experimental/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 analytics/              # Advanced analytics components
│   │   │   ├── AppointmentAnalyticsDashboard.tsx
│   │   │   ├── HeatmapOcupacion.tsx
│   │   │   ├── MetricasPorDia.tsx
│   │   │   └── WeeklyTrendsChart.tsx
│   │   ├── 📁 metric-cards/           # Modular dashboard cards
│   │   │   ├── DashboardSecretariaCards.tsx
│   │   │   ├── ConfirmationMetricsCards.tsx
│   │   │   ├── ClasificadorMetricsCards.tsx
│   │   │   └── TimelineMetricsCards.tsx
│   │   ├── 📁 ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── chart.tsx
│   │   │   └── [40+ UI components]
│   │   ├── EvolutionMetrics.tsx       # Main metrics component
│   │   ├── WeeklyMetricsFlexible.tsx  # Configurable weekly metrics
│   │   ├── DashboardProtectedRoute.tsx # Permission-based routing
│   │   └── GoogleCalendarManager.tsx   # Calendar integration
│   ├── 📁 hooks/                      # Custom React hooks
│   │   ├── useAppointmentAnalytics.ts # Analytics data fetching
│   │   ├── useDashboardPermissions.ts # User permissions
│   │   ├── useAuth.ts                 # Authentication state
│   │   └── useSecurityMonitoring.ts   # Security alerts
│   ├── 📁 integrations/
│   │   ├── 📁 supabase/
│   │   │   ├── client.ts              # Supabase client config
│   │   │   └── types.ts               # Auto-generated DB types (2200+ lines)
│   │   └── 📁 postgres/               # Direct PostgreSQL integration
│   ├── 📁 pages/                      # Main application pages
│   │   ├── Index.tsx                  # Dashboard hub with permissions
│   │   ├── EvolutionDashboard.tsx     # Main secretaria dashboard
│   │   ├── N8nDashboard.tsx           # N8n workflow monitoring
│   │   ├── Login.tsx                  # Authentication
│   │   ├── Admin.tsx                  # User administration
│   │   └── Profile.tsx                # User profile management
│   ├── 📁 contexts/
│   │   └── AuthContext.tsx            # Global auth state
│   ├── 📁 lib/                        # Utility libraries
│   │   ├── api.ts                     # API helpers
│   │   ├── auth.ts                    # Auth utilities
│   │   ├── database.ts                # Database helpers
│   │   └── utils.ts                   # Common utilities
│   ├── App.tsx                        # Main app with routing
│   └── main.tsx                       # Application entry point
├── 📁 supabase/                       # Supabase configuration
│   ├── 📁 functions/                  # Edge functions
│   │   ├── admin-users/
│   │   ├── google-calendar/
│   │   └── n8n-secure-api/
│   ├── 📁 migrations/                 # Database migrations (20+ files)
│   └── config.toml                    # Supabase config
├── 📁 public/                         # Static assets
├── 📄 package.json                    # Dependencies (70+ packages)
├── 📄 vite.config.ts                  # Vite configuration (port 8082)
├── 📄 tailwind.config.ts              # Tailwind + shadcn/ui config
├── 📄 tsconfig.json                   # TypeScript configuration
└── 📄 CLAUDE.md                       # This documentation file
```

## Troubleshooting

### Common Issues
- **Supabase connection errors**: Check environment variables
- **Type errors**: Run `npm run type-check`
- **Build failures**: Clear node_modules and reinstall
- **Data not loading**: Verify database permissions in Supabase

### Development Notes
- Dashboard updates in real-time via Supabase subscriptions
- Charts auto-refresh every 30 seconds
- Error boundaries handle API failures gracefully
- All database queries use Row Level Security (RLS)

## System Features & Capabilities

### 🏥 Medical Appointment Management
- **Real-time appointment tracking** with Google Calendar integration
- **Automatic no-show detection** with configurable time windows
- **Patient behavior analysis** and risk classification
- **Confirmation timeline tracking** with response time analytics
- **Heatmap visualization** of appointment occupancy by hour/day

### 📱 WhatsApp Integration & Automation
- **Evolution API integration** for WhatsApp Business
- **Real-time message metrics** (sent, received, delivered, read)
- **Multimedia tracking** (audio, images, documents, videos)
- **Bot vs Human agent control** per client
- **Error handling and retry queue** for failed messages

### 🤖 AI-Powered Features
- **Message classification** with GPT models for intent detection
- **Automated appointment scheduling** through natural language processing
- **Smart reminders** with personalized messaging
- **Pattern analysis** for conversation optimization
- **Cost tracking** for AI model usage

### 🔐 Enterprise Security & Permissions
- **Role-based access control** (admin, moderator, user)
- **Dashboard-specific permissions** (evolution, n8n, secretaria)
- **Row Level Security (RLS)** on all database operations
- **Phone number masking** for sensitive data protection
- **Automatic data cleanup** for compliance

### 📊 Advanced Analytics & Reporting
- **Multi-dimensional dashboards** with 3 view modes (Basic, Advanced, Legacy)
- **Configurable metric cards** with toggle on/off functionality
- **Real-time heatmaps** for appointment density visualization
- **Weekly trend analysis** with flexible date ranges
- **Performance KPIs** with automated alerts

### ⚙️ System Administration
- **User management** with granular permission assignment
- **Workflow control** for automation processes
- **Connection management** for N8n integrations
- **Monitoring dashboards** for system health
- **Automated maintenance** with scheduled jobs

## Version Information
- **Project Type**: Sistema de Gestión Médica con WhatsApp Enterprise
- **Frontend Version**: v1.0.0.2 (aligned with main system v2.1.2)
- **React Version**: 18.3.1
- **Database**: PostgreSQL with 42 tables, 16 optimized views, 30+ functions
- **Last Updated**: August 22, 2025
- **Status**: Production Ready - Enterprise Grade
- **Architecture**: Microservices with real-time capabilities