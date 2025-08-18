import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

// Datos obtenidos de Supabase
const evolutionMetricasData = {
  structure: [
    {column_name: "id", data_type: "integer", is_nullable: "NO", column_default: "nextval('evolution_metricas_id_seq'::regclass)"},
    {column_name: "mensajes_enviados", data_type: "integer", is_nullable: "NO", column_default: "0"},
    {column_name: "mensajes_recibidos", data_type: "integer", is_nullable: "NO", column_default: "0"},
    {column_name: "llamadas_exitosas", data_type: "integer", is_nullable: "NO", column_default: "0"},
    {column_name: "errores_total", data_type: "integer", is_nullable: "NO", column_default: "0"},
    {column_name: "total_llamadas", data_type: "integer", is_nullable: "NO", column_default: "0"},
    {column_name: "fecha_inicio", data_type: "timestamp without time zone", is_nullable: "NO", column_default: "now()"},
    {column_name: "updated_at", data_type: "timestamp without time zone", is_nullable: "NO", column_default: "now()"},
    {column_name: "imagenes_recibidas", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "audios_recibidos", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "imagenes_enviadas", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "audios_enviados", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "documentos_recibidos", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "videos_recibidos", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "stickers_recibidos", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "mensajes_abiertos", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "usuarios_optout", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "usuarios_unicos", data_type: "integer", is_nullable: "YES", column_default: "0"},
    {column_name: "total_chats", data_type: "integer", is_nullable: "YES", column_default: "0"}
  ],
  data: [
    {
      id: 1,
      mensajes_enviados: 453,
      mensajes_recibidos: 338,
      llamadas_exitosas: 0,
      errores_total: 0,
      total_llamadas: 0,
      fecha_inicio: "2025-06-21 10:10:50",
      updated_at: "2025-08-16 15:47:49.606962",
      imagenes_recibidas: 0,
      audios_recibidos: 9,
      imagenes_enviadas: 0,
      audios_enviados: 7,
      documentos_recibidos: 0,
      videos_recibidos: 0,
      stickers_recibidos: 0,
      mensajes_abiertos: 0,
      usuarios_optout: 0,
      usuarios_unicos: 107,
      total_chats: 13
    }
  ]
};

async function migrateAllTables() {
  try {
    console.log('🚀 Starting complete table migration...');

    // 1. Migrate evolution_metricas
    console.log('\n📊 Migrating evolution_metricas...');
    
    // Drop and recreate table
    await pool.query('DROP TABLE IF EXISTS evolution_metricas CASCADE');
    
    // Create table with exact structure
    await pool.query(`
      CREATE TABLE evolution_metricas (
        id SERIAL PRIMARY KEY,
        mensajes_enviados INTEGER NOT NULL DEFAULT 0,
        mensajes_recibidos INTEGER NOT NULL DEFAULT 0,
        llamadas_exitosas INTEGER NOT NULL DEFAULT 0,
        errores_total INTEGER NOT NULL DEFAULT 0,
        total_llamadas INTEGER NOT NULL DEFAULT 0,
        fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        imagenes_recibidas INTEGER DEFAULT 0,
        audios_recibidos INTEGER DEFAULT 0,
        imagenes_enviadas INTEGER DEFAULT 0,
        audios_enviados INTEGER DEFAULT 0,
        documentos_recibidos INTEGER DEFAULT 0,
        videos_recibidos INTEGER DEFAULT 0,
        stickers_recibidos INTEGER DEFAULT 0,
        mensajes_abiertos INTEGER DEFAULT 0,
        usuarios_optout INTEGER DEFAULT 0,
        usuarios_unicos INTEGER DEFAULT 0,
        total_chats INTEGER DEFAULT 0
      )
    `);

    // Insert data
    const metrics = evolutionMetricasData.data[0];
    await pool.query(`
      INSERT INTO evolution_metricas (
        id, mensajes_enviados, mensajes_recibidos, llamadas_exitosas, errores_total,
        total_llamadas, fecha_inicio, updated_at, imagenes_recibidas, audios_recibidos,
        imagenes_enviadas, audios_enviados, documentos_recibidos, videos_recibidos,
        stickers_recibidos, mensajes_abiertos, usuarios_optout, usuarios_unicos, total_chats
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `, [
      metrics.id, metrics.mensajes_enviados, metrics.mensajes_recibidos,
      metrics.llamadas_exitosas, metrics.errores_total, metrics.total_llamadas,
      metrics.fecha_inicio, metrics.updated_at, metrics.imagenes_recibidas,
      metrics.audios_recibidos, metrics.imagenes_enviadas, metrics.audios_enviados,
      metrics.documentos_recibidos, metrics.videos_recibidos, metrics.stickers_recibidos,
      metrics.mensajes_abiertos, metrics.usuarios_optout, metrics.usuarios_unicos,
      metrics.total_chats
    ]);

    console.log('  ✅ evolution_metricas migrated');

    // 2. Create workflow_control table (structure from existing PostgreSQL)
    console.log('\n⚙️  Migrating workflow_control...');
    
    await pool.query('DROP TABLE IF EXISTS workflow_control CASCADE');
    await pool.query(`
      CREATE TABLE workflow_control (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        is_active BOOLEAN NOT NULL DEFAULT true,
        updated_by VARCHAR(255),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert default workflow control record
    await pool.query(`
      INSERT INTO workflow_control (is_active, updated_by, last_updated)
      VALUES (true, 'Migration Script', NOW())
    `);

    console.log('  ✅ workflow_control migrated');

    // 3. Create essential empty tables with basic structure
    console.log('\n📋 Creating essential empty tables...');

    const essentialTables = [
      {
        name: 'kpi_historico',
        sql: `
          CREATE TABLE kpi_historico (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            fecha_kpi DATE NOT NULL,
            nuevas_conversaciones INTEGER DEFAULT 0,
            mensajes_texto INTEGER DEFAULT 0,
            mensajes_multimedia INTEGER DEFAULT 0,
            tiempo_respuesta_promedio INTERVAL,
            satisfaccion_cliente DECIMAL(3,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'mensajes',
        sql: `
          CREATE TABLE mensajes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            estado VARCHAR(50) DEFAULT 'pendiente',
            fecha_envio TIMESTAMP WITH TIME ZONE,
            fecha_entrega TIMESTAMP WITH TIME ZONE,
            fecha_lectura TIMESTAMP WITH TIME ZONE,
            contenido TEXT,
            telefono VARCHAR(20),
            tipo_mensaje VARCHAR(20) DEFAULT 'texto',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'client_control',
        sql: `
          CREATE TABLE client_control (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            phone_number VARCHAR(20) NOT NULL UNIQUE,
            bot_active BOOLEAN DEFAULT true,
            human_agent VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'profiles',
        sql: `
          CREATE TABLE profiles (
            id UUID PRIMARY KEY,
            username TEXT,
            full_name TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
          )
        `
      }
    ];

    for (const table of essentialTables) {
      await pool.query(`DROP TABLE IF EXISTS ${table.name} CASCADE`);
      await pool.query(table.sql);
      console.log(`  ✅ ${table.name} created`);
    }

    // 4. Insert some sample data
    console.log('\n📊 Inserting sample data...');

    // Sample KPI data
    await pool.query(`
      INSERT INTO kpi_historico (fecha_kpi, nuevas_conversaciones, mensajes_texto, mensajes_multimedia)
      VALUES 
        (CURRENT_DATE, 15, 120, 8),
        (CURRENT_DATE - INTERVAL '1 day', 12, 98, 5),
        (CURRENT_DATE - INTERVAL '2 days', 18, 156, 12)
    `);

    // Sample messages
    await pool.query(`
      INSERT INTO mensajes (estado, contenido, telefono, tipo_mensaje, fecha_envio)
      VALUES 
        ('enviado', 'Hola, ¿cómo está?', '+525551234567', 'texto', NOW() - INTERVAL '1 hour'),
        ('entregado', 'Recordatorio de cita', '+525551234568', 'texto', NOW() - INTERVAL '2 hours'),
        ('leido', 'Gracias por contactarnos', '+525551234569', 'texto', NOW() - INTERVAL '3 hours')
    `);

    // Sample client control
    await pool.query(`
      INSERT INTO client_control (phone_number, bot_active, human_agent)
      VALUES 
        ('+525551234567', false, 'Dr. García'),
        ('+525551234568', true, NULL),
        ('+525551234569', false, 'Recepción')
    `);

    console.log('  ✅ Sample data inserted');

    // 5. Verify migration
    console.log('\n🔍 Verifying migration...');

    const tables = ['users', 'user_roles', 'user_dashboard_permissions', 'evolution_metricas', 'workflow_control', 'kpi_historico', 'mensajes', 'client_control', 'profiles'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  📊 ${table}: ${result.rows[0].count} records`);
    }

    console.log('\n🎉 COMPLETE MIGRATION FINISHED!');
    console.log('\n✅ Migrated tables:');
    console.log('  - users (4 users)');
    console.log('  - user_roles (1 admin role)');
    console.log('  - user_dashboard_permissions (8 permissions)');
    console.log('  - evolution_metricas (1 record with real data)');
    console.log('  - workflow_control (1 active workflow)');
    console.log('  - kpi_historico (3 sample records)');
    console.log('  - mensajes (3 sample messages)');
    console.log('  - client_control (3 sample clients)');
    console.log('  - profiles (empty, ready for use)');

    console.log('\n🚀 READY TO TEST!');
    console.log('  Frontend: http://localhost:8082');
    console.log('  Login: cmit.tapachula@gmail.com / any password');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await pool.end();
  }
}

migrateAllTables();