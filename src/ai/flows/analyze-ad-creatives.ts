'use server';

/**
 * @fileOverview Analiza las creatividades de los anuncios (imágenes, videos, carruseles) para predecir su rendimiento.
 *
 * - analyzeAdCreatives - Analiza las creatividades de los anuncios para predecir el rendimiento en función de la claridad, el diseño y la afinidad con la audiencia.
 * - AnalyzeAdCreativesInput - El tipo de entrada para la función analyzeAdCreatives.
 * - AnalyzeAdCreativesOutput - El tipo de retorno para la función analyzeAdCreatives.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {DEFAULT_AD_ANALYSIS_PROMPT} from '@/lib/prompts';

const AnalyzeAdCreativesInputSchema = z.object({
  creativeDataUri: z
    .string()
    .describe(
      "La creatividad del anuncio (imagen, video o carrusel) como un URI de datos que debe incluir un tipo MIME y usar codificación Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  objective: z
    .string()
    .describe(
      'El objetivo específico de la campaña publicitaria (reconocimiento, conversión, interacción).'
    ),
  demographics: z
    .string()
    .describe(
      'Los datos demográficos del público objetivo de la campaña publicitaria.'
    ),
  customPrompt: z
    .string()
    .optional()
    .describe('Un prompt personalizado para anular el predeterminado.'),
});
export type AnalyzeAdCreativesInput = z.infer<
  typeof AnalyzeAdCreativesInputSchema
>;

const AnalyzeAdCreativesOutputSchema = z.object({
  performanceScore: z
    .number()
    .describe(
      'Una puntuación de rendimiento predictiva (0-100) para la creatividad del anuncio.'
    ),
  clarityScore: z
    .number()
    .describe('Puntuación (0-100) que indica la claridad del mensaje del anuncio.'),
  designScore: z
    .number()
    .describe('Puntuación (0-100) que evalúa el impacto visual y el diseño del anuncio.'),
  audienceAffinityScore: z
    .number()
    .describe(
      'Puntuación (0-100) que representa la afinidad del anuncio con el público objetivo.'
    ),
  recommendations: z
    .array(z.string())
    .describe(
      'Una lista de recomendaciones priorizadas para mejorar la efectividad del anuncio.'
    ),
});
export type AnalyzeAdCreativesOutput = z.infer<
  typeof AnalyzeAdCreativesOutputSchema
>;

export async function analyzeAdCreatives(
  input: AnalyzeAdCreativesInput
): Promise<AnalyzeAdCreativesOutput> {
  return analyzeAdCreativesFlow(input);
}

const analyzeAdCreativesPrompt = ai.definePrompt({
  name: 'analyzeAdCreativesPrompt',
  input: {schema: AnalyzeAdCreativesInputSchema},
  output: {schema: AnalyzeAdCreativesOutputSchema},
  prompt: DEFAULT_AD_ANALYSIS_PROMPT,
});

const analyzeAdCreativesFlow = ai.defineFlow(
  {
    name: 'analyzeAdCreativesFlow',
    inputSchema: AnalyzeAdCreativesInputSchema,
    outputSchema: AnalyzeAdCreativesOutputSchema,
  },
  async (input) => {
    if (input.customPrompt) {
      const promptForGenerate: any[] = [];
      const mediaPlaceholder = /\{\{media url=creativeDataUri\}\}/;

      let processedPrompt = input.customPrompt
        .replace(/\{\{\{objective\}\}\}/g, input.objective)
        .replace(/\{\{\{demographics\}\}\}/g, input.demographics);

      const textParts = processedPrompt.split(mediaPlaceholder);

      if (textParts.length > 2) {
        throw new Error(
          'El prompt personalizado solo puede contener una variable de imagen {{media url=creativeDataUri}}.'
        );
      }

      if (textParts[0]) {
        promptForGenerate.push({text: textParts[0]});
      }

      if (textParts.length === 2) {
        promptForGenerate.push({media: {url: input.creativeDataUri}});
      }

      if (textParts[1]) {
        promptForGenerate.push({text: textParts[1]});
      }

      const {output} = await ai.generate({
        prompt: promptForGenerate,
        model: 'googleai/gemini-2.0-flash',
        output: {schema: AnalyzeAdCreativesOutputSchema},
      });
      return output!;
    } else {
      const {output} = await analyzeAdCreativesPrompt(input);
      return output!;
    }
  }
);
