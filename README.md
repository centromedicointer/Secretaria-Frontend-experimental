# Secretaria Frontend Experimental 🧪

Dashboard experimental para el Sistema WhatsApp Enterprise - Interfaz React con integración PostgreSQL y Google Calendar.

## 🚀 Características

- **Dashboard en tiempo real** con métricas de WhatsApp
- **Integración PostgreSQL** directa (migrado desde Supabase)
- **Google Calendar** con autenticación OAuth2
- **Componentes reactivos** con React Query
- **Interfaz moderna** con Tailwind CSS

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + PostgreSQL
- **Autenticación**: Google OAuth2
- **Base de datos**: PostgreSQL con conexión directa

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/centromedicointer/Secretaria-Frontend-experimental.git
cd Secretaria-Frontend-experimental

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
```

## ⚙️ Configuración

### Variables de Entorno (.env.local)

```env
# Google Calendar OAuth
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
VITE_GOOGLE_CLIENT_SECRET=tu-google-client-secret

# PostgreSQL Connection (ya configurada para el servidor de producción)
DATABASE_URL=postgresql://postgres:password@host:5432/database
```

### Configuración de Google Calendar

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Calendar
4. Crea credenciales OAuth2
5. Configura la URI de redirección: `http://localhost:8082/google-auth-callback.html`

### Configuración del archivo callback

Edita `public/google-auth-callback.html` y reemplaza:

```javascript
client_id: 'YOUR_GOOGLE_CLIENT_ID_HERE',
client_secret: 'YOUR_GOOGLE_CLIENT_SECRET_HERE',
```

Con tus credenciales reales de Google OAuth.

## 🚀 Desarrollo

```bash
# Iniciar frontend (puerto 8082)
npm run dev

# Iniciar backend API (puerto 3001)
node server.js
```

## 📊 Arquitectura

```
PostgreSQL Database → Express API → React Dashboard
                           ↓
                    Google Calendar API
```

## 🔧 Características Principales

### Dashboard Metrics
- Métricas de evolución en tiempo real
- Estadísticas de mensajes WhatsApp
- Control de workflows n8n
- Estadísticas de usuarios únicos

### Google Calendar
- Autenticación OAuth2 completa
- Selección de calendarios
- Visualización de eventos
- Integración directa con Google Calendar API

### Base de Datos
- Migración completa de Supabase a PostgreSQL
- Capa de compatibilidad para queries existentes
- Conexión directa sin intermediarios

## 🔒 Seguridad

- Variables de entorno para credenciales sensibles
- Autenticación OAuth2 con Google
- Conexión segura a PostgreSQL
- No hay credenciales hardcodeadas en el código fuente

## 🚨 Importante - Configuración de Producción

Este es un proyecto **experimental**. Para producción:

1. Usar variables de entorno para todas las credenciales
2. Configurar HTTPS para OAuth callbacks
3. Implementar rate limiting en la API
4. Configurar CORS apropiadamente
5. Usar certificados SSL para PostgreSQL

## 📝 Desarrollo

Creado como separación experimental del sistema principal para desarrollo independiente del frontend.

## 🤝 Contribución

Este es un repositorio experimental. Los cambios se pueden integrar al sistema principal después de pruebas exitosas.