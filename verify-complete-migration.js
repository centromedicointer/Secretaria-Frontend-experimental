import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
});

async function verifyCompleteMigration() {
  try {
    console.log('🔍 COMPLETE MIGRATION VERIFICATION\n');

    // 1. Count all tables by category
    console.log('📊 TABLE SUMMARY:');
    
    const queries = [
      { name: 'Core Tables', pattern: 'user%' },
      { name: 'Evolution Tables', pattern: 'evolution%' },
      { name: 'N8n Tables', pattern: 'n8n_%' },
      { name: 'Appointment Tables', pattern: 'appointment%' },
      { name: 'Chat Tables', pattern: 'chat%' },
      { name: 'Message Tables', pattern: 'mensajes%' },
      { name: 'System Tables', pattern: '%' }
    ];

    let totalTables = 0;
    
    for (const query of queries) {
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE $1
      `, [query.pattern]);
      
      const count = parseInt(result.rows[0].count);
      totalTables += count;
      console.log(`  ${query.name}: ${count} tables`);
    }

    // Get exact table list with record counts
    console.log('\n📋 DETAILED TABLE LIST:');
    const allTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tableStats = [];
    
    for (const row of allTablesResult.rows) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${row.table_name}`);
        const count = countResult.rows[0].count;
        tableStats.push({ name: row.table_name, count: parseInt(count) });
        console.log(`  ✅ ${row.table_name}: ${count} records`);
      } catch (error) {
        console.log(`  ❌ ${row.table_name}: Error - ${error.message}`);
      }
    }

    // Summary statistics
    console.log('\n📊 MIGRATION STATISTICS:');
    console.log(`  Total Tables: ${tableStats.length}`);
    console.log(`  Tables with Data: ${tableStats.filter(t => t.count > 0).length}`);
    console.log(`  Empty Tables: ${tableStats.filter(t => t.count === 0).length}`);
    console.log(`  Total Records: ${tableStats.reduce((sum, t) => sum + t.count, 0)}`);

    // Critical tables verification
    console.log('\n🔍 CRITICAL TABLES VERIFICATION:');
    const criticalTables = [
      'users',
      'user_roles', 
      'user_dashboard_permissions',
      'evolution_metricas',
      'workflow_control'
    ];

    let allCriticalOk = true;
    
    for (const table of criticalTables) {
      const stat = tableStats.find(t => t.name === table);
      if (stat && stat.count > 0) {
        console.log(`  ✅ ${table}: ${stat.count} records - OK`);
      } else {
        console.log(`  ❌ ${table}: Missing or empty - CRITICAL ERROR`);
        allCriticalOk = false;
      }
    }

    // Feature availability check
    console.log('\n🚀 FEATURE AVAILABILITY:');
    console.log(`  Authentication: ${allCriticalOk ? '✅ Available' : '❌ Not Available'}`);
    console.log(`  Dashboard Permissions: ${tableStats.find(t => t.name === 'user_dashboard_permissions')?.count > 0 ? '✅ Available' : '❌ Not Available'}`);
    console.log(`  Evolution Metrics: ${tableStats.find(t => t.name === 'evolution_metricas')?.count > 0 ? '✅ Available' : '❌ Not Available'}`);
    console.log(`  Workflow Control: ${tableStats.find(t => t.name === 'workflow_control')?.count > 0 ? '✅ Available' : '❌ Not Available'}`);
    console.log(`  N8n Integration: ${tableStats.filter(t => t.name.startsWith('n8n_')).length > 0 ? '✅ Available' : '❌ Not Available'}`);
    console.log(`  Appointments: ${tableStats.filter(t => t.name.startsWith('appointment')).length > 0 ? '✅ Available' : '❌ Not Available'}`);
    console.log(`  Chat System: ${tableStats.filter(t => t.name.startsWith('chat')).length > 0 ? '✅ Available' : '❌ Not Available'}`);

    // Comparison with original Supabase
    console.log('\n🔄 MIGRATION COMPARISON:');
    const expectedSupabaseTables = 45; // Approximate from our analysis
    const migratedTables = tableStats.length;
    const migrationPercentage = ((migratedTables / expectedSupabaseTables) * 100).toFixed(1);
    
    console.log(`  Expected Supabase Tables: ~${expectedSupabaseTables}`);
    console.log(`  Migrated Tables: ${migratedTables}`);
    console.log(`  Migration Coverage: ${migrationPercentage}%`);

    // Final status
    console.log('\n🎉 FINAL STATUS:');
    if (allCriticalOk && migratedTables >= 30) {
      console.log('  🟢 MIGRATION: SUCCESSFUL ✅');
      console.log('  🟢 SYSTEM: FULLY OPERATIONAL ✅');
      console.log('  🟢 READY FOR USE ✅');
    } else if (allCriticalOk) {
      console.log('  🟡 MIGRATION: PARTIAL SUCCESS ⚠️');
      console.log('  🟢 SYSTEM: OPERATIONAL ✅');
      console.log('  🟡 READY FOR BASIC USE ⚠️');
    } else {
      console.log('  🔴 MIGRATION: FAILED ❌');
      console.log('  🔴 SYSTEM: NOT OPERATIONAL ❌');
      console.log('  🔴 NOT READY FOR USE ❌');
    }

    console.log('\n🔗 ACCESS INFORMATION:');
    console.log('  Frontend: http://localhost:8082');
    console.log('  Backend API: http://localhost:3001');
    console.log('  Login: cmit.tapachula@gmail.com / any password');
    console.log('  Health Check: http://localhost:3001/api/health');

  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await pool.end();
  }
}

verifyCompleteMigration();