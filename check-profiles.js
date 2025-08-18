import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

async function checkProfiles() {
  try {
    // Check profiles table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 profiles table structure:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Sample data
    const sampleResult = await pool.query('SELECT * FROM profiles LIMIT 3');
    console.log('\n📊 Sample profiles data:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${JSON.stringify(row, null, 2)}`);
    });
    
    // Check user_roles
    console.log('\n👥 User roles:');
    const rolesResult = await pool.query('SELECT * FROM user_roles');
    rolesResult.rows.forEach(row => {
      console.log(`  - User ${row.user_id}: ${row.role}`);
    });
    
    // Check permissions
    console.log('\n🔐 Dashboard permissions:');
    const permsResult = await pool.query('SELECT * FROM user_dashboard_permissions');
    permsResult.rows.forEach(row => {
      console.log(`  - User ${row.user_id}: ${row.dashboard_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkProfiles();