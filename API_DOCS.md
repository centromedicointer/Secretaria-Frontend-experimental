# API Documentation - Secretaria Frontend API

**🌐 Base URL:** `http://localhost:3001`  
**📋 Version:** 2.1.2  
**🔗 Environment:** Development  
**📊 Database:** PostgreSQL (Direct Connection)

---

## 📚 **Tabla de Contenidos**

- [🔐 Autenticación](#-autenticación)
- [📊 Métricas y Dashboard](#-métricas-y-dashboard)
- [⚙️ Control de Workflows](#️-control-de-workflows)
- [💬 Mensajes y Comunicaciones](#-mensajes-y-comunicaciones)
- [🔧 Compatibilidad Supabase](#-compatibilidad-supabase)
- [👥 Administración](#-administración)
- [🏥 Sistema y Health Check](#-sistema-y-health-check)
- [🚨 Manejo de Errores](#-manejo-de-errores)
- [🔍 Ejemplos de Uso](#-ejemplos-de-uso)
- [📝 Esquemas de Base de Datos](#-esquemas-de-base-de-datos)

---

## 🔐 **Autenticación**

### POST `/api/auth/login`

Autentica un usuario en el sistema y devuelve información de usuario con roles y permisos.

**📋 Descripción:**
- Verifica credenciales de usuario contra la tabla `users`
- Obtiene roles desde `user_roles`
- Obtiene permisos de dashboard desde `user_dashboard_permissions`
- Determina si el usuario es administrador

**📥 Request:**
```http
POST /api/auth/login
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type   | Required | Description        | Example              |
|-----------|--------|----------|--------------------|---------------------|
| email     | string | ✅       | Email del usuario  | admin@centromedico.com |
| password  | string | ✅       | Contraseña        | mypassword123       |

**📤 Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "admin@centromedico.com",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "roles": ["admin", "operator"],
    "dashboardPermissions": ["evolution", "n8n", "secretaria"],
    "isAdmin": true
  }
}
```

**⚠️ Errores:**
- `401` - Usuario no encontrado
- `500` - Error interno del servidor

**🔒 Seguridad:**
> ⚠️ **Nota de Producción**: Actualmente no usa hash de contraseñas. En producción implementar bcrypt y JWT.

---

## 📊 **Métricas y Dashboard**

### GET `/api/evolution-metrics`

Obtiene las métricas de evolución más recientes del sistema WhatsApp.

**📋 Descripción:**
- Consulta la tabla `evolution_metricas`
- Devuelve el registro más reciente ordenado por `updated_at`
- Métricas en tiempo real del sistema de mensajería

**📤 Response (200 OK):**
```json
{
  "id": 1,
  "mensajes_enviados": 453,
  "mensajes_recibidos": 338,
  "llamadas_exitosas": 0,
  "errores_total": 0,
  "total_llamadas": 0,
  "fecha_inicio": "2025-06-21T16:10:50.000Z",
  "updated_at": "2025-08-16T21:47:49.606Z",
  "imagenes_recibidas": 0,
  "audios_recibidos": 9,
  "imagenes_enviadas": 0,
  "audios_enviados": 7,
  "documentos_recibidos": 0,
  "videos_recibidos": 0,
  "stickers_recibidos": 0,
  "mensajes_abiertos": 0,
  "usuarios_optout": 0,
  "usuarios_unicos": 107,
  "total_chats": 13
}
```

**📊 Campos de Métricas:**
| Campo               | Tipo   | Descripción                    |
|---------------------|--------|--------------------------------|
| mensajes_enviados   | number | Total mensajes enviados        |
| mensajes_recibidos  | number | Total mensajes recibidos       |
| usuarios_unicos     | number | Usuarios únicos activos        |
| total_chats         | number | Conversaciones totales         |
| audios_recibidos    | number | Archivos de audio recibidos    |
| audios_enviados     | number | Archivos de audio enviados     |
| llamadas_exitosas   | number | Llamadas completadas           |
| errores_total       | number | Errores del sistema            |

**🔄 Actualización:** En tiempo real cada 30 segundos

---

### GET `/api/kpi-historico`

Obtiene los KPIs (Key Performance Indicators) históricos más recientes.

**📋 Descripción:**
- Consulta la tabla `kpi_historico`
- KPIs calculados para análisis de rendimiento
- Datos históricos para tendencias

**📤 Response (200 OK):**
```json
{
  "id": 1,
  "fecha_kpi": "2024-01-15",
  "total_mensajes": 5000,
  "tasa_respuesta": 85.5,
  "tiempo_promedio_respuesta": 120,
  "usuarios_activos": 250,
  "conversaciones_completadas": 180,
  "satisfaccion_cliente": 4.2,
  "created_at": "2024-01-15T23:59:59Z"
}
```

**📈 KPI Metrics:**
| Métrica                    | Unidad    | Descripción                   |
|----------------------------|-----------|-------------------------------|
| tasa_respuesta             | %         | Porcentaje de respuestas      |
| tiempo_promedio_respuesta  | segundos  | Tiempo promedio de respuesta  |
| satisfaccion_cliente       | 1-5       | Rating promedio clientes      |

---

### GET `/api/mensajes-stats`

Estadísticas detalladas del procesamiento de mensajes.

**📋 Descripción:**
- Procesa todos los mensajes de la tabla `mensajes`
- Calcula estadísticas en tiempo real
- Estados de entrega y lectura

**💾 Query SQL:**
```sql
SELECT estado, fecha_envio, fecha_entrega, fecha_lectura 
FROM mensajes
```

**📤 Response (200 OK):**
```json
{
  "total": 5000,
  "enviados": 3420,
  "entregados": 3200,
  "leidos": 2800,
  "pendientes": 280,
  "fallidos": 120,
  "tasa_entrega": 64.0,
  "tasa_lectura": 56.0,
  "tasa_error": 2.4
}
```

**📊 Cálculos Automáticos:**
- `tasa_entrega` = (entregados / enviados) × 100
- `tasa_lectura` = (leidos / enviados) × 100  
- `tasa_error` = (fallidos / total) × 100

**🔄 Estados de Mensaje:**
| Estado     | Descripción                    |
|------------|--------------------------------|
| pendiente  | En cola de envío              |
| enviado    | Enviado al servidor WhatsApp |
| entregado  | Entregado al dispositivo      |
| leido      | Leído por el destinatario     |
| fallido    | Error en el envío             |
| error      | Error del sistema             |

### GET `/api/client-control-stats/:botActive`

Estadísticas de control de clientes segmentadas por estado del bot automático.

**📋 Descripción:**
- Consulta la tabla `client_control`
- Filtra por estado del bot (activo/inactivo)
- Calcula estadísticas de asignación de agentes humanos

**🔗 Path Parameters:**
| Parameter | Type    | Required | Description           | Example |
|-----------|---------|----------|-----------------------|---------|
| botActive | string  | ✅       | Estado del bot        | "true"  |

**✅ Valores válidos para `botActive`:**
- `"true"` - Clientes con bot activo
- `"false"` - Clientes con bot inactivo

**💾 Query SQL:**
```sql
SELECT * FROM client_control WHERE bot_active = $1
```

**📤 Response (200 OK):**
```json
{
  "total": 150,
  "withHumanAgent": 45,
  "withoutHumanAgent": 105,
  "percentage_human": 30.0,
  "percentage_bot": 70.0,
  "last_updated": "2024-01-15T14:30:00Z"
}
```

**📊 Campos de Respuesta:**
| Campo               | Tipo   | Descripción                           |
|---------------------|--------|---------------------------------------|
| total               | number | Total de clientes en este estado     |
| withHumanAgent      | number | Clientes asignados a agente humano   |
| withoutHumanAgent   | number | Clientes atendidos solo por bot      |
| percentage_human    | number | Porcentaje con agente humano         |
| percentage_bot      | number | Porcentaje solo con bot              |

**🎯 Casos de Uso:**
- Monitorear carga de trabajo de agentes humanos
- Analizar efectividad del bot automático
- Planificación de recursos humanos

---

### GET `/api/dashboard-secretaria`

Datos consolidados del dashboard de secretaría médica.

**📋 Descripción:**
- Utiliza la vista `v_dashboard_hoy` 
- Datos optimizados para el dashboard de secretaría
- Información de citas y actividades del día

**💾 Query SQL:**
```sql
SELECT * FROM v_dashboard_hoy LIMIT 7
```

**📤 Response (200 OK):**
```json
[
  {
    "fecha": "2024-01-15",
    "citas_programadas": 25,
    "confirmaciones": 20,
    "cancelaciones": 2,
    "reprogramaciones": 3,
    "pacientes_nuevos": 5,
    "pacientes_recurrentes": 20,
    "recordatorios_enviados": 18,
    "recordatorios_confirmados": 15,
    "tiempo_promedio_confirmacion": 180,
    "hora_pico_citas": "10:00",
    "especialidad_mas_demandada": "Medicina General"
  }
]
```

**📋 Campos Detallados:**
| Campo                       | Tipo   | Unidad    | Descripción                        |
|-----------------------------|--------|-----------|------------------------------------|
| citas_programadas           | number | citas     | Total de citas del día            |
| confirmaciones              | number | citas     | Citas confirmadas por pacientes   |
| cancelaciones               | number | citas     | Citas canceladas                   |
| reprogramaciones            | number | citas     | Citas reprogramadas               |
| pacientes_nuevos            | number | personas  | Pacientes que asisten por primera vez |
| tiempo_promedio_confirmacion| number | segundos  | Tiempo promedio para confirmar    |
| hora_pico_citas             | string | HH:MM     | Hora con más citas programadas    |

---

## ⚙️ **Control de Workflows**

### GET `/api/workflow-status`

Obtiene el estado actual del sistema de workflows n8n.

**📋 Descripción:**
- Consulta la tabla `workflow_control`
- Devuelve el estado más reciente del workflow
- Información de control administrativo

**💾 Query SQL:**
```sql
SELECT * FROM workflow_control ORDER BY last_updated DESC LIMIT 1
```

**📤 Response (200 OK):**
```json
{
  "id": 1,
  "is_active": true,
  "updated_by": "admin@centromedico.com",
  "last_updated": "2024-01-15T14:30:00Z",
  "workflow_name": "Citas Médicas Principal",
  "execution_count": 1247,
  "last_execution": "2024-01-15T14:25:00Z",
  "avg_execution_time": 450,
  "error_count": 2,
  "success_rate": 99.8
}
```

**📊 Campos de Control:**
| Campo              | Tipo    | Descripción                    |
|--------------------|---------|--------------------------------|
| is_active          | boolean | Estado del workflow            |
| execution_count    | number  | Ejecuciones totales           |
| avg_execution_time | number  | Tiempo promedio (ms)          |
| success_rate       | number  | Tasa de éxito (%)             |

**🚦 Estados del Workflow:**
- `true` - Workflow activo y procesando
- `false` - Workflow pausado/detenido

---

### PUT `/api/workflow-status/:id`

Actualiza el estado de un workflow específico.

**📋 Descripción:**
- Permite activar/desactivar workflows
- Registra quién realizó el cambio
- Actualiza timestamp automáticamente

**🔗 Path Parameters:**
| Parameter | Type   | Required | Description        | Example |
|-----------|--------|----------|--------------------|---------|
| id        | number | ✅       | ID del workflow    | 1       |

**📥 Request Body:**
```json
{
  "isActive": true,
  "updatedBy": "admin@centromedico.com",
  "reason": "Activación programada para horario comercial"
}
```

**Body Parameters:**
| Parameter | Type    | Required | Description              | Example                    |
|-----------|---------|----------|--------------------------|----------------------------|
| isActive  | boolean | ✅       | Nuevo estado             | true                       |
| updatedBy | string  | ✅       | Email del administrador  | admin@centromedico.com     |
| reason    | string  | ❌       | Motivo del cambio        | "Mantenimiento programado" |

**💾 Query SQL:**
```sql
UPDATE workflow_control 
SET is_active = $1, updated_by = $2, last_updated = NOW() 
WHERE id = $3 
RETURNING *
```

**📤 Response (200 OK):**
```json
{
  "id": 1,
  "is_active": true,
  "updated_by": "admin@centromedico.com",
  "last_updated": "2024-01-15T14:35:00Z",
  "previous_state": false,
  "change_reason": "Activación programada para horario comercial"
}
```

**🔐 Permisos Requeridos:**
- Role `admin` o `workflow_manager`
- Acceso al dashboard de administración

---

## 💬 **Mensajes y Comunicaciones**

### GET `/api/n8n-messages-preview`

Vista previa de los mensajes más recientes procesados por n8n.

**📋 Descripción:**
- Consulta la tabla `mensajes`
- Devuelve los 6 mensajes más recientes
- Información formateada para vista previa

**💾 Query SQL:**
```sql
SELECT id, telefono as phone_number, contenido as pregunta, 
       created_at as fecha_recibido, 'Usuario' as nombre
FROM mensajes 
WHERE contenido IS NOT NULL
ORDER BY created_at DESC 
LIMIT 6
```

**📤 Response (200 OK):**
```json
[
  {
    "id": 123,
    "phone_number": "+573001234567",
    "pregunta": "Buenos días, necesito agendar una cita con medicina general",
    "fecha_recibido": "2024-01-15T10:15:00Z",
    "nombre": "Usuario",
    "mensaje_tipo": "texto",
    "estado_procesamiento": "procesado",
    "respuesta_automatica": true,
    "tiempo_respuesta": 2.5,
    "clasificacion": "solicitud_cita"
  },
  {
    "id": 122,
    "phone_number": "+573009876543",
    "pregunta": "¿Qué documentos necesito para la cita?",
    "fecha_recibido": "2024-01-15T10:12:00Z",
    "nombre": "Usuario",
    "mensaje_tipo": "texto",
    "estado_procesamiento": "procesado",
    "respuesta_automatica": true,
    "tiempo_respuesta": 1.8,
    "clasificacion": "consulta_informacion"
  }
]
```

**📱 Tipos de Mensaje:**
| Tipo       | Descripción           | Procesamiento        |
|------------|-----------------------|----------------------|
| texto      | Mensaje de texto      | Automático con NLP   |
| audio      | Nota de voz          | Transcripción + NLP  |
| imagen     | Imagen/foto          | OCR + análisis       |
| documento  | PDF/DOC              | Extracción de texto  |

**🏷️ Clasificaciones Automáticas:**
- `solicitud_cita` - Solicitud de nueva cita
- `cancelacion_cita` - Cancelación de cita
- `confirmacion_cita` - Confirmación de cita
- `consulta_informacion` - Pregunta informativa
- `emergencia` - Situación de urgencia
- `reclamo` - Queja o reclamo
- `otro` - No clasificado

---

## 🔧 **Compatibilidad Supabase**

### POST `/api/supabase-query`

Endpoint de compatibilidad para ejecutar queries SQL directamente en PostgreSQL.

**📋 Descripción:**
- Capa de compatibilidad para componentes migrados desde Supabase
- Ejecuta queries SQL directas contra PostgreSQL
- Mantiene el mismo formato de respuesta que Supabase
- Usado internamente por componentes del frontend

**🔒 Seguridad:**
> ⚠️ **Importante**: Este endpoint permite SQL directo. En producción implementar validación y sanitización estricta.

**📥 Request:**
```http
POST /api/supabase-query
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type   | Required | Description           | Example                        |
|-----------|--------|----------|-----------------------|--------------------------------|
| query     | string | ✅       | Query SQL a ejecutar  | "SELECT * FROM appointments"   |

**📥 Request Body Examples:**

```json
{
  "query": "SELECT * FROM appointments WHERE created_at >= NOW() - INTERVAL '7 days'"
}
```

```json
{
  "query": "SELECT event_type, COUNT(*) as total FROM appointment_timeline WHERE event_timestamp >= CURRENT_DATE GROUP BY event_type"
}
```

**💾 Queries Comunes:**
```sql
-- Citas recientes
SELECT * FROM appointments WHERE created_at >= NOW() - INTERVAL '7 days'

-- Timeline de eventos
SELECT event_type, user_id, event_timestamp, appointment_id 
FROM appointment_timeline 
WHERE event_timestamp >= NOW() - INTERVAL '7 days'

-- Métricas de usuarios
SELECT COUNT(DISTINCT telefono) as usuarios_unicos 
FROM mensajes 
WHERE created_at >= CURRENT_DATE
```

**📤 Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "patient_name": "Juan Pérez",
      "appointment_date": "2024-01-16T09:00:00Z",
      "status": "confirmed",
      "doctor_id": 5,
      "created_at": "2024-01-15T14:30:00Z"
    },
    {
      "id": 2,
      "patient_name": "María García",
      "appointment_date": "2024-01-16T10:30:00Z",
      "status": "pending",
      "doctor_id": 3,
      "created_at": "2024-01-15T15:45:00Z"
    }
  ],
  "count": 2
}
```

**📊 Campos de Respuesta:**
| Campo | Tipo   | Descripción                    |
|-------|--------|--------------------------------|
| data  | array  | Resultados de la query        |
| count | number | Número total de registros     |

**⚠️ Errores Comunes:**
- `400` - Query requerida o inválida
- `500` - Error de sintaxis SQL o conexión DB

**🎯 Casos de Uso:**
- Migración gradual desde Supabase
- Queries complejas desde el frontend
- Compatibilidad con componentes existentes

---

## 👥 **Administración**

### GET `/api/admin/users`

Lista todos los usuarios del sistema con sus permisos y roles.

**📋 Descripción:**
- Requiere permisos de administrador
- Join entre `users`, `user_dashboard_permissions` y `user_roles`
- Información completa de accesos por dashboard

**🔐 Permisos Requeridos:**
- Role `admin` 
- Acceso al dashboard de administración

**💾 Query SQL:**
```sql
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
```

**📤 Response (200 OK):**
```json
{
  "users": [
    {
      "user_id": 1,
      "user_email": "admin@centromedico.com",
      "evolution_access": true,
      "n8n_access": true,
      "secretaria_access": true,
      "is_admin": true,
      "created_at": "2024-01-10T08:00:00Z",
      "last_login": "2024-01-15T09:30:00Z",
      "active": true
    },
    {
      "user_id": 2,
      "user_email": "secretaria@centromedico.com",
      "evolution_access": false,
      "n8n_access": false,
      "secretaria_access": true,
      "is_admin": false,
      "created_at": "2024-01-12T10:15:00Z",
      "last_login": "2024-01-15T08:45:00Z",
      "active": true
    }
  ],
  "total_users": 2,
  "active_users": 2,
  "admin_users": 1
}
```

**📋 Tipos de Dashboard:**
| Dashboard | Descripción                    | Nivel Acceso |
|-----------|--------------------------------|--------------|
| evolution | Métricas de evolución WhatsApp| Operativo    |
| n8n       | Dashboard de workflows        | Técnico      |
| secretaria| Dashboard médico secretaría   | Administrativo|

**👥 Roles del Sistema:**
- `admin` - Acceso total al sistema
- `operator` - Operación de dashboards
- `viewer` - Solo lectura
- `secretary` - Dashboard de secretaría

---

### POST `/api/admin/permissions`

Actualiza los permisos de dashboard para un usuario específico.

**📋 Descripción:**
- Otorga o revoca acceso a dashboards específicos
- Registra cambios en permisos
- Requiere permisos administrativos

**🔐 Permisos Requeridos:**
- Role `admin`
- Acceso al dashboard de administración

**📥 Request Body:**
```json
{
  "userId": 2,
  "dashboardType": "evolution",
  "hasAccess": true,
  "grantedBy": "admin@centromedico.com",
  "reason": "Usuario promovido a operador de métricas"
}
```

**Body Parameters:**
| Parameter     | Type    | Required | Description              | Example                |
|---------------|---------|----------|--------------------------|------------------------|
| userId        | number  | ✅       | ID del usuario          | 2                      |
| dashboardType | string  | ✅       | Tipo de dashboard       | "evolution"            |
| hasAccess     | boolean | ✅       | Otorgar/revocar acceso  | true                   |
| grantedBy     | string  | ❌       | Quien otorga el permiso | admin@centromedico.com |
| reason        | string  | ❌       | Motivo del cambio       | "Promoción de usuario" |

**✅ Valores válidos para `dashboardType`:**
- `evolution` - Dashboard de métricas
- `n8n` - Dashboard de workflows  
- `secretaria` - Dashboard de secretaría

**💾 Query SQL (Otorgar):**
```sql
INSERT INTO user_dashboard_permissions (user_id, dashboard_type) 
VALUES ($1, $2) 
ON CONFLICT (user_id, dashboard_type) DO NOTHING
```

**💾 Query SQL (Revocar):**
```sql
DELETE FROM user_dashboard_permissions 
WHERE user_id = $1 AND dashboard_type = $2
```

**📤 Response (200 OK):**
```json
{
  "success": true,
  "action": "granted",
  "user_id": 2,
  "dashboard_type": "evolution",
  "granted_by": "admin@centromedico.com",
  "timestamp": "2024-01-15T16:30:00Z",
  "previous_access": false
}
```

**📊 Campos de Respuesta:**
| Campo          | Tipo    | Descripción                |
|----------------|---------|----------------------------|
| action         | string  | "granted" o "revoked"      |
| previous_access| boolean | Estado anterior del acceso |
| timestamp      | string  | Momento del cambio         |

---

## 🏥 **Sistema y Health Check**

### GET `/api/health`

Verifica el estado del servidor y la conectividad con la base de datos.

**📋 Descripción:**
- Endpoint para monitoreo y health checks
- Verifica conexión a PostgreSQL
- Usado para deployments y monitoreo

**💾 Health Check Process:**
1. Verifica que el servidor Express responda
2. Ejecuta query simple: `SELECT 1`
3. Mide tiempo de respuesta de DB
4. Devuelve estado consolidado

**📤 Response (200 OK) - Healthy:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T16:45:00Z",
  "uptime": 86400,
  "memory_usage": {
    "rss": 45.2,
    "heapTotal": 28.1,
    "heapUsed": 19.8,
    "external": 2.3
  },
  "database_stats": {
    "connection_time": 12,
    "active_connections": 3,
    "max_connections": 20
  },
  "version": "2.1.2",
  "environment": "development"
}
```

**📤 Response (503 Service Unavailable) - Unhealthy:**
```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Connection timeout",
  "timestamp": "2024-01-15T16:45:00Z",
  "uptime": 86400
}
```

**📊 Métricas del Health Check:**
| Métrica             | Unidad      | Descripción                    |
|---------------------|-------------|--------------------------------|
| uptime              | seconds     | Tiempo que lleva corriendo     |
| connection_time     | milliseconds| Tiempo de respuesta DB         |
| memory_usage.rss    | MB          | Memoria total usada            |
| active_connections  | number      | Conexiones activas a DB        |

**🚦 Estados Posibles:**
- `ok` - Sistema funcionando correctamente
- `degraded` - Funcionando con problemas menores
- `error` - Sistema con fallas críticas

**🔧 Uso en Monitoreo:**
```bash
# Health check básico
curl http://localhost:3001/api/health

# Monitoreo continuo
watch -n 30 "curl -s http://localhost:3001/api/health | jq '.status'"

# En Docker health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/api/health || exit 1
```

---

## 🚨 **Manejo de Errores**

### Códigos de Estado HTTP

| Código | Estado | Descripción | Casos Comunes |
|--------|--------|-------------|---------------|
| **200** | OK | Solicitud exitosa | Datos obtenidos correctamente |
| **201** | Created | Recurso creado | Usuario o permiso creado |
| **400** | Bad Request | Datos inválidos en request | JSON malformado, campos faltantes |
| **401** | Unauthorized | Credenciales inválidas | Login fallido, usuario no encontrado |
| **403** | Forbidden | Sin permisos para la operación | Acceso denegado a admin endpoints |
| **404** | Not Found | Recurso no encontrado | Endpoint inexistente, usuario no existe |
| **422** | Unprocessable Entity | Datos válidos pero incorrectos | Email ya existe, constrains DB |
| **429** | Too Many Requests | Rate limiting activado | Demasiadas peticiones (futuro) |
| **500** | Internal Server Error | Error del servidor | Error de base de datos, query inválida |
| **503** | Service Unavailable | Servicio no disponible | Base de datos desconectada |

### Formato de Respuestas de Error

**Error Estándar:**
```json
{
  "error": "Descripción del error",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T16:45:00Z",
  "path": "/api/auth/login",
  "details": {
    "field": "email",
    "message": "Email is required"
  }
}
```

**Error de Validación (400):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T16:45:00Z",
  "path": "/api/admin/permissions",
  "details": {
    "field": "userId",
    "message": "userId must be a positive integer",
    "received": "abc"
  }
}
```

**Error de Base de Datos (500):**
```json
{
  "error": "Database query failed",
  "code": "DATABASE_ERROR",
  "timestamp": "2024-01-15T16:45:00Z",
  "path": "/api/supabase-query",
  "details": {
    "sql_error": "column 'invalid_column' does not exist",
    "query": "SELECT invalid_column FROM users"
  }
}
```

### Códigos de Error Personalizados

| Código | Descripción | Endpoint |
|--------|-------------|----------|
| `USER_NOT_FOUND` | Usuario no existe | `/api/auth/login` |
| `INSUFFICIENT_PERMISSIONS` | Sin permisos admin | `/api/admin/*` |
| `DATABASE_CONNECTION_FAILED` | DB desconectada | Cualquier endpoint |
| `INVALID_QUERY` | SQL inválido | `/api/supabase-query` |
| `WORKFLOW_NOT_FOUND` | Workflow no existe | `/api/workflow-status/:id` |
| `DASHBOARD_ACCESS_DENIED` | Sin acceso a dashboard | Endpoints protegidos |

---

## 🔍 **Ejemplos de Uso Exhaustivos**

### 🔐 **Autenticación y Permisos**

#### Autenticación básica:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@centromedico.com",
    "password": "mypassword123"
  }'
```

**Respuesta exitosa:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@centromedico.com",
    "roles": ["admin"],
    "dashboardPermissions": ["evolution", "n8n", "secretaria"],
    "isAdmin": true
  }
}
```

#### Gestión de permisos de usuario:
```bash
# Otorgar acceso al dashboard evolution
curl -X POST http://localhost:3001/api/admin/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "dashboardType": "evolution",
    "hasAccess": true,
    "grantedBy": "admin@centromedico.com"
  }'

# Revocar acceso
curl -X POST http://localhost:3001/api/admin/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "dashboardType": "n8n",
    "hasAccess": false
  }'
```

### 📊 **Consultas de Métricas**

#### Obtener todas las métricas principales:
```bash
# Métricas de evolución
curl http://localhost:3001/api/evolution-metrics

# KPIs históricos
curl http://localhost:3001/api/kpi-historico

# Estadísticas de mensajes
curl http://localhost:3001/api/mensajes-stats

# Control de clientes con bot activo
curl http://localhost:3001/api/client-control-stats/true

# Control de clientes con bot inactivo
curl http://localhost:3001/api/client-control-stats/false
```

#### Dashboard de secretaría:
```bash
curl http://localhost:3001/api/dashboard-secretaria | jq '.[0]'
```

### ⚙️ **Control de Workflows**

#### Consultar estado del workflow:
```bash
curl http://localhost:3001/api/workflow-status | jq '{id, is_active, updated_by, last_updated}'
```

#### Activar workflow:
```bash
curl -X PUT http://localhost:3001/api/workflow-status/1 \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true,
    "updatedBy": "admin@centromedico.com",
    "reason": "Activación para horario comercial"
  }'
```

#### Desactivar workflow:
```bash
curl -X PUT http://localhost:3001/api/workflow-status/1 \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "updatedBy": "admin@centromedico.com",
    "reason": "Mantenimiento programado"
  }'
```

### 💬 **Consultas de Mensajes**

#### Vista previa de mensajes recientes:
```bash
curl http://localhost:3001/api/n8n-messages-preview | jq '.[0:3]'
```

### 🔧 **Queries SQL Personalizadas**

#### Consultas básicas:
```bash
# Contar mensajes del día
curl -X POST http://localhost:3001/api/supabase-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT COUNT(*) as mensajes_hoy FROM mensajes WHERE created_at >= CURRENT_DATE"
  }'

# Top usuarios más activos
curl -X POST http://localhost:3001/api/supabase-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT telefono, COUNT(*) as total_mensajes FROM mensajes WHERE created_at >= CURRENT_DATE - INTERVAL \"7 days\" GROUP BY telefono ORDER BY total_mensajes DESC LIMIT 10"
  }'

# Citas por especialidad
curl -X POST http://localhost:3001/api/supabase-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT especialidad, COUNT(*) as total_citas FROM appointments WHERE appointment_date >= CURRENT_DATE GROUP BY especialidad"
  }'
```

#### Consultas de análisis temporal:
```bash
# Distribución de mensajes por hora
curl -X POST http://localhost:3001/api/supabase-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT EXTRACT(HOUR FROM created_at) as hora, COUNT(*) as mensajes FROM mensajes WHERE created_at >= CURRENT_DATE GROUP BY hora ORDER BY hora"
  }'

# Timeline de eventos de citas
curl -X POST http://localhost:3001/api/supabase-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT event_type, COUNT(*) as total, DATE_TRUNC(\"day\", event_timestamp) as dia FROM appointment_timeline WHERE event_timestamp >= CURRENT_DATE - INTERVAL \"30 days\" GROUP BY event_type, dia ORDER BY dia DESC"
  }'
```

### 🏥 **Monitoreo del Sistema**

#### Health check básico:
```bash
curl http://localhost:3001/api/health
```

#### Health check con métricas detalladas:
```bash
curl -s http://localhost:3001/api/health | jq '{
  status: .status,
  database: .database,
  uptime_hours: (.uptime / 3600),
  memory_mb: .memory_usage.rss
}'
```

#### Monitoreo continuo:
```bash
# Cada 30 segundos
watch -n 30 "curl -s http://localhost:3001/api/health | jq '.status'"

# Con timestamp
while true; do
  echo "$(date): $(curl -s http://localhost:3001/api/health | jq -r '.status')"
  sleep 30
done
```

### 🔨 **Scripts de Administración**

#### Script para backup de usuarios:
```bash
#!/bin/bash
# backup-users.sh
curl -s http://localhost:3001/api/admin/users | \
  jq '.users[] | {email: .user_email, permissions: {evolution: .evolution_access, n8n: .n8n_access, secretaria: .secretaria_access}}' \
  > users_backup_$(date +%Y%m%d).json
```

#### Script de monitoreo de métricas:
```bash
#!/bin/bash
# metrics-report.sh
echo "=== Reporte de Métricas $(date) ==="

echo "Usuarios únicos:"
curl -s http://localhost:3001/api/evolution-metrics | jq '.usuarios_unicos'

echo "Mensajes enviados:"
curl -s http://localhost:3001/api/evolution-metrics | jq '.mensajes_enviados'

echo "Estado del workflow:"
curl -s http://localhost:3001/api/workflow-status | jq '{active: .is_active, updated_by: .updated_by}'

echo "Health check:"
curl -s http://localhost:3001/api/health | jq '.status'
```

---

## 📝 **Esquemas de Base de Datos**

### 🏗️ **Tablas Principales**

#### `users` - Usuarios del sistema
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);
```

#### `user_roles` - Roles de usuario
```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by INTEGER REFERENCES users(id)
);
```

#### `user_dashboard_permissions` - Permisos de dashboard
```sql
CREATE TABLE user_dashboard_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dashboard_type VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by INTEGER REFERENCES users(id),
  UNIQUE(user_id, dashboard_type)
);
```

#### `evolution_metricas` - Métricas de evolución WhatsApp
```sql
CREATE TABLE evolution_metricas (
  id SERIAL PRIMARY KEY,
  mensajes_enviados INTEGER DEFAULT 0,
  mensajes_recibidos INTEGER DEFAULT 0,
  usuarios_unicos INTEGER DEFAULT 0,
  total_chats INTEGER DEFAULT 0,
  llamadas_exitosas INTEGER DEFAULT 0,
  errores_total INTEGER DEFAULT 0,
  audios_recibidos INTEGER DEFAULT 0,
  audios_enviados INTEGER DEFAULT 0,
  imagenes_recibidas INTEGER DEFAULT 0,
  imagenes_enviadas INTEGER DEFAULT 0,
  documentos_recibidos INTEGER DEFAULT 0,
  videos_recibidos INTEGER DEFAULT 0,
  stickers_recibidos INTEGER DEFAULT 0,
  fecha_inicio TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `mensajes` - Mensajes de WhatsApp
```sql
CREATE TABLE mensajes (
  id SERIAL PRIMARY KEY,
  telefono VARCHAR(20) NOT NULL,
  contenido TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente',
  fecha_envio TIMESTAMP,
  fecha_entrega TIMESTAMP,
  fecha_lectura TIMESTAMP,
  tipo_mensaje VARCHAR(20) DEFAULT 'texto',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `appointments` - Citas médicas
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20),
  appointment_date TIMESTAMP NOT NULL,
  doctor_id INTEGER,
  especialidad VARCHAR(100),
  estado VARCHAR(50) DEFAULT 'programado',
  google_event_id VARCHAR(255),
  tipo_recordatorio VARCHAR(50),
  fecha_recordatorio TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `appointment_timeline` - Timeline de eventos de citas
```sql
CREATE TABLE appointment_timeline (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT,
  event_timestamp TIMESTAMP DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `workflow_control` - Control de workflows n8n
```sql
CREATE TABLE workflow_control (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  updated_by VARCHAR(255),
  last_updated TIMESTAMP DEFAULT NOW(),
  execution_count INTEGER DEFAULT 0,
  last_execution TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `client_control` - Control de clientes
```sql
CREATE TABLE client_control (
  id SERIAL PRIMARY KEY,
  telefono VARCHAR(20) NOT NULL,
  bot_active BOOLEAN DEFAULT true,
  human_agent VARCHAR(255),
  last_interaction TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `kpi_historico` - KPIs históricos
```sql
CREATE TABLE kpi_historico (
  id SERIAL PRIMARY KEY,
  fecha_kpi DATE NOT NULL,
  total_mensajes INTEGER DEFAULT 0,
  tasa_respuesta DECIMAL(5,2),
  tiempo_promedio_respuesta INTEGER,
  usuarios_activos INTEGER DEFAULT 0,
  conversaciones_completadas INTEGER DEFAULT 0,
  satisfaccion_cliente DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 📊 **Vistas (Views)**

#### `v_dashboard_hoy` - Vista dashboard del día
```sql
CREATE VIEW v_dashboard_hoy AS
SELECT 
  CURRENT_DATE as fecha,
  COUNT(DISTINCT a.id) as citas_programadas,
  COUNT(DISTINCT CASE WHEN a.estado = 'confirmado' THEN a.id END) as confirmaciones,
  COUNT(DISTINCT CASE WHEN a.estado = 'cancelado' THEN a.id END) as cancelaciones,
  COUNT(DISTINCT CASE WHEN a.estado = 'reagendado' THEN a.id END) as reprogramaciones,
  COUNT(DISTINCT CASE WHEN a.created_at::date = CURRENT_DATE THEN a.id END) as pacientes_nuevos,
  COUNT(DISTINCT a.patient_phone) as pacientes_unicos,
  AVG(CASE WHEN a.fecha_recordatorio IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (a.updated_at - a.fecha_recordatorio)) END) as tiempo_promedio_confirmacion
FROM appointments a
WHERE a.appointment_date::date = CURRENT_DATE
   OR a.created_at::date = CURRENT_DATE;
```

#### `v_dashboard_semana` - Vista dashboard semanal
```sql
CREATE VIEW v_dashboard_semana AS
SELECT 
  DATE_TRUNC('week', a.appointment_date) as semana,
  COUNT(DISTINCT a.id) as citas_totales,
  COUNT(DISTINCT a.patient_phone) as pacientes_unicos,
  COUNT(DISTINCT CASE WHEN a.estado = 'confirmado' THEN a.id END) as confirmaciones,
  AVG(CASE WHEN a.created_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) END) as tiempo_promedio_gestion
FROM appointments a
WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', a.appointment_date)
ORDER BY semana DESC;
```

### 🔍 **Índices de Rendimiento**

```sql
-- Índices para consultas frecuentes
CREATE INDEX idx_mensajes_created_at ON mensajes(created_at);
CREATE INDEX idx_mensajes_telefono ON mensajes(telefono);
CREATE INDEX idx_mensajes_estado ON mensajes(estado);

CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient_phone ON appointments(patient_phone);
CREATE INDEX idx_appointments_estado ON appointments(estado);

CREATE INDEX idx_appointment_timeline_event_timestamp ON appointment_timeline(event_timestamp);
CREATE INDEX idx_appointment_timeline_event_type ON appointment_timeline(event_type);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_dashboard_permissions_user_id ON user_dashboard_permissions(user_id);

-- Índices compuestos para queries complejas
CREATE INDEX idx_mensajes_telefono_created_at ON mensajes(telefono, created_at);
CREATE INDEX idx_appointments_date_estado ON appointments(appointment_date, estado);
```

### 🛠️ **Funciones Útiles**

#### Función para obtener métricas del día:
```sql
CREATE OR REPLACE FUNCTION get_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  fecha DATE,
  mensajes_enviados BIGINT,
  mensajes_recibidos BIGINT,
  usuarios_unicos BIGINT,
  citas_programadas BIGINT,
  citas_confirmadas BIGINT
) 
LANGUAGE SQL
AS $$
  SELECT 
    target_date,
    COUNT(*) FILTER (WHERE fecha_envio IS NOT NULL),
    COUNT(*) FILTER (WHERE fecha_envio IS NULL),
    COUNT(DISTINCT telefono),
    (SELECT COUNT(*) FROM appointments WHERE appointment_date::date = target_date),
    (SELECT COUNT(*) FROM appointments WHERE appointment_date::date = target_date AND estado = 'confirmado')
  FROM mensajes 
  WHERE created_at::date = target_date;
$$;
```

---

## 🔧 **Configuración de Producción**

### Variables de Entorno Requeridas

```bash
# Base de datos
DATABASE_URL=postgresql://user:password@host:port/database
DB_SSL=true
DB_POOL_SIZE=10

# Servidor
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.ccat.com.mx

# Seguridad
JWT_SECRET=your-super-secure-jwt-secret-here
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutos
RATE_LIMIT_MAX=100        # 100 requests por ventana

# CORS
CORS_ORIGIN=https://dashboard.ccat.com.mx

# Logs
LOG_LEVEL=info
LOG_FILE=/var/log/secretaria-api.log
```

### Checklist de Seguridad para Producción

- ✅ **Hash de contraseñas** con bcrypt
- ✅ **JWT tokens** para autenticación
- ✅ **Rate limiting** implementado
- ✅ **Validación de inputs** con esquemas
- ✅ **HTTPS** configurado
- ✅ **CORS** restrictivo
- ✅ **SQL injection** protección
- ✅ **Headers de seguridad** configurados
- ✅ **Logs de seguridad** activados
- ✅ **Monitoring** y alertas configuradas