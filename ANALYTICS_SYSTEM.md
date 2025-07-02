# 📊 Sistema de Analytics Anónimo para AI Creative Analyzer

## 🎯 Objetivo

Implementar un sistema completo de feedback y tracking para usuarios en modo testing, sin requerir registro o autenticación, manteniendo la privacidad y permitiendo mejoras continuas basadas en datos reales.

---

## 🏗 Arquitectura del Sistema

### **1. Gestión de Usuarios Anónimos**
- **ID Anónimo**: Generado con UUID y almacenado en localStorage
- **Persistencia Local**: Datos del usuario guardados localmente
- **Tracking de Sesiones**: Conteo de sesiones y análisis realizados
- **Información del Dispositivo**: Datos técnicos para debugging

### **2. Tracking de Análisis**
- **Hash de Imágenes**: Detección de análisis duplicados
- **Métricas de Rendimiento**: Tiempo de procesamiento de IA
- **Resultados Completos**: Almacenamiento de todos los datos generados
- **Contexto Técnico**: Versión del modelo, información del dispositivo

### **3. Sistema de Feedback**
- **Ratings Múltiples**: Evaluación detallada en 5 estrellas
- **Feedback Textual**: Comentarios y sugerencias de mejora
- **Evaluación Específica**: Precisión, utilidad, recomendaciones
- **Intención de Uso**: Recomendación y uso futuro

---

## 📂 Estructura de Datos en Firebase

### **🔹 Colección: `anonymous_users`**
```typescript
{
  id: "anon_uuid_here",
  createdAt: timestamp,
  lastActive: timestamp,
  sessionCount: number,
  analysisCount: number,
  feedbackCount: number,
  deviceInfo: {
    userAgent: string,
    language: string,
    timezone: string,
    screenResolution: string
  }
}
```

### **🔹 Colección: `analysis_sessions`**
```typescript
{
  anonymousUserId: string,
  imageHash: string, // MD5 para detectar duplicados
  demographics: string,
  objective: string,
  results: AnalysisResult, // Resultados completos de IA
  processingTimeMs: number,
  aiModelVersion: string,
  deviceInfo: object,
  sessionId: string,
  userRating?: number (1-5),
  userFeedback?: string,
  wasHelpful?: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **🔹 Colección: `feedback`**
```typescript
{
  anonymousUserId: string,
  analysisSessionId: string,
  overallRating: number (1-5),
  accuracyRating: number (1-5),
  usefulnessRating: number (1-5),
  feedback: string,
  improvementSuggestions?: string,
  performanceScoreAccuracy?: number (1-5),
  recommendationsQuality?: number (1-5),
  wouldRecommend: boolean,
  willUseAgain: boolean,
  createdAt: timestamp
}
```

### **🔹 Colección: `usage_stats`** (Agregados diarios)
```typescript
{
  date: "YYYY-MM-DD",
  totalAnalyses: number,
  uniqueUsers: number,
  avgProcessingTime: number,
  topObjectives: Record<string, number>,
  feedbackCount: number,
  avgRating: number,
  duplicateAnalyses: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **🔹 Colección: `error_logs`**
```typescript
{
  anonymousUserId: string,
  error: {
    message: string,
    stack: string,
    name: string
  },
  context: string,
  additionalData?: any,
  deviceInfo: object,
  createdAt: timestamp
}
```

---

## 🔄 Flujo de Usuario

### **1. Primera Visita**
1. Se genera ID anónimo único
2. Se almacena en localStorage
3. Se registra en Firebase (`anonymous_users`)
4. Se inicializa tracking de sesión

### **2. Realizar Análisis**
1. Usuario sube imagen y completa formulario
2. Se inicia timer de procesamiento
3. Se genera hash de imagen para detectar duplicados
4. Se ejecuta análisis con IA
5. Se almacena sesión completa en `analysis_sessions`
6. Se actualizan estadísticas diarias

### **3. Proporcionar Feedback**
1. Usuario ve botón "Dar Feedback" en resultados
2. Flujo de feedback en 2 pasos:
   - **Paso 1**: Rating rápido (1-5 estrellas)
   - **Paso 2**: Feedback detallado (si rating < 4)
3. Se almacena en `feedback` y se vincula a `analysis_sessions`
4. Se actualizan métricas de usuario y estadísticas

---

## 🛠 Implementación Técnica

### **Archivos Principales:**

#### **1. `src/lib/anonymous-user.ts`**
- Gestión de IDs anónimos
- Almacenamiento local de datos
- Tracking de sesiones y contadores
- Gestión de preferencias

#### **2. `src/lib/firebase-analytics.ts`**
- Servicios de Firebase para analytics
- Tracking de análisis y feedback
- Gestión de estadísticas diarias
- Logging de errores

#### **3. `src/hooks/use-analytics.ts`**
- Hook React para integración fácil
- Funciones para tracking y feedback
- Gestión de estado de analytics
- Manejo de errores

#### **4. `src/components/feedback-dialog.tsx`**
- Componente de interfaz para feedback
- Flujo de 2 pasos (rápido/detallado)
- Ratings múltiples y feedback textual
- Integración con analytics

---

## 🔒 Seguridad y Privacidad

### **Reglas de Firestore:**
- ✅ **Acceso Público**: Todas las colecciones permiten lectura/escritura
- ✅ **Validación**: Estructura de datos validada en el servidor
- ✅ **Anonimización**: No se almacenan datos personales identificables
- ✅ **Logs de Error**: Solo escritura, sin lectura para privacidad

### **Protección de Datos:**
- **IDs Anónimos**: No vinculables a usuarios reales
- **Datos Truncados**: Demografía limitada a 50 caracteres para logging
- **Hash de Imágenes**: Solo hash, no imágenes almacenadas
- **Información del Dispositivo**: Solo para debugging técnico

---

## 📈 Métricas y Insights

### **KPIs Principales:**
1. **Adopción**: Usuarios únicos diarios
2. **Engagement**: Análisis por usuario
3. **Satisfacción**: Rating promedio de feedback
4. **Performance**: Tiempo promedio de procesamiento
5. **Retención**: Usuarios que regresan

### **Insights de Producto:**
- **Objetivos Populares**: Cuáles son más usados
- **Feedback Cualitativo**: Qué mejorar según usuarios
- **Patrones de Uso**: Horarios y frecuencia
- **Problemas Técnicos**: Errores más comunes
- **Duplicados**: Cuánto reusan las mismas imágenes

---

## 🚀 Comandos de Despliegue

### **Setup Inicial:**
```bash
# 1. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Firebase

# 2. Instalar dependencias
npm install

# 3. Desplegar reglas de seguridad
firebase deploy --only firestore:rules

# 4. Probar con emuladores
firebase emulators:start
```

### **Desarrollo Local:**
```bash
# Iniciar emuladores de Firebase
firebase emulators:start

# En otra terminal, iniciar app
npm run dev
```

### **Monitoreo en Producción:**
```bash
# Ver logs en tiempo real
firebase functions:log --only=analytics

# Consultar estadísticas
# (Usar Firebase Console para queries Firestore)
```

---

## 📊 Dashboard de Analytics

### **Métricas en Tiempo Real:**
- Usuarios activos ahora
- Análisis en proceso
- Feedback recibido hoy
- Errores por hora

### **Reportes Históricos:**
- Evolución de usuarios únicos
- Ratings promedio por semana
- Distribución de objetivos de campaña
- Tiempo de procesamiento trends

### **Insights de Feedback:**
- Top issues reportados
- Palabras clave en comentarios
- Correlation entre ratings y uso
- Sugerencias de mejora agrupadas

---

## 🔮 Roadmap de Analytics

### **Fase 1: Básico** ✅
- [x] Tracking anónimo
- [x] Sistema de feedback
- [x] Métricas básicas
- [x] Detección de duplicados

### **Fase 2: Avanzado** 🚧
- [ ] Dashboard web de analytics
- [ ] Alertas automáticas
- [ ] A/B testing framework
- [ ] Cohort analysis

### **Fase 3: IA Insights** 🔮
- [ ] Análisis de sentimiento en feedback
- [ ] Predicción de satisfacción
- [ ] Recomendaciones automáticas de mejoras
- [ ] Clustering de tipos de usuarios

---

## 🆘 Troubleshooting

### **Error: Analytics no inicializa**
```bash
# Verificar configuración Firebase
cat .env.local | grep FIREBASE

# Probar conexión
firebase projects:list
```

### **Error: Feedback no se guarda**
```bash
# Verificar reglas Firestore
firebase firestore:rules:get

# Ver logs de errores
firebase emulators:start --inspect-functions
```

### **Error: Duplicados no detectados**
```bash
# Verificar función de hash
console.log(firebase-analytics.createImageHash(image, demo, obj))
```

---

¡Sistema de Analytics listo para capturar insights valiosos de usuarios en modo testing! 🚀📊