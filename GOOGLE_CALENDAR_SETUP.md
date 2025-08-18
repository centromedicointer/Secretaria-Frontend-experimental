# Configuración de Google Calendar

Esta guía explica cómo configurar la autenticación de Google Calendar para el dashboard.

## Pasos para configurar Google OAuth2

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Calendar:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

### 2. Crear credenciales OAuth2

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Si es la primera vez, configura la pantalla de consentimiento:
   - Ve a "OAuth consent screen"
   - Selecciona "External" (o "Internal" si es para G Suite)
   - Completa la información requerida
   - Agrega los scopes necesarios: `https://www.googleapis.com/auth/calendar`
4. Crear OAuth client ID:
   - Tipo de aplicación: "Web application"
   - Nombre: "Secretaria Dashboard"
   - Authorized redirect URIs: 
     - `http://localhost:8082/auth/google/callback` (desarrollo)
     - `https://tu-dominio.com/auth/google/callback` (producción)

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y agrega tus credenciales:

```bash
# Copiar archivo de configuración
cp .env.example .env.local
```

Editar `.env.local`:
```env
# Google Calendar OAuth Configuration
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=tu-client-secret
```

### 4. Configurar dominios autorizados

En Google Cloud Console > Credentials > tu OAuth client:
- **Authorized JavaScript origins**:
  - `http://localhost:8082` (desarrollo)
  - `https://tu-dominio.com` (producción)
- **Authorized redirect URIs**:
  - `http://localhost:8082/auth/google/callback` (desarrollo)
  - `https://tu-dominio.com/auth/google/callback` (producción)

## Uso del sistema

### Método 1: Configuración automática (Nuevo sistema)

1. Ve al dashboard de Secretaria
2. En la sección de Google Calendar, haz clic en "Configurar calendario"
3. Haz clic en "Conectar con Google Calendar"
4. Se abrirá una ventana de autenticación de Google
5. Autoriza la aplicación
6. Selecciona el calendario que quieres usar
7. ¡Listo! El calendario se mostrará automáticamente

### Método 2: ID de calendario directo (Sistema actual)

Si ya tienes el ID del calendario de Google:

1. Ve a [Google Calendar](https://calendar.google.com)
2. En la barra lateral izquierda, busca tu calendario
3. Haz clic en los 3 puntos junto al nombre del calendario
4. Selecciona "Settings and sharing"
5. Busca "Calendar ID" en la sección de configuración
6. Copia el ID (formato: `abc123@group.calendar.google.com`)
7. Úsalo directamente en el componente `GoogleCalendarWidget`

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verifica que las URLs de redirect estén exactamente configuradas en Google Cloud Console
- Asegúrate de que la URL incluya el protocolo correcto (`http://` vs `https://`)

### Error: "unauthorized_client"
- Verifica que el Client ID sea correcto
- Asegúrate de que la aplicación esté publicada (no en modo testing)

### Error: "access_denied"
- El usuario rechazó los permisos
- Verifica que los scopes solicitados sean correctos

### Calendario no se muestra
- Verifica que el calendario sea accesible por la cuenta autenticada
- Asegúrate de que el calendario esté compartido si es necesario
- Revisa la consola del navegador para errores de API

## Permisos necesarios

El sistema solicita los siguientes permisos de Google Calendar:
- `https://www.googleapis.com/auth/calendar` - Acceso completo a calendarios
- `https://www.googleapis.com/auth/calendar.readonly` - Solo lectura (alternativa más segura)

## Seguridad

- Las credenciales se almacenan localmente en el navegador
- Los tokens de acceso se renuevan automáticamente
- No se almacenan credenciales en el backend
- Se puede desconectar fácilmente desde la interfaz

## Notas importantes

1. **Modo desarrollo**: Asegúrate de usar `http://localhost:8082` en las URLs
2. **Modo producción**: Cambia todas las URLs a tu dominio HTTPS
3. **Múltiples calendarios**: El usuario puede cambiar entre calendarios autorizados
4. **Renovación de tokens**: Los tokens se renuevan automáticamente cuando expiran