// src/ai/flows/predict-performance-score.ts
'use server';

/**
 * @fileOverview Genera una puntuación de rendimiento predictiva (0-100) para creatividades de anuncios y proporciona recomendaciones priorizadas para la mejora.
 *
 * - predictPerformanceScore - Una función que se encarga de la predicción del rendimiento de los anuncios y proporciona recomendaciones.
 * - PredictPerformanceInput - El tipo de entrada para la función predictPerformanceScore.
 * - PredictPerformanceOutput - El tipo de retorno para la función predictPerformanceScore.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictPerformanceInputSchema = z.object({
  adCreative: z
    .string()
    .describe('El contenido creativo del anuncio, incluido el texto y cualquier otro detalle relevante.'),
  campaignObjectives: z
    .string()
    .describe('Objetivos específicos de la campaña publicitaria (por ejemplo, reconocimiento, conversión, interacción).'),
  targetAudienceDemographics: z
    .string()
    .describe('Información demográfica sobre el público objetivo.'),
  competitorData: z
    .string()
    .optional()
    .describe('Datos sobre los competidores en la industria.'),
});
export type PredictPerformanceInput = z.infer<typeof PredictPerformanceInputSchema>;

const PredictPerformanceOutputSchema = z.object({
  performanceScore: z
    .number()
    .describe('Una puntuación de rendimiento predictiva (0-100) para la creatividad del anuncio.'),
  recommendations: z
    .array(z.string())
    .describe('Recomendaciones priorizadas para mejorar la creatividad del anuncio.'),
  sentimentAnalysis: z.string().describe('Análisis de sentimiento de la creatividad del anuncio.'),
  predictedCtr: z.number().describe('La tasa de clics (CTR) prevista del anuncio.'),
  predictedCpc: z.number().describe('El costo por clic (CPC) previsto del anuncio.'),
  predictedRoas: z.number().describe('El retorno de la inversión publicitaria (ROAS) previsto del anuncio.'),
});
export type PredictPerformanceOutput = z.infer<typeof PredictPerformanceOutputSchema>;

export async function predictPerformanceScore(input: PredictPerformanceInput): Promise<PredictPerformanceOutput> {
  return predictPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictPerformancePrompt',
  input: {schema: PredictPerformanceInputSchema},
  output: {schema: PredictPerformanceOutputSchema},
  prompt: `
Eres un experto senior en marketing digital y ciencia de datos publicitarios con 15+ años de experiencia optimizando creatividades para máximo rendimiento. Tu especialidad es predecir métricas de rendimiento y generar recomendaciones accionables basadas en análisis profundo de múltiples variables.

## CONTEXTO DE ANÁLISIS
<adCreative>{{{adCreative}}}</adCreative>
<campaignObjectives>{{{campaignObjectives}}}</campaignObjectives>
<targetAudience>{{{targetAudienceDemographics}}}</targetAudience>
<competitorData>{{{competitorData}}}</competitorData>

## PROCESO DE RAZONAMIENTO PASO A PASO

### PASO 1: ANÁLISIS INICIAL DE LA CREATIVIDAD
Primero, examina la creatividad publicitaria y responde mentalmente:
- ¿Cuáles son los elementos visuales y textuales clave?
- ¿El mensaje principal es claro y directo?
- ¿Hay una llamada a la acción evidente?
- ¿El tono es apropiado para el público objetivo?

### PASO 2: EVALUACIÓN DE ALINEACIÓN ESTRATÉGICA
Evalúa qué tan bien la creatividad se alinea con:
- Los objetivos específicos de la campaña
- Las características demográficas del público objetivo
- El posicionamiento competitivo en el mercado
- Las mejores prácticas de la industria

### PASO 3: ANÁLISIS DE SENTIMIENTO PROFUNDO
Determina el sentimiento considerando:
- Emociones que evoca el mensaje (confianza, urgencia, aspiración, etc.)
- Connotaciones de las palabras utilizadas
- Impacto psicológico del diseño visual
- Resonancia emocional con el público objetivo

### PASO 4: CÁLCULO DE PUNTUACIÓN DE RENDIMIENTO (0-100)
Pondera estos factores críticos:
- **Claridad del mensaje** (20%): ¿Es fácil entender qué se ofrece?
- **Relevancia del público** (25%): ¿Conecta con la audiencia objetivo?
- **Calidad de la CTA** (20%): ¿La llamada a la acción es compelente?
- **Diferenciación competitiva** (15%): ¿Se destaca de la competencia?
- **Potencial viral/engagement** (10%): ¿Generará interacción?
- **Coherencia de marca** (10%): ¿Mantiene la identidad de marca?

**CRITERIOS DE PUNTUACIÓN OPTIMISTAS:**
- Creatividades funcionales que cumplan su propósito básico deben obtener 65+ puntos
- Solo penaliza severamente fallas críticas evidentes
- Reconoce fortalezas existentes y potencial de mejora
- Una creatividad promedio pero efectiva merece 70-80 puntos

### PASO 5: PREDICCIÓN DE MÉTRICAS CLAVE
Basándote en tu análisis, predice métricas realistas considerando:

**CTR (Click-Through Rate)**:
- Industria promedio: 0.5-3.0%
- Factores: relevancia, creatividad, segmentación
- Formato: número decimal (ej: 2.1 para 2.1%)

**CPC (Cost Per Click)**:
- Varía según industria y competencia
- Factores: calidad del anuncio, targeting, demanda
- Formato: valor monetario USD (ej: 0.75)

**ROAS (Return on Ad Spend)**:
- Objetivo típico: 3:1 a 8:1 dependiendo del sector
- Factores: conversión esperada, valor del cliente
- Formato: ratio decimal (ej: 4.5 para 4.5:1)

### PASO 6: GENERACIÓN DE RECOMENDACIONES PRIORIZADAS
Crea 3-6 recomendaciones específicas y accionables priorizadas por impacto:

**Criterios para recomendaciones efectivas:**
- Específicas y ejecutables (no genéricas)
- Basadas en deficiencias identificadas
- Priorizadas por potencial de mejora
- Incluyen sugerencias de testing cuando sea relevante
- Consideran recursos y viabilidad de implementación

**Categorías de mejora:**
1. **Mensaje y Copy**: claridad, persuasión, tono
2. **Elementos visuales**: contraste, legibilidad, jerarquía
3. **Llamada a la acción**: ubicación, texto, diseño
4. **Segmentación**: targeting, personalización
5. **Testing**: variantes A/B, optimización continua

## FORMATO DE RESPUESTA

Responde ÚNICAMENTE con un objeto JSON válido siguiendo esta estructura exacta:

\`\`\`json
{
  "performanceScore": [número entre 0-100],
  "sentimentAnalysis": "[positivo/neutral/negativo con breve explicación]",
  "predictedCtr": [número decimal, ej: 2.1],
  "predictedCpc": [número decimal, ej: 0.75],
  "predictedRoas": [número decimal, ej: 4.5],
  "recommendations": [
    "Recomendación específica 1 con acción clara",
    "Recomendación específica 2 con acción clara",
    "Recomendación específica 3 con acción clara"
  ]
}
\`\`\`  

## EJEMPLO DE ANÁLISIS COMPLETO

**Entrada de ejemplo:**
- Creatividad: "¡Descubre el futuro de la tecnología! Smartphone XZ Pro con cámara IA. Compra ahora y recibe envío gratis."
- Objetivos: Generar ventas directas
- Audiencia: Hombres 25-45, ingresos medios-altos, interesados en tecnología
- Competencia: Marcas premium con descuentos agresivos

**Salida esperada:**
\`\`\`json
{
  "performanceScore": 82,
  "sentimentAnalysis": "positivo - evoca innovación y urgencia, con buen potencial de engagement",
  "predictedCtr": 2.3,
  "predictedCpc": 1.15,
  "predictedRoas": 4.1,
  "recommendations": [
    "Especificar el beneficio único de la 'cámara IA' con un ejemplo concreto de uso",
    "Agregar elemento de escasez temporal ('por tiempo limitado') para aumentar urgencia",
    "Incluir testimonio breve o rating de usuarios para aumentar credibilidad",
    "Probar variante de CTA más específica: 'Ver ofertas exclusivas' vs 'Compra ahora'",
    "Segmentar audiencia por subgrupos (fotografía vs gaming) para personalizar mensaje"
  ]
}
\`\`\`

Procede ahora con el análisis de la creatividad proporcionada siguiendo este proceso paso a paso.
`,
});

const predictPerformanceFlow = ai.defineFlow(
  {
    name: 'predictPerformanceFlow',
    inputSchema: PredictPerformanceInputSchema,
    outputSchema: PredictPerformanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
