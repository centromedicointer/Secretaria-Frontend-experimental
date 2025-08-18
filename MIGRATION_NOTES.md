# Migración de Supabase a PostgreSQL Directo

## ✅ Migración Completada

La aplicación ha sido migrada exitosamente de **Supabase** a **PostgreSQL directo** usando la cadena de conexión:
```
postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit
```

## 🔄 Cambios Realizados

### 1. Dependencias Agregadas
- `pg` - Cliente PostgreSQL para Node.js
- `@types/pg` - Tipos TypeScript para pg

### 2. Nueva Estructura de Archivos
```
src/
├── integrations/
│   ├── postgres/
│   │   ├── client.ts      # Cliente PostgreSQL
│   │   └── types.ts       # Tipos de base de datos
└── lib/
    ├── database.ts        # Funciones de consulta DB
    └── auth.ts           # Sistema de autenticación
```

### 3. Componentes Migrados
- ✅ `useAuth.ts` - Sistema de autenticación
- ✅ `useDashboardPermissions.ts` - Permisos de dashboard
- ✅ `EvolutionMetrics.tsx` - Dashboard principal
- ✅ `Login.tsx` - Página de login
- ✅ Variables de entorno actualizadas

### 4. Sistema de Autenticación
**Antes (Supabase):**
- Autenticación manejada por Supabase Auth
- Sesiones automáticas con JWT

**Ahora (PostgreSQL):**
- Autenticación simple con email/password
- Sesión guardada en localStorage
- Verificación manual de credenciales

### 5. Gestión de Datos
**Antes:**
```typescript
const { data, error } = await supabase
  .from('evolution_metricas')
  .select('*')
  .order('updated_at', { ascending: false })
  .limit(1);
```

**Ahora:**
```typescript
const data = await getLatestEvolutionMetrics();
```

## 🚀 Configuración de Desarrollo

### 1. Variables de Entorno
Crear archivo `.env.local`:
```env
VITE_POSTGRES_URL=postgresql://postgres:1860jBftiIGfh5x8@5.78.154.128:5432/cmit
```

### 2. Instalación y Ejecución
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Acceso a la Aplicación
- URL: http://localhost:8081/
- Login: Usar credenciales de la base de datos PostgreSQL

## 📋 Funcionalidades Migradas

### ✅ Completamente Migradas
- Sistema de autenticación básico
- Permisos de dashboard
- Métricas de Evolution API
- Control de clientes
- Estado de workflow
- Estadísticas de mensajes

### ⚠️ Pendientes de Verificación
- Todas las consultas complejas
- Hooks que aún usan Supabase
- Funcionalidades de admin
- Gestión de perfiles
- Integraciones con N8n

## 🔧 Archivos Clave Modificados

1. **`src/integrations/postgres/client.ts`** - Configuración de conexión
2. **`src/lib/database.ts`** - Funciones de consulta
3. **`src/lib/auth.ts`** - Sistema de autenticación
4. **`src/hooks/useAuth.ts`** - Hook de autenticación
5. **`src/hooks/useDashboardPermissions.ts`** - Hook de permisos
6. **`src/components/EvolutionMetrics.tsx`** - Dashboard principal
7. **`src/pages/Login.tsx`** - Página de login

## ⚠️ Consideraciones de Seguridad

### Actual (Simplificado)
- Credenciales en localStorage
- Validación básica de email/password
- Sin hash de contraseñas en frontend

### Recomendaciones para Producción
- Implementar JWT tokens
- Hash de contraseñas con bcrypt
- Sesiones con expiración
- HTTPS obligatorio
- Validación robusta en backend

## 🧪 Testing

### Servidor de Desarrollo
```bash
npm run dev
```
✅ **Estado:** Funcionando en http://localhost:8081/

### Build de Producción
```bash
npm run build
```
⚠️ **Estado:** Requiere corrección de errores de linting

## 📝 Próximos Pasos

1. **Migrar hooks restantes** que aún usan Supabase
2. **Implementar autenticación robusta** con JWT
3. **Corregir errores de linting** para build de producción
4. **Probar todas las funcionalidades** en el nuevo sistema
5. **Configurar variables de entorno** para diferentes ambientes

## 🔄 Rollback (Si es Necesario)

Para volver a Supabase:
1. Restaurar archivos de `src/integrations/supabase/`
2. Revertir cambios en hooks de autenticación
3. Usar variables de entorno de Supabase
4. Reinstalar `@supabase/supabase-js`