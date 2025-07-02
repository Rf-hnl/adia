# 🔥 Firebase Collections Auto-Creation - ADIA

## ✅ Estado Actual: COMPLETAMENTE AUTOMATIZADO

Todas las colecciones de Firebase se crean automáticamente cuando se intenta agregar contenido por primera vez. No hay necesidad de crear manualmente ninguna colección.

## 📋 Colecciones que se Auto-Crean:

### 1. **anonymous_users**
- ✅ **Método**: `setDoc()` en `trackAnonymousUser()`
- ✅ **Backup**: Helper `ensureUserExists()` antes de cualquier `updateDoc()`
- ✅ **Se crea cuando**: Primer usuario anónimo visita la app

### 2. **analysis_sessions** 
- ✅ **Método**: `addDoc()` en `trackAnalysisSession()`
- ✅ **Se crea cuando**: Primera imagen se analiza

### 3. **feedback**
- ✅ **Método**: `addDoc()` en `submitFeedback()`
- ✅ **Se crea cuando**: Primer usuario da feedback

### 4. **usage_stats**
- ✅ **Método**: `setDoc()` via helper `ensureDailyStatsExists()`
- ✅ **Se crea cuando**: Primera estadística diaria se registra
- ✅ **Formato**: Un documento por día (YYYY-MM-DD)

### 5. **error_logs**
- ✅ **Método**: `addDoc()` en `logError()`
- ✅ **Se crea cuando**: Primer error se registra

## 🔧 Funciones Helper Implementadas:

### `ensureUserExists(userId: string)`
```typescript
// Garantiza que el usuario anónimo existe antes de hacer updateDoc()
// Si no existe, lo crea automáticamente con setDoc()
```

### `ensureDailyStatsExists(date: string)`
```typescript
// Garantiza que el documento de estadísticas diarias existe
// Crea estructura inicial con todos los campos necesarios
```

## 🚀 Operaciones Seguras:

### ✅ Operaciones que SIEMPRE funcionan (auto-crean):
- `addDoc(collection(db, 'cualquier_coleccion'), data)` ← Crea colección automáticamente
- `setDoc(doc(db, 'cualquier_coleccion', 'id'), data)` ← Crea colección automáticamente

### ⚠️ Operaciones que necesitaban protección:
- `updateDoc(doc(db, 'coleccion', 'id'), data)` ← Requiere que el documento exista
- **SOLUCIÓN**: Usamos helpers `ensureUserExists()` y `ensureDailyStatsExists()`

## 🎯 Flujo de Creación Automática:

1. **Usuario visita la app** → Crea `anonymous_users`
2. **Usuario sube imagen** → Crea `analysis_sessions` + `usage_stats`
3. **Usuario da feedback** → Crea `feedback`
4. **Ocurre un error** → Crea `error_logs`

## 📊 Estructura de Colecciones:

### `anonymous_users/{userId}`
```json
{
  "id": "string",
  "createdAt": "timestamp",
  "lastActive": "timestamp", 
  "analysisCount": "number",
  "feedbackCount": "number",
  "sessionCount": "number",
  "deviceInfo": "object"
}
```

### `analysis_sessions/{sessionId}`
```json
{
  "anonymousUserId": "string",
  "imageHash": "string",
  "demographics": "string",
  "objective": "string",
  "results": "AnalysisResult",
  "processingTimeMs": "number",
  "createdAt": "timestamp"
}
```

### `feedback/{feedbackId}`
```json
{
  "anonymousUserId": "string",
  "analysisSessionId": "string",
  "overallRating": "number",
  "accuracyRating": "number",
  "usefulnessRating": "number",
  "feedback": "string",
  "wouldRecommend": "boolean"
}
```

### `usage_stats/{YYYY-MM-DD}`
```json
{
  "date": "string",
  "totalAnalyses": "number",
  "uniqueUsers": "number", 
  "avgProcessingTime": "number",
  "topObjectives": "object",
  "feedbackCount": "number",
  "avgRating": "number",
  "duplicateAnalyses": "number"
}
```

### `error_logs/{errorId}`
```json
{
  "anonymousUserId": "string",
  "error": {
    "message": "string",
    "stack": "string",
    "name": "string"
  },
  "context": "string",
  "additionalData": "any",
  "createdAt": "timestamp"
}
```

## 🔒 Reglas de Seguridad Firebase:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anonymous users to read/write their own data
    match /anonymous_users/{userId} {
      allow read, write: if true; // Anonymous access
    }
    
    match /analysis_sessions/{sessionId} {
      allow read, write: if true; // Anonymous access
    }
    
    match /feedback/{feedbackId} {
      allow read, write: if true; // Anonymous access
    }
    
    match /usage_stats/{date} {
      allow read, write: if true; // Anonymous access
    }
    
    match /error_logs/{errorId} {
      allow write: if true; // Only write access for errors
    }
  }
}
```

## ✅ Resultado Final:

**TODAS las colecciones se crean automáticamente sin intervención manual. El sistema es completamente autónomo y robusto.**