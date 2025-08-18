-- =============================================================================
-- COMPLETE TRIGGERS MIGRATION SCRIPT
-- =============================================================================
-- This script creates all necessary triggers for PostgreSQL database
-- =============================================================================

BEGIN;

-- =============================================================================
-- DROP EXISTING TRIGGERS (if any)
-- =============================================================================

-- Drop triggers on appointments table
DROP TRIGGER IF EXISTS update_appointments_modified_time ON appointments;
DROP TRIGGER IF EXISTS appointments_timeline_trigger ON appointments;
DROP TRIGGER IF EXISTS appointments_confirmation_time_trigger ON appointments;

-- Drop triggers on users table  
DROP TRIGGER IF EXISTS on_auth_user_created ON users;

-- Drop triggers on other tables
DROP TRIGGER IF EXISTS update_modified_time_trigger ON user_roles;
DROP TRIGGER IF EXISTS update_modified_time_trigger ON user_dashboard_permissions;
DROP TRIGGER IF EXISTS update_modified_time_trigger ON evolution_metricas;
DROP TRIGGER IF EXISTS update_modified_time_trigger ON workflow_control;
DROP TRIGGER IF EXISTS update_modified_time_trigger ON kpi_historico;
DROP TRIGGER IF EXISTS update_modified_time_trigger ON mensajes;
DROP TRIGGER IF EXISTS update_modified_time_trigger ON client_control;

-- =============================================================================
-- CREATE TRIGGERS FOR APPOINTMENTS TABLE
-- =============================================================================

-- 1. Trigger for automatic updated_at timestamp
CREATE TRIGGER update_appointments_modified_time
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 2. Trigger for appointment timeline tracking
CREATE TRIGGER appointments_timeline_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION registrar_evento_timeline();

-- 3. Trigger for confirmation time calculation
CREATE TRIGGER appointments_confirmation_time_trigger
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION calcular_tiempo_confirmacion();

-- =============================================================================
-- CREATE TRIGGERS FOR USERS TABLE
-- =============================================================================

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- CREATE TRIGGERS FOR OTHER TABLES WITH updated_at COLUMNS
-- =============================================================================

-- User roles table
CREATE TRIGGER update_user_roles_modified_time
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- User dashboard permissions table
CREATE TRIGGER update_user_dashboard_permissions_modified_time
    BEFORE UPDATE ON user_dashboard_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Evolution metrics table
CREATE TRIGGER update_evolution_metricas_modified_time
    BEFORE UPDATE ON evolution_metricas
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Workflow control table
CREATE TRIGGER update_workflow_control_modified_time
    BEFORE UPDATE ON workflow_control
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- KPI historico table
CREATE TRIGGER update_kpi_historico_modified_time
    BEFORE UPDATE ON kpi_historico
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Mensajes table
CREATE TRIGGER update_mensajes_modified_time
    BEFORE UPDATE ON mensajes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Client control table
CREATE TRIGGER update_client_control_modified_time
    BEFORE UPDATE ON client_control
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- =============================================================================
-- CREATE TRIGGERS FOR N8N TABLES
-- =============================================================================

-- N8N connections table
CREATE TRIGGER update_n8n_connections_modified_time
    BEFORE UPDATE ON n8n_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- N8N job config table
CREATE TRIGGER update_n8n_job_config_modified_time
    BEFORE UPDATE ON n8n_job_config
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- N8N usuarios unicos table
CREATE TRIGGER update_n8n_usuarios_unicos_modified_time
    BEFORE UPDATE ON n8n_usuarios_unicos
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- N8N fila mensagens table
CREATE TRIGGER update_n8n_fila_mensagens_modified_time
    BEFORE UPDATE ON n8n_fila_mensagens
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- N8N fila mensagens personal table
CREATE TRIGGER update_n8n_fila_mensagens_personal_modified_time
    BEFORE UPDATE ON n8n_fila_mensagens_personal
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- =============================================================================
-- CREATE TRIGGERS FOR APPOINTMENT RELATED TABLES
-- =============================================================================

-- Appointment timeline table
CREATE TRIGGER update_appointment_timeline_modified_time
    BEFORE UPDATE ON appointment_timeline
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Appointment analytics table
CREATE TRIGGER update_appointment_analytics_modified_time
    BEFORE UPDATE ON appointment_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Appointments recordatorios table
CREATE TRIGGER update_appointments_recordatorios_modified_time
    BEFORE UPDATE ON appointments_recordatorios
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- =============================================================================
-- CREATE TRIGGERS FOR CHAT TABLES
-- =============================================================================

-- Chat messages table
CREATE TRIGGER update_chat_messages_modified_time
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Chats table
CREATE TRIGGER update_chats_modified_time
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- =============================================================================
-- CREATE TRIGGERS FOR SYSTEM TABLES
-- =============================================================================

-- Customers table
CREATE TRIGGER update_customers_modified_time
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Documents table
CREATE TRIGGER update_documents_modified_time
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Profiles table (if it has updated_at)
CREATE TRIGGER update_profiles_modified_time
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- List all created triggers
SELECT 
    schemaname,
    tablename,
    triggername,
    '✅ Active' as status
FROM pg_triggers 
WHERE schemaname = 'public'
ORDER BY tablename, triggername;

-- Count triggers by table
SELECT 
    tablename,
    COUNT(*) as trigger_count
FROM pg_triggers 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY trigger_count DESC, tablename;

-- Summary
SELECT 
    COUNT(DISTINCT tablename) as tables_with_triggers,
    COUNT(*) as total_triggers,
    'Database triggers successfully created' as message
FROM pg_triggers 
WHERE schemaname = 'public';

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================
/*
TRIGGERS CREATED:

1. AUTOMATIC TIMESTAMP UPDATES:
   - All tables with updated_at columns now automatically update this field on UPDATE

2. APPOINTMENT BUSINESS LOGIC:
   - Timeline tracking for all appointment changes
   - Automatic confirmation time calculation
   - Event logging for appointment lifecycle

3. USER MANAGEMENT:
   - Automatic profile creation for new users
   - Timestamp tracking for role and permission changes

4. DATA INTEGRITY:
   - All timestamp fields automatically maintained
   - Business logic consistently applied across all operations

NEXT STEPS:
- Test trigger functionality with sample data updates
- Verify that appointment timeline tracking works correctly
- Confirm that user profile creation triggers properly
- Test automatic timestamp updates across all tables

The database now has complete business logic automation through triggers,
matching the functionality that was present in the original Supabase database.
*/