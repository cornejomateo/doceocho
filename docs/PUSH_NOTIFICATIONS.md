# Sistema de Notificaciones Push para Chat

## ¿Qué es?

Un sistema de notificaciones push web que permite a los usuarios recibir alertas en sus dispositivos móviles cuando se envían mensajes en los canales de chat, incluso cuando la aplicación web está cerrada o en segundo plano.

## ¿Por qué funciona?

Las notificaciones push web son un estándar W3C que permite a los navegadores recibir notificaciones de servidores externos mediante un **Service Worker** que corre en segundo plano, independientemente de si la aplicación está abierta o no.

## Tecnologías Utilizadas

### 1. **Web Push API**

- Estándar W3C para notificaciones push en navegadores
- Permite recibir notificaciones sin que la web esté abierta
- Funciona en Chrome, Firefox, Safari (iOS/macOS), Edge

### 2. **VAPID (Voluntary Application Server Identification)**

- Protocolo de autenticación para web push
- Permite que tu servidor envíe notificaciones sin usar servicios de terceros
- Usa claves pública/privada para autenticar las notificaciones
- **Gratuito** - no requiere servicios como Firebase o OneSignal

### 3. **Service Worker**

- Script que corre en segundo plano en el navegador
- Recibe y muestra las notificaciones push
- Funciona incluso cuando la web está cerrada
- Requisito para PWA (Progressive Web App)

### 4. **web-push (Node.js)**

- Librería para enviar notificaciones desde el servidor
- Maneja la encriptación y envío de notificaciones
- Compatible con VAPID

### 5. **Supabase**

- Almacena las suscripciones de los usuarios
- Base de datos para gestionar qué usuarios tienen qué dispositivos suscritos

## Arquitectura del Sistema

```
┌─────────────────┐
│   Usuario A     │
│  (Envía msg)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Server Action (sendMessageAction)           │
│  - Guarda mensaje en DB                                │
│  - Busca suscriptores del canal en Supabase            │
│  - Envía notificaciones push a cada suscriptor          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              web-push (Node.js)                         │
│  - Encripta el payload con VAPID                        │
│  - Envía al servicio de push del navegador              │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│         Servicio Push del Navegador (Google, Apple)     │
│  - Recibe y almacena la notificación                    │
│  - La entrega cuando el dispositivo está disponible    │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Usuario B     │
│  (Recibe push)  │
│  Service Worker │
│  Muestra alerta │
└─────────────────┘
```

## Componentes del Sistema

### 1. **Base de Datos (Supabase)**

**Tabla `push_subscriptions`:**

```sql
CREATE TABLE push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(username),
  endpoint TEXT NOT NULL UNIQUE,        -- URL del servicio push
  p256dh TEXT NOT NULL,                -- Clave de encriptación
  auth TEXT NOT NULL,                  -- Clave de autenticación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Por qué:**

- Almacena las suscripciones de cada usuario
- Un usuario puede tener múltiples dispositivos (celular, PC, tablet)
- Cada dispositivo tiene su propia suscripción

### 2. **Service Worker (`/public/sw.js`)**

```javascript
self.addEventListener('push', (event) => {
	const data = event.data.json();
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: data.icon,
			// ... opciones
		})
	);
});
```

**Por qué:**

- Recibe las notificaciones push en segundo plano
- Muestra la notificación del sistema operativo
- Funciona aunque la web esté cerrada

### 3. **Hook React (`usePushNotifications`)**

```typescript
export function usePushNotifications() {
  const { subscribe, unsubscribe, permission } = ...

  // Suscribe el dispositivo a notificaciones
  const subscribe = async () => {
    // 1. Registra service worker
    // 2. Convierte clave VAPID a Uint8Array
    // 3. Suscribe al push service
    // 4. Guarda suscripción en DB
  }
}
```

**Por qué:**

- Maneja la lógica de suscripción en el cliente
- Solicita permisos al usuario
- Convierte formatos de datos (base64 URL-safe → Uint8Array)

### 4. **Server Action (`sendPushNotificationToChannel`)**

```typescript
export async function sendPushNotificationToChannel(
	channelId: number,
	senderUsername: string,
	message: string,
	channelName: string
) {
	// 1. Busca suscriptores del canal
	// 2. Envía notificación a cada uno
	// 3. Usa web-push con VAPID
}
```

**Por qué:**

- Se ejecuta cuando se envía un mensaje
- Busca todos los dispositivos suscritos del canal
- Envía notificaciones en paralelo

### 5. **Integración con Envío de Mensajes**

```typescript
// En sendMessageAction
await sendPushNotificationToChannel(
	channelId,
	userResult.data.username,
	content.trim(),
	channel?.name || 'Canal'
);
```

**Por qué:**

- Automatiza el envío de notificaciones
- Se integra con el flujo existente de chat
- No requiere cambios en la UI de envío

## Flujo Completo de Usuario

### Suscripción

1. Usuario abre el chat en su dispositivo móvil
2. Ve el botón "Habilitar notificaciones"
3. Hace clic → Navegador solicita permiso
4. Usuario acepta permiso
5. Service Worker se registra
6. Dispositivo se suscribe al servicio push
7. Suscripción se guarda en Supabase

### Recepción de Notificación

1. Usuario A envía mensaje en el chat
2. `sendMessageAction` guarda el mensaje
3. Busca suscriptores del canal en Supabase
4. Para cada suscriptor:
   - Encripta payload con VAPID
   - Envía al servicio push del navegador
5. Servicio push del navegador almacena la notificación
6. Service Worker del Usuario B recibe la notificación
7. Muestra alerta del sistema operativo
8. Usuario B puede abrir la web desde la notificación

## Requisitos Técnicos

### Obligatorios

- **HTTPS** - Las notificaciones push requieren HTTPS (o localhost para desarrollo)
- **Service Worker** - Debe estar registrado y funcionando
- **VAPID Keys** - Claves pública/privada para autenticación
- **URL Pública** - El servicio push debe poder alcanzar tu servidor

### Para Desarrollo

- **ngrok** o similar para tunelamiento HTTPS en local
- O desplegar a Vercel/Netlify para tener HTTPS y URL pública

### Para Producción

- **Dominio con HTTPS** (Vercel lo proporciona automáticamente)
- **Variables de entorno** configuradas en Vercel:
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`

## Configuración

### 1. Generar Claves VAPID

```bash
npx tsx scripts/generate-vapid-keys.ts
```

### 2. Agregar Variables de Entorno

En Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BCeNC5d4Pf6GL5Zfzv3sUII0WEDO8AkOLLFSlZyZ1ISLKhEai3boAJ-AYdKb-nEzXupy6ak_FVB8pPhTFPPLlnE
VAPID_PRIVATE_KEY=k6qawgUGqXgntibCJqqTH4pRvnrSRGJh91gBWCORiuY
```

### 3. Ejecutar SQL en Supabase

```sql
-- Ejecutar el contenido de supabase/push-subscriptions.sql
```

### 4. Desplegar

```bash
git push origin push-notification
# Vercel despliega automáticamente
```

## Detalles Técnicos Importantes

### Conversión de Clave VAPID

```typescript
// La clave VAPID viene en base64 URL-safe (con - y _)
const base64Key = vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/');
// Se necesita agregar padding
const paddedKey = base64Key.padEnd(Math.ceil(base64Key.length / 4) * 4, '=');
// Convertir a Uint8Array para el API de push
const applicationServerKey = Uint8Array.from(atob(paddedKey), (c) => c.charCodeAt(0));
```

**Por qué:**

- `web-push` genera claves en base64 URL-safe
- El API de push espera base64 estándar
- `atob()` falla con caracteres URL-safe

### Verificación de Permisos

```typescript
// Verificar permiso directamente, no el estado React
const currentPermission = Notification.permission;
if (currentPermission !== 'granted') {
	return { success: false, error: 'Permission not granted' };
}
```

**Por qué:**

- El estado React puede estar desactualizado
- `Notification.permission` siempre es el valor actual
- Evita problemas de sincronización

### Seguridad

- **RLS deshabilitado** en `push_subscriptions` (seguridad en server actions)
- **Solo usuarios autenticados** pueden suscribirse
- **Solo miembros del canal** reciben notificaciones
- **El remitente no recibe** su propia notificación

## Ventajas de Este Enfoque

1. **Gratuito** - No requiere servicios de terceros (Firebase, OneSignal)
2. **Control total** - Tú gestionas las claves y el envío
3. **Estándar W3C** - Compatible con todos los navegadores modernos
4. **PWA-ready** - Funciona con Progressive Web Apps
5. **Sin dependencias externas** - Solo tu servidor y el navegador

## Limitaciones

1. **HTTPS obligatorio** - No funciona en HTTP (excepto localhost)
2. **Soporte de navegador** - Requiere navegador moderno con Service Worker
3. **iOS Safari** - Requiere iOS 16.4+ para notificaciones push web
4. **Localhost** - No funciona en desarrollo sin tunelamiento

## Archivos del Sistema

- `/lib/push/vapid.ts` - Configuración VAPID y envío de notificaciones
- `/lib/push/subscriptions.ts` - Funciones para gestionar suscripciones
- `/actions/push/send-notification.ts` - Server action para enviar notificaciones
- `/hooks/push/use-push-notifications.ts` - Hook React para suscripción
- `/public/sw.js` - Service Worker para recibir notificaciones
- `/supabase/push-subscriptions.sql` - SQL para crear tabla de suscripciones
- `/scripts/generate-vapid-keys.ts` - Script para generar claves VAPID

## Troubleshooting

### "VAPID public key not configured"

- Agrega `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en Vercel
- Redespliega después de agregar la variable

### "Permission not granted"

- Usuario debe aceptar el permiso de notificaciones
- Revocar permiso en configuración del navegador para volver a solicitar

### "Failed to execute 'atob'"

- La clave VAPID no está en formato correcto
- Verifica la conversión de base64 URL-safe a estándar

### No funciona en local

- Las notificaciones push requieren HTTPS
- Usa ngrok o despliega a Vercel para probar

### Service Worker no se registra

- Verifica que `/public/sw.js` sea accesible
- Revisa la consola para errores de registro
