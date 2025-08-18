# API Documentation - Puerto 3001

Base URL: `http://localhost:3001`

## 🔐 **Autenticación**

### POST `/api/auth/login`
Autenticar usuario y obtener permisos.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "roles": ["admin"],
    "dashboardPermissions": ["evolution", "n8n"],
    "isAdmin": true
  }
}
```

---

## 📊 **Métricas y Dashboard**

### GET `/api/evolution-metrics`
Obtener métricas de evolución más recientes.

**Response:**
```json
{
  "id": 1,
  "usuarios_unicos": 150,
  "mensajes_enviados": 3420,
  "mensajes_recibidos": 2890,
  "conversaciones_activas": 45,
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### GET `/api/kpi-historico`
Obtener KPIs históricos más recientes.

**Response:**
```json
{
  "id": 1,
  "fecha_kpi": "2024-01-15",
  "total_mensajes": 5000,
  "tasa_respuesta": 85.5,
  "tiempo_promedio_respuesta": 120
}
```

### GET `/api/mensajes-stats`
Estadísticas de mensajes procesadas.

**Response:**
```json
{
  "total": 5000,
  "enviados": 3420,
  "entregados": 3200,
  "leidos": 2800,
  "pendientes": 280,
  "fallidos": 120
}
```

### GET `/api/client-control-stats/:botActive`
Estadísticas de control de clientes por estado del bot.

**Parameters:**
- `botActive` (string): "true" o "false"

**Response:**
```json
{
  "total": 150,
  "withHumanAgent": 45,
  "withoutHumanAgent": 105
}
```

### GET `/api/dashboard-secretaria`
Datos del dashboard de secretaría.

**Response:**
```json
[
  {
    "fecha": "2024-01-15",
    "citas_programadas": 25,
    "confirmaciones": 20,
    "cancelaciones": 2
  }
]
```

---

## ⚙️ **Workflows**

### GET `/api/workflow-status`
Estado actual del workflow.

**Response:**
```json
{
  "id": 1,
  "is_active": true,
  "updated_by": "admin@example.com",
  "last_updated": "2024-01-15T14:30:00Z"
}
```

### PUT `/api/workflow-status/:id`
Actualizar estado del workflow.

**Parameters:**
- `id` (number): ID del workflow

**Request Body:**
```json
{
  "isActive": true,
  "updatedBy": "admin@example.com"
}
```

**Response:**
```json
{
  "id": 1,
  "is_active": true,
  "updated_by": "admin@example.com",
  "last_updated": "2024-01-15T14:35:00Z"
}
```

---

## 💬 **Mensajes n8n**

### GET `/api/n8n-messages-preview`
Vista previa de mensajes recientes de n8n.

**Response:**
```json
[
  {
    "id": 123,
    "phone_number": "+1234567890",
    "pregunta": "Necesito una cita",
    "fecha_recibido": "2024-01-15T10:15:00Z",
    "nombre": "Usuario"
  }
]
```

---

## 🔧 **Supabase Compatibility**

### POST `/api/supabase-query`
Ejecutar query SQL en PostgreSQL (compatibilidad con Supabase).

**Request Body:**
```json
{
  "query": "SELECT * FROM appointments WHERE created_at >= NOW() - INTERVAL '7 days'"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "patient_name": "Juan Pérez",
      "appointment_date": "2024-01-16T09:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 👥 **Administración**

### GET `/api/admin/users`
Listar usuarios con permisos (requiere admin).

**Response:**
```json
{
  "users": [
    {
      "user_id": 1,
      "user_email": "admin@example.com",
      "evolution_access": true,
      "n8n_access": true,
      "secretaria_access": false,
      "is_admin": true
    }
  ]
}
```

### POST `/api/admin/permissions`
Actualizar permisos de usuario (requiere admin).

**Request Body:**
```json
{
  "userId": 1,
  "dashboardType": "evolution",
  "hasAccess": true
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 🏥 **Sistema**

### GET `/api/health`
Health check del servidor y base de datos.

**Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## 🚨 **Códigos de Error**

- **200**: OK - Solicitud exitosa
- **400**: Bad Request - Datos inválidos
- **401**: Unauthorized - No autenticado
- **403**: Forbidden - Sin permisos
- **404**: Not Found - Recurso no encontrado
- **500**: Internal Server Error - Error del servidor

## 🔍 **Ejemplos de Uso**

### Autenticación básica:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Obtener métricas:
```bash
curl http://localhost:3001/api/evolution-metrics
```

### Health check:
```bash
curl http://localhost:3001/api/health
```

### Query personalizada:
```bash
curl -X POST http://localhost:3001/api/supabase-query \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT COUNT(*) FROM mensajes WHERE created_at >= CURRENT_DATE"}'
```

---

## 📝 **Notas Técnicas**

- **Base de datos**: PostgreSQL con conexión directa
- **Autenticación**: Simple email/password (para producción usar JWT)
- **CORS**: Configurado para desarrollo local
- **Rate Limiting**: No implementado (recomendado para producción)
- **Logs**: Todas las queries se registran en consola

## 🔐 **Seguridad**

⚠️ **Importante para producción:**
- Implementar hash de contraseñas
- Agregar JWT tokens
- Configurar rate limiting
- Validar inputs con esquemas
- Usar HTTPS
- Configurar CORS restrictivo