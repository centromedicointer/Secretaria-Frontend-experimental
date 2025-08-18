import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Check connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful:', testResult.rows[0]);
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check specific tables we need
    const requiredTables = ['users', 'user_roles', 'user_dashboard_permissions', 'evolution_metricas'];
    
    console.log('\n🔍 Checking required tables:');
    for (const table of requiredTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
        console.log(`  ✅ ${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();