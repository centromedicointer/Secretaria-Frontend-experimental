import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

async function setupPermissions() {
  try {
    const userId = "2f44d32f-e782-4928-a1ed-56b33a6e0f90"; // cmit.tapachula@gmail.com
    
    console.log('🔐 Setting up user permissions...');
    
    // Add admin role
    await pool.query(`
      INSERT INTO user_roles (user_id, role, created_at)
      VALUES ($1, 'admin', NOW())
      ON CONFLICT (user_id, role) DO NOTHING
    `, [userId]);
    
    console.log('✅ Admin role added');
    
    // Add dashboard permissions
    const dashboards = ['analytics', 'reports', 'admin', 'metrics'];
    for (const dashboard of dashboards) {
      await pool.query(`
        INSERT INTO user_dashboard_permissions (user_id, dashboard_type, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, dashboard_type) DO NOTHING
      `, [userId, dashboard]);
      
      console.log(`  ✓ ${dashboard} permission added`);
    }
    
    // Verify permissions
    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [userId]);
    const permsResult = await pool.query('SELECT dashboard_type FROM user_dashboard_permissions WHERE user_id = $1', [userId]);
    
    console.log('\n📋 Current user permissions:');
    console.log(`  Roles: ${rolesResult.rows.map(r => r.role).join(', ')}`);
    console.log(`  Dashboards: ${permsResult.rows.map(p => p.dashboard_type).join(', ')}`);
    
    console.log('\n🎉 Permissions setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

setupPermissions();