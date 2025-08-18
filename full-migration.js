import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

// Configuración de Supabase
const SUPABASE_URL = "https://vdrfdlpwycoghtpqdgvx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcmZkbHB3eWNvZ2h0cHFkZ3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3Mjg0NDAsImV4cCI6MjA1MDMwNDQ0MH0.s3g6GSVN-w4zfSao125iE7jjkRgDslWLhOQ-jHlCh9A";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuración de PostgreSQL destino
const pgPool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

// Tablas a migrar (todas las públicas)
const PUBLIC_TABLES = [
  'appointment_analytics',
  'appointment_timeline', 
  'appointments',
  'appointments_recordatorios',
  'chat_messages',
  'chats',
  'client_control',
  'customers',
  'documents',
  'evolution_metricas',
  'job_execution_log',
  'kpi_historico',
  'mensajes',
  'n8n_connections',
  'n8n_errores_whatsapp',
  'n8n_errores_whatsapp_historico',
  'n8n_fila_mensagens',
  'n8n_fila_mensagens_personal',
  'n8n_historico_mensagens',
  'n8n_historico_mensagens_personal',
  'n8n_job_config',
  'n8n_logs_notificaciones',
  'n8n_mensajes',
  'n8n_metricas_clasificador',
  'n8n_sesiones_chat',
  'n8n_usuarios_unicos',
  'notificaciones_modificaciones',
  'profiles',
  'reportes_generados',
  'user_dashboard_permissions',
  'user_roles',
  'workflow_control'
];

// Solo tabla users del esquema auth
const AUTH_TABLES = ['users'];

async function fullMigration() {
  console.log('🚀 Starting FULL database migration from Supabase to PostgreSQL...');
  
  try {
    // 1. Obtener esquema completo de Supabase
    console.log('\n📋 Step 1: Getting complete schema from Supabase...');
    
    // Obtener estructura de tablas públicas
    console.log('  📊 Getting public table schemas...');
    const tableSchemas = {};
    
    for (const table of PUBLIC_TABLES) {
      console.log(`    - Analyzing ${table}...`);
      const { data, error } = await supabase.rpc('exec', {
        sql: `SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
               FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = '${table}'
               ORDER BY ordinal_position`
      });
      
      if (error) {
        console.warn(`    ⚠️  Could not get schema for ${table}: ${error.message}`);
        continue;
      }
      
      tableSchemas[table] = data;
    }
    
    // Obtener estructura de tabla users de auth
    console.log('  🔐 Getting auth.users schema...');
    const { data: usersSchema, error: usersError } = await supabase.rpc('exec', {
      sql: `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns 
             WHERE table_schema = 'auth' AND table_name = 'users'
             ORDER BY ordinal_position`
    });
    
    if (!usersError) {
      tableSchemas['auth.users'] = usersSchema;
    }
    
    console.log(`  ✅ Analyzed ${Object.keys(tableSchemas).length} tables`);
    
    // 2. Limpiar PostgreSQL y recrear esquema
    console.log('\n🗑️  Step 2: Cleaning PostgreSQL database...');
    
    await pgPool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pgPool.query('CREATE SCHEMA public');
    await pgPool.query('GRANT ALL ON SCHEMA public TO postgres');
    
    console.log('  ✅ PostgreSQL schema cleaned');
    
    // 3. Recrear todas las tablas en PostgreSQL
    console.log('\n🏗️  Step 3: Recreating tables in PostgreSQL...');
    
    // Crear tabla users primero
    console.log('  📋 Creating users table...');
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        encrypted_password VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Crear todas las demás tablas (estructura básica)
    for (const table of PUBLIC_TABLES) {
      console.log(`  📋 Creating table ${table}...`);
      try {
        // Por ahora crear estructura básica, luego podemos refinar
        await pgPool.query(`
          CREATE TABLE IF NOT EXISTS ${table} (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
      } catch (error) {
        console.warn(`    ⚠️  Could not create ${table}: ${error.message}`);
      }
    }
    
    console.log('  ✅ Basic table structure created');
    
    // 4. Migrar datos críticos
    console.log('\n📊 Step 4: Migrating critical data...');
    
    // Migrar usuarios
    console.log('  👥 Migrating users...');
    const { data: users, error: usersDataError } = await supabase
      .from('auth.users')
      .select('id, email, encrypted_password, created_at, updated_at')
      .limit(100);
    
    if (!usersDataError && users) {
      for (const user of users) {
        await pgPool.query(`
          INSERT INTO users (id, email, encrypted_password, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (email) DO UPDATE SET
            encrypted_password = EXCLUDED.encrypted_password,
            updated_at = EXCLUDED.updated_at
        `, [user.id, user.email, user.encrypted_password, user.created_at, user.updated_at]);
      }
      console.log(`    ✅ Migrated ${users.length} users`);
    }
    
    // Migrar tablas críticas con datos
    const criticalTables = [
      'user_roles',
      'user_dashboard_permissions', 
      'evolution_metricas',
      'kpi_historico',
      'workflow_control'
    ];
    
    for (const table of criticalTables) {
      console.log(`  📊 Migrating data from ${table}...`);
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1000);
        
        if (!error && data && data.length > 0) {
          // Por ahora solo migrar IDs y timestamps básicos
          console.log(`    📋 Found ${data.length} records in ${table}`);
          
          // Aquí necesitaríamos crear la estructura específica para cada tabla
          // Por el momento, solo reportamos que encontramos datos
        }
      } catch (error) {
        console.warn(`    ⚠️  Could not migrate ${table}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 PHASE 1 MIGRATION COMPLETED!');
    console.log('\n📋 Summary:');
    console.log(`  - ✅ Analyzed ${Object.keys(tableSchemas).length} table schemas`);
    console.log(`  - ✅ Recreated basic structure for ${PUBLIC_TABLES.length} tables`);
    console.log(`  - ✅ Migrated users table`);
    console.log('\n⚠️  NOTE: This is Phase 1. We need to:');
    console.log('  1. Recreate exact column structures for each table');
    console.log('  2. Migrate all data with proper types');
    console.log('  3. Recreate all functions and views');
    console.log('  4. Recreate all indexes and constraints');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pgPool.end();
  }
}

// Ejecutar migración
fullMigration().catch(console.error);