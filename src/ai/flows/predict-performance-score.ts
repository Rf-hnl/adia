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
  prompt: `Eres un especialista en marketing experto que analiza las creatividades de los anuncios y predice su rendimiento.

  Basado en la creatividad del anuncio, los objetivos de la campaña, los datos demográficos del público objetivo y los datos de la competencia, genera una puntuación de rendimiento predictiva (0-100) y proporciona recomendaciones priorizadas para mejorar.

  Creatividad del anuncio: {{{adCreative}}}
  Objetivos de la campaña: {{{campaignObjectives}}}
  Demografía del público objetivo: {{{targetAudienceDemographics}}}
  Datos de la competencia: {{{competitorData}}}

  Proporciona un análisis de sentimiento de la creatividad del anuncio, la tasa de clics (CTR) prevista, el costo por clic (CPC) previsto y el retorno de la inversión publicitaria (ROAS) previsto.

  Asegúrate de que la puntuación de rendimiento esté entre 0 y 100.
  Las recomendaciones deben ser prácticas y específicas.
  El análisis de sentimiento debe identificar el sentimiento general transmitido por la creatividad del anuncio (por ejemplo, positivo, negativo, neutral).
  El CTR, el CPC y el ROAS también son importantes para los anunciantes.
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
