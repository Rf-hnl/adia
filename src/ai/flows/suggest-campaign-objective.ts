// src/ai/flows/suggest-campaign-objective.ts
'use server';

/**
 * @fileOverview Sugiere objetivos de campaña apropiados basados en el análisis de la creatividad del anuncio.
 *
 * - suggestCampaignObjective - Una función que analiza la creatividad y sugiere el mejor objetivo de campaña.
 * - SuggestObjectiveInput - El tipo de entrada para la función suggestCampaignObjective.
 * - SuggestObjectiveOutput - El tipo de retorno para la función suggestCampaignObjective.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestObjectiveInputSchema = z.object({
  creativeDataUri: z
    .string()
    .describe('La imagen de la creatividad del anuncio en formato base64 data URI.'),
  demographics: z
    .string()
    .optional()
    .describe('Información demográfica del público objetivo si está disponible.'),
});
export type SuggestObjectiveInput = z.infer<typeof SuggestObjectiveInputSchema>;

const SuggestObjectiveOutputSchema = z.object({
  suggestedObjective: z
    .enum(['awareness', 'traffic', 'engagement', 'lead_generation', 'app_installs', 'conversion'])
    .describe('El objetivo de campaña sugerido basado en el análisis de la creatividad.'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Nivel de confianza de la sugerencia (0-100).'),
  reasoning: z
    .string()
    .describe('Explicación de por qué se sugiere este objetivo específico.'),
});
export type SuggestObjectiveOutput = z.infer<typeof SuggestObjectiveOutputSchema>;

export async function suggestCampaignObjective(input: SuggestObjectiveInput): Promise<SuggestObjectiveOutput> {
  return suggestObjectiveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestObjectivePrompt',
  input: {schema: SuggestObjectiveInputSchema},
  output: {schema: SuggestObjectiveOutputSchema},
  prompt: `Analiza rápidamente esta creatividad publicitaria y sugiere el objetivo de campaña más apropiado.

OPCIONES (elige una):
- awareness: Reconocimiento de marca
- traffic: Tráfico web
- engagement: Interacción
- lead_generation: Generar leads
- app_installs: Descargas app
- conversion: Ventas/conversiones

IMAGEN: {{{creativeDataUri}}}
DEMOGRAFÍA: {{{demographics}}}

CRITERIOS:
- Tipo de producto/servicio
- Llamadas a la acción visibles
- Precios, ofertas, códigos QR
- Estilo visual

Responde SOLO con JSON:
{
  "suggestedObjective": "uno_de_los_valores_exactos",
  "confidence": número_0_100,
  "reasoning": "breve_explicación"
}`,
});

const suggestObjectiveFlow = ai.defineFlow(
  {
    name: 'suggestObjectiveFlow',
    inputSchema: SuggestObjectiveInputSchema,
    outputSchema: SuggestObjectiveOutputSchema,
  },
  async input => {
    try {
      console.log('suggestObjectiveFlow starting with input:', {
        hasCreativeDataUri: !!input.creativeDataUri,
        demographics: input.demographics?.substring(0, 50) + '...'
      });
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Campaign objective suggestion timeout')), 15000)
      );
      
      const promptPromise = prompt(input);
      
      const {output} = await Promise.race([promptPromise, timeoutPromise]) as any;
      
      console.log('suggestObjectiveFlow result:', output);
      
      if (!output) {
        throw new Error('No output received from AI model');
      }
      
      return output;
    } catch (error) {
      console.error('Error in suggestObjectiveFlow:', error);
      
      // Return a fallback suggestion if AI fails
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('Returning fallback objective due to timeout');
        return {
          suggestedObjective: 'engagement' as const,
          confidence: 50,
          reasoning: 'Sugerencia por defecto debido a timeout en el análisis de IA'
        };
      }
      
      throw error;
    }
  }
);