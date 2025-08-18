import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

async function createTestUser() {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testEmail = 'admin@secretaria.com';
    
    // Create profiles entry
    await pool.query(`
      INSERT INTO profiles (id, username, full_name, updated_at) 
      VALUES ($1, $2, $3, NOW()) 
      ON CONFLICT (id) DO UPDATE SET 
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        updated_at = NOW()
    `, [testUserId, testEmail, 'Administrador']);
    
    console.log('✅ User profile created/updated');
    
    // Check user roles
    const rolesResult = await pool.query('SELECT * FROM user_roles WHERE user_id = $1', [testUserId]);
    console.log(`📋 User roles: ${rolesResult.rows.length} found`);
    
    // Check dashboard permissions
    const permsResult = await pool.query('SELECT * FROM user_dashboard_permissions WHERE user_id = $1', [testUserId]);
    console.log(`🔐 Dashboard permissions: ${permsResult.rows.length} found`);
    
    // Add missing permissions if needed
    const dashboards = ['evolution', 'n8n', 'secretaria'];
    for (const dashboard of dashboards) {
      await pool.query(`
        INSERT INTO user_dashboard_permissions (user_id, dashboard_type) 
        VALUES ($1, $2) 
        ON CONFLICT (user_id, dashboard_type) DO NOTHING
      `, [testUserId, dashboard]);
    }
    
    console.log('✅ Dashboard permissions ensured');
    
    console.log('\n🔑 Test user credentials:');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: (any password will work for now)`);
    console.log(`User ID: ${testUserId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();