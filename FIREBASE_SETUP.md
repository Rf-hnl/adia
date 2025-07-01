# 🔥 Firebase Setup Guide

## 📋 Pasos para Configurar Firebase

### 1. **Crear Proyecto en Firebase Console**

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto: `ai-creative-analyzer`
4. Habilita Google Analytics (opcional)
5. Selecciona una cuenta de Analytics

### 2. **Configurar Authentication**

1. En Firebase Console, ve a **Authentication > Sign-in method**
2. Habilita los proveedores que necesites:
   - ✅ **Email/Password**
   - ✅ **Google** (recomendado)
   - ✅ **GitHub** (opcional)

### 3. **Configurar Firestore Database**

1. Ve a **Firestore Database** 
2. Haz clic en "Crear base de datos"
3. Selecciona **"Empezar en modo de prueba"**
4. Elige una ubicación (recomendado: `us-central1`)
5. Las reglas se aplicarán automáticamente desde `firestore.rules`

### 4. **Configurar Storage**

1. Ve a **Storage**
2. Haz clic en "Comenzar"
3. Selecciona **"Empezar en modo de prueba"**
4. Las reglas se aplicarán automáticamente desde `storage.rules`

### 5. **Obtener Configuración de Firebase**

#### **Para el Frontend (Client SDK):**
1. Ve a **Configuración del proyecto** ⚙️
2. En la pestaña **General**, busca "Tus apps"
3. Haz clic en **"Agregar app"** > **Web** 🌐
4. Registra la app con el nombre: `AI Creative Analyzer`
5. Copia la configuración y pégala en `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123
```

#### **Para el Backend (Admin SDK):**
1. Ve a **Configuración del proyecto** ⚙️
2. Pestaña **Cuentas de servicio**
3. Haz clic en **"Generar nueva clave privada"**
4. Descarga el archivo JSON
5. Copia los valores y pégalos en `.env.local`:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkq...\n-----END PRIVATE KEY-----"
```

### 6. **Configurar Google AI API**

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crea una nueva API key
3. Cópiala en `.env.local`:

```bash
GOOGLE_GENAI_API_KEY=AIza...
```

### 7. **Instalar Firebase CLI**

```bash
npm install -g firebase-tools
```

### 8. **Inicializar Firebase en el Proyecto**

```bash
# Login a Firebase
firebase login

# Inicializar proyecto
firebase init

# Selecciona:
# ✅ Firestore
# ✅ Storage  
# ✅ Hosting
# ✅ Emulators
```

### 9. **Desplegar Reglas de Seguridad**

```bash
# Desplegar reglas de Firestore
firebase deploy --only firestore:rules

# Desplegar reglas de Storage
firebase deploy --only storage:rules

# Desplegar índices
firebase deploy --only firestore:indexes
```

---

## 🧪 Desarrollo Local con Emuladores

### **Iniciar Emuladores:**
```bash
firebase emulators:start
```

### **URLs de Emuladores:**
- **Firestore**: http://localhost:8080
- **Authentication**: http://localhost:9099
- **Storage**: http://localhost:9199
- **UI Admin**: http://localhost:4000

### **Variables de Entorno para Emulators:**
```bash
# Agregar a .env.local para development
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

---

## 🚀 Despliegue a Producción

### **Build para Producción:**
```bash
npm run build
```

### **Desplegar a Firebase Hosting:**
```bash
firebase deploy --only hosting
```

### **Desplegar Todo:**
```bash
firebase deploy
```

---

## 📊 Estructura de Base de Datos

### **Colecciones en Firestore:**

```
/users/{userId}
  - uid: string
  - email: string
  - displayName: string
  - plan: 'free' | 'pro' | 'enterprise'
  - analysesUsed: number
  - analysesLimit: number
  - createdAt: timestamp
  - lastLogin: timestamp

/analyses/{analysisId}
  - userId: string
  - imageUrl: string
  - demographics: string
  - objective: string
  - performanceScore: number
  - clarityScore: number
  - designScore: number
  - audienceAffinityScore: number
  - recommendations: string[]
  - status: 'processing' | 'completed' | 'failed'
  - createdAt: timestamp
  - updatedAt: timestamp

/usage/{userId_YYYY-MM-DD}
  - userId: string
  - date: string
  - analysesCount: number
  - plan: string
  - createdAt: timestamp
```

---

## 🔒 Seguridad

### **Reglas de Firestore:**
- ✅ Usuarios solo pueden acceder a sus propios datos
- ✅ Análisis vinculados al usuario autenticado
- ✅ Validación de estructura de documentos

### **Reglas de Storage:**
- ✅ Subida solo a carpeta propia del usuario
- ✅ Máximo 10MB por imagen
- ✅ Solo archivos de imagen permitidos

---

## 🎯 Next Steps

1. ✅ Configurar Firebase Console
2. ✅ Copiar credenciales a `.env.local`
3. ✅ Instalar Firebase CLI
4. ✅ Desplegar reglas de seguridad
5. ✅ Probar con emuladores locales
6. ✅ Integrar servicios en la app
7. ✅ Desplegar a producción

---

## 🆘 Troubleshooting

### **Error: Missing API Key**
```bash
# Verificar que todas las variables estén en .env.local
cat .env.local
```

### **Error: Permission Denied**
```bash
# Verificar reglas de Firestore
firebase firestore:rules:get
```

### **Error: Storage Upload Failed**
```bash
# Verificar reglas de Storage
firebase storage:rules:get
```

---

¡Firebase está listo para AI Creative Analyzer! 🚀