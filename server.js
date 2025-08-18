import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: "postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit",
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Función helper para queries
const query = async (text, params = []) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario por email (en producción, usar hash de contraseñas)
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Obtener roles y permisos
    const [rolesResult, permissionsResult] = await Promise.all([
      query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]),
      query('SELECT dashboard_type FROM user_dashboard_permissions WHERE user_id = $1', [user.id])
    ]);

    const roles = rolesResult.rows.map(r => r.role);
    const dashboardPermissions = permissionsResult.rows.map(p => p.dashboard_type);
    const isAdmin = roles.includes('admin');

    const authUser = {
      ...user,
      roles,
      dashboardPermissions,
      isAdmin
    };

    res.json({ user: authUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas de datos
app.get('/api/evolution-metrics', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM evolution_metricas ORDER BY updated_at DESC LIMIT 1'
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching evolution metrics:', error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

app.get('/api/kpi-historico', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM kpi_historico ORDER BY fecha_kpi DESC LIMIT 1'
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching KPI:', error);
    res.status(500).json({ error: 'Error al obtener KPI' });
  }
});

app.get('/api/mensajes-stats', async (req, res) => {
  try {
    const result = await query(
      'SELECT estado, fecha_envio, fecha_entrega, fecha_lectura FROM mensajes'
    );
    
    const data = result.rows;
    const total = data.length;
    const enviados = data.filter(m => m.fecha_envio).length;
    const entregados = data.filter(m => m.fecha_entrega).length;
    const leidos = data.filter(m => m.fecha_lectura).length;
    const pendientes = data.filter(m => m.estado === 'pendiente').length;
    const fallidos = data.filter(m => m.estado === 'fallido' || m.estado === 'error').length;

    res.json({
      total,
      enviados,
      entregados,
      leidos,
      pendientes,
      fallidos
    });
  } catch (error) {
    console.error('Error fetching mensajes stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de mensajes' });
  }
});

app.get('/api/client-control-stats/:botActive', async (req, res) => {
  try {
    const { botActive } = req.params;
    const isActive = botActive === 'true';
    
    const result = await query(
      'SELECT * FROM client_control WHERE bot_active = $1',
      [isActive]
    );
    
    const data = result.rows;
    const total = data.length;
    const withHumanAgent = data.filter(c => c.human_agent && c.human_agent.trim() !== '').length;
    const withoutHumanAgent = total - withHumanAgent;

    res.json({
      total,
      withHumanAgent,
      withoutHumanAgent
    });
  } catch (error) {
    console.error('Error fetching client control stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de control de clientes' });
  }
});

app.get('/api/workflow-status', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM workflow_control ORDER BY last_updated DESC LIMIT 1'
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({ error: 'Error al obtener estado del workflow' });
  }
});

app.put('/api/workflow-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, updatedBy } = req.body;
    
    const result = await query(
      'UPDATE workflow_control SET is_active = $1, updated_by = $2, last_updated = NOW() WHERE id = $3 RETURNING *',
      [isActive, updatedBy, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating workflow status:', error);
    res.status(500).json({ error: 'Error al actualizar estado del workflow' });
  }
});

app.get('/api/n8n-messages-preview', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, telefono as phone_number, contenido as pregunta, created_at as fecha_recibido, 'Usuario' as nombre
      FROM mensajes 
      WHERE contenido IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 6
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching n8n messages preview:', error);
    res.status(500).json({ error: 'Error al obtener vista previa de mensajes' });
  }
});

app.get('/api/dashboard-secretaria', async (req, res) => {
  try {
    // Use v_dashboard_hoy since v_dashboard_secretaria doesn't exist
    const result = await query(`
      SELECT * FROM v_dashboard_hoy 
      LIMIT 7
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dashboard secretaria:', error);
    res.status(500).json({ error: 'Error al obtener datos de dashboard secretaria' });
  }
});

// Rutas de administración
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id as user_id,
        u.email as user_email,
        BOOL_OR(udp.dashboard_type = 'evolution') as evolution_access,
        BOOL_OR(udp.dashboard_type = 'n8n') as n8n_access,
        BOOL_OR(udp.dashboard_type = 'secretaria') as secretaria_access,
        BOOL_OR(ur.role = 'admin') as is_admin
      FROM users u
      LEFT JOIN user_dashboard_permissions udp ON u.id = udp.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id, u.email
      ORDER BY u.email
    `);
    
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/admin/permissions', async (req, res) => {
  try {
    const { userId, dashboardType, hasAccess } = req.body;
    
    if (hasAccess) {
      // Otorgar permiso
      await query(
        'INSERT INTO user_dashboard_permissions (user_id, dashboard_type) VALUES ($1, $2) ON CONFLICT (user_id, dashboard_type) DO NOTHING',
        [userId, dashboardType]
      );
    } else {
      // Revocar permiso
      await query(
        'DELETE FROM user_dashboard_permissions WHERE user_id = $1 AND dashboard_type = $2',
        [userId, dashboardType]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ error: 'Error al actualizar permiso' });
  }
});

// Ruta de health check
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});