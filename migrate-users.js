import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

// Datos de usuarios de Supabase
const users = [
  {
    id: "43fd8d14-d7ac-4b99-a504-4f1f748ca127",
    email: "cmit_tapachula@outlook.com",
    encrypted_password: "$2a$10$VzfhgA5B4VLMq38kteiGQuieD4qBdD.OPUNiM3J3a89uDlidc1qmO",
    created_at: "2025-08-11 16:51:24.65242+00",
    updated_at: "2025-08-11 18:08:04.175123+00"
  },
  {
    id: "a3ef93a2-51d9-44d5-a6b4-4a4b02b00726",
    email: "centromedicointerlomas@gmail.com", 
    encrypted_password: "$2a$10$j/iW5GL26cwutbcIWZm2VuRWhyGTra62SIoV1qyu9P8ZBuuIed4Qe",
    created_at: "2025-06-17 03:35:48.752128+00",
    updated_at: "2025-07-08 00:37:43.864989+00"
  },
  {
    id: "2f44d32f-e782-4928-a1ed-56b33a6e0f90",
    email: "cmit.tapachula@gmail.com",
    encrypted_password: "$2a$10$QPNUBW0rti7N0eoYv1.8fOi8uVHy/dVq4xa4T0IlDVeMfX.528E..",
    created_at: "2025-06-14 19:41:52.537341+00",
    updated_at: "2025-08-18 06:05:57.399344+00"
  },
  {
    id: "1c3ac265-56c8-4fd3-82ce-c46b16250dd5",
    email: "hrincon@hotmail.com",
    encrypted_password: "$2a$10$6L9I.ajEa4jO.njfuRc9CeB9ntgI896v/FGPKLod8Cg4S60Qo5WVO",
    created_at: "2025-08-17 06:29:07.281396+00",
    updated_at: "2025-08-17 06:29:45.153172+00"
  }
];

async function migrateUsers() {
  try {
    console.log('🚀 Starting user migration...');
    
    // 1. Crear tabla users
    console.log('📋 Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        encrypted_password VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ Users table created');
    
    // 2. Insertar usuarios
    console.log('👥 Inserting users...');
    for (const user of users) {
      await pool.query(`
        INSERT INTO users (id, email, encrypted_password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
          encrypted_password = EXCLUDED.encrypted_password,
          updated_at = EXCLUDED.updated_at
      `, [user.id, user.email, user.encrypted_password, user.created_at, user.updated_at]);
      
      console.log(`  ✓ ${user.email}`);
    }
    
    // 3. Verificar datos
    const result = await pool.query('SELECT id, email, created_at FROM users ORDER BY created_at');
    console.log('\n📊 Migrated users:');
    result.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.id})`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n🔑 You can now login with any of these emails and any password (for testing)');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await pool.end();
  }
}

migrateUsers();