# 🚀 ADIA - Guía de Despliegue en Vercel

## 📋 Preparación Previa

### 1. Archivos de Configuración Creados
- ✅ `vercel.json` - Configuración de despliegue
- ✅ `.env.example` - Plantilla de variables de entorno

### 2. Requisitos Previos
- Cuenta de Vercel (https://vercel.com)
- Repositorio de GitHub/GitLab/Bitbucket
- Proyecto Firebase configurado
- API Key de Google AI (Gemini)

## 🔧 Configuración de Variables de Entorno

### En Vercel Dashboard:

1. **Ve a tu proyecto** → **Settings** → **Environment Variables**

2. **Añade las siguientes variables:**

#### Firebase (Cliente)
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID = tu-proyecto-firebase-id
NEXT_PUBLIC_FIREBASE_API_KEY = tu-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = tu-proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = tu-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID = tu-firebase-app-id
```

#### Google AI (Servidor)
```
GOOGLE_GENAI_API_KEY = tu-google-genai-api-key
```

#### App Configuration
```
NEXT_PUBLIC_APP_URL = https://tu-app.vercel.app
NEXT_PUBLIC_APP_VERSION = 1.0.0
NODE_ENV = production
```

## 🚀 Despliegue Paso a Paso

### Opción 1: Despliegue desde GitHub

1. **Conecta tu repositorio:**
   ```bash
   # Push tu código a GitHub
   git add .
   git commit -m "Preparar para despliegue en Vercel"
   git push origin main
   ```

2. **En Vercel Dashboard:**
   - Click "New Project"
   - Selecciona tu repositorio GitHub
   - Framework: **Next.js** (auto-detectado)
   - Click "Deploy"

### Opción 2: Despliegue con Vercel CLI

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login y desplegar:**
   ```bash
   vercel login
   vercel --prod
   ```

## 🔧 Configuración Post-Despliegue

### 1. Actualizar URLs del Webhook

Una vez desplegado, actualiza los ejemplos de cURL en tu documentación:

```bash
# Reemplaza localhost:3000 con tu dominio de Vercel
curl -X POST https://tu-app.vercel.app/api/webhook/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image": "https://ejemplo.com/imagen.jpg",
    "demographics": "Tu demografía",
    "objective": "Tu objetivo"
  }'
```

### 2. Verificar Funcionalidad

**Endpoints a probar:**
- ✅ `https://tu-app.vercel.app/` - Página principal
- ✅ `https://tu-app.vercel.app/admin-data` - Panel admin
- ✅ `https://tu-app.vercel.app/api/webhook/analyze` - Webhook API

### 3. Configurar Dominio Personalizado (Opcional)

En Vercel Dashboard → **Settings** → **Domains**:
- Añade tu dominio personalizado
- Actualiza DNS según instrucciones
- Actualiza `NEXT_PUBLIC_APP_URL`

## 🔒 Configuración de Seguridad Firebase

### Firebase Security Rules

Actualiza las reglas de Firestore para producción:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura para usuarios anónimos (webhook)
    match /anonymous_users/{userId} {
      allow read, write: if true;
    }
    
    match /analysis_sessions/{sessionId} {
      allow read, write: if true;
    }
    
    // Más restrictivo para otros documentos
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 📊 Monitoreo y Logs

### Ver Logs en Vercel:
1. Dashboard → Tu Proyecto → **Functions**
2. Click en cualquier función para ver logs
3. Busca errores en tiempo real

### Métricas Importantes:
- ⏱️ **Tiempo de respuesta** del webhook
- 🔥 **Uso de Firebase** (operaciones/día)
- 🧠 **Uso de Google AI** (requests/mes)

## 🚨 Troubleshooting

### Error Común 1: Variables de Entorno
```
Error: Firebase API key not found
```
**Solución:** Verifica que todas las variables `NEXT_PUBLIC_*` estén configuradas

### Error Común 2: CORS en API
```
Access to fetch at 'api/...' blocked by CORS
```
**Solución:** Las headers CORS ya están configuradas en `vercel.json`

### Error Común 3: Timeout en IA
```
Function timeout after 10 seconds
```
**Solución:** Las funciones están configuradas para 30s máximo en `vercel.json`

## 🔄 Actualizaciones Futuras

Para actualizar la app:

```bash
# Hacer cambios en código
git add .
git commit -m "Actualización: descripción del cambio"
git push origin main

# Vercel desplegará automáticamente
```

## 📈 Optimizaciones de Producción

### 1. Rate Limiting
Considera añadir límites de uso:
```typescript
// En tu webhook API
const rateLimiter = new Map();
// Implementar lógica de rate limiting
```

### 2. Caching
Para imágenes repetidas:
```typescript
// Cache Redis o Vercel KV
const cachedResult = await kv.get(imageHash);
```

### 3. Analytics
Trackear uso del webhook:
```typescript
// Google Analytics, PostHog, etc.
analytics.track('webhook_usage', { ... });
```

---

## ✅ Checklist de Despliegue

- [ ] ✅ Código pusheado a repositorio
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Proyecto desplegado exitosamente
- [ ] ✅ URLs actualizadas en documentación
- [ ] ✅ Firebase rules configuradas para producción
- [ ] ✅ Webhook probado en producción
- [ ] ✅ Panel admin accesible
- [ ] ✅ Monitoreo configurado

---

**🎉 ¡Tu aplicación ADIA ya está lista en producción!**

**URL de Prueba:** `https://tu-app.vercel.app/api/webhook/analyze`