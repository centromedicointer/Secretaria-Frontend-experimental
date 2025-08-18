import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

// Datos de Supabase obtenidos via MCP
const userRolesData = [
  {
    id: "debf2e11-802a-42a3-9823-f7bd92d090a1",
    user_id: "2f44d32f-e782-4928-a1ed-56b33a6e0f90",
    role: "admin",
    granted_at: "2025-06-17 03:46:13.637533+00",
    granted_by: null
  }
];

const userDashboardPermissionsData = [
  {
    id: "633d6e14-4585-4042-842e-1ceef471ff5b",
    user_id: "a3ef93a2-51d9-44d5-a6b4-4a4b02b00726",
    dashboard_type: "evolution",
    granted_at: "2025-06-17 04:08:02.876373+00",
    granted_by: null
  },
  {
    id: "8deacfd5-13ac-44e8-b13c-06480967b77f",
    user_id: "a3ef93a2-51d9-44d5-a6b4-4a4b02b00726",
    dashboard_type: "n8n",
    granted_at: "2025-06-21 06:53:03.249229+00",
    granted_by: null
  },
  {
    id: "0f930f3c-7cfd-4959-bc9f-48d2201efcad",
    user_id: "2f44d32f-e782-4928-a1ed-56b33a6e0f90",
    dashboard_type: "secretaria",
    granted_at: "2025-08-02 16:36:09.266012+00",
    granted_by: null
  },
  {
    id: "64617556-aecb-4aa0-a441-8df1660d3545",
    user_id: "2f44d32f-e782-4928-a1ed-56b33a6e0f90",
    dashboard_type: "n8n",
    granted_at: "2025-08-11 16:48:46.839718+00",
    granted_by: null
  },
  {
    id: "cdd762c8-5056-417b-8502-2f16a0a243e0",
    user_id: "2f44d32f-e782-4928-a1ed-56b33a6e0f90",
    dashboard_type: "evolution",
    granted_at: "2025-08-11 16:48:48.327779+00",
    granted_by: null
  },
  {
    id: "bcfae345-327a-4d1d-bd14-6ecfed829069",
    user_id: "43fd8d14-d7ac-4b99-a504-4f1f748ca127",
    dashboard_type: "secretaria",
    granted_at: "2025-08-11 17:02:13.708999+00",
    granted_by: null
  },
  {
    id: "c63014a9-149e-4716-b543-da6795ee458b",
    user_id: "1c3ac265-56c8-4fd3-82ce-c46b16250dd5",
    dashboard_type: "secretaria",
    granted_at: "2025-08-17 06:29:22.283201+00",
    granted_by: null
  },
  {
    id: "7d028dc6-383b-4e3c-b348-507294de9792",
    user_id: "1c3ac265-56c8-4fd3-82ce-c46b16250dd5",
    dashboard_type: "evolution",
    granted_at: "2025-08-18 05:28:21.898349+00",
    granted_by: null
  }
];

async function recreateCriticalTables() {
  try {
    console.log('🔄 Recreating critical tables with exact Supabase structure...');
    
    // 1. Drop existing tables
    console.log('🗑️  Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS user_dashboard_permissions CASCADE');
    await pool.query('DROP TABLE IF EXISTS user_roles CASCADE');
    
    // 2. Recreate user_roles table with exact structure
    console.log('📋 Creating user_roles table...');
    await pool.query(`
      CREATE TABLE user_roles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        role VARCHAR(50) NOT NULL,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        granted_by UUID,
        UNIQUE(user_id, role)
      )
    `);
    
    // 3. Recreate user_dashboard_permissions table with exact structure  
    console.log('📋 Creating user_dashboard_permissions table...');
    await pool.query(`
      CREATE TABLE user_dashboard_permissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        dashboard_type VARCHAR(50) NOT NULL,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        granted_by UUID,
        UNIQUE(user_id, dashboard_type)
      )
    `);
    
    // 4. Insert user_roles data
    console.log('👥 Inserting user_roles data...');
    for (const role of userRolesData) {
      await pool.query(`
        INSERT INTO user_roles (id, user_id, role, granted_at, granted_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, role) DO UPDATE SET
          granted_at = EXCLUDED.granted_at
      `, [role.id, role.user_id, role.role, role.granted_at, role.granted_by]);
    }
    console.log(`  ✅ Inserted ${userRolesData.length} roles`);
    
    // 5. Insert user_dashboard_permissions data
    console.log('🔐 Inserting user_dashboard_permissions data...');
    for (const perm of userDashboardPermissionsData) {
      await pool.query(`
        INSERT INTO user_dashboard_permissions (id, user_id, dashboard_type, granted_at, granted_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, dashboard_type) DO UPDATE SET
          granted_at = EXCLUDED.granted_at
      `, [perm.id, perm.user_id, perm.dashboard_type, perm.granted_at, perm.granted_by]);
    }
    console.log(`  ✅ Inserted ${userDashboardPermissionsData.length} permissions`);
    
    // 6. Verify data
    console.log('\n📊 Verifying migrated data...');
    
    const rolesResult = await pool.query('SELECT user_id, role FROM user_roles');
    console.log('  👥 User roles:');
    rolesResult.rows.forEach(row => {
      console.log(`    - ${row.user_id}: ${row.role}`);
    });
    
    const permsResult = await pool.query('SELECT user_id, dashboard_type FROM user_dashboard_permissions ORDER BY user_id, dashboard_type');
    console.log('  🔐 Dashboard permissions:');
    const permsByUser = {};
    permsResult.rows.forEach(row => {
      if (!permsByUser[row.user_id]) permsByUser[row.user_id] = [];
      permsByUser[row.user_id].push(row.dashboard_type);
    });
    
    Object.entries(permsByUser).forEach(([userId, dashboards]) => {
      console.log(`    - ${userId}: ${dashboards.join(', ')}`);
    });
    
    console.log('\n🎉 Critical tables recreated successfully!');
    console.log('\n🔑 Test login credentials:');
    console.log('  Email: cmit.tapachula@gmail.com');
    console.log('  Password: (any password)');
    console.log('  Permissions: admin role + evolution, n8n, secretaria dashboards');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

recreateCriticalTables();