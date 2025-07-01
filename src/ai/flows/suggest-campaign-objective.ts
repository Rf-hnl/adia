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
  prompt: `Eres un especialista en marketing digital experto en análisis de creatividades publicitarias.

Analiza la imagen de la creatividad del anuncio y sugiere el objetivo de campaña más apropiado de las siguientes opciones:
- awareness: Para aumentar el reconocimiento de marca
- traffic: Para dirigir tráfico al sitio web
- engagement: Para aumentar la interacción con el contenido
- lead_generation: Para generar leads o suscripciones
- app_installs: Para promover descargas de aplicaciones
- conversion: Para generar ventas o conversiones directas

Imagen de la creatividad: {{{creativeDataUri}}}
Demografía del público (si está disponible): {{{demographics}}}

Consideraciones para el análisis:
- El tipo de producto o servicio mostrado
- El lenguaje visual y llamadas a la acción
- La presencia de elementos como códigos QR, URLs, precios, ofertas
- El estilo visual (corporativo, creativo, promocional)
- Los elementos de marca y posicionamiento

Proporciona una sugerencia clara con alta confianza y una explicación detallada del razonamiento.`,
});

const suggestObjectiveFlow = ai.defineFlow(
  {
    name: 'suggestObjectiveFlow',
    inputSchema: SuggestObjectiveInputSchema,
    outputSchema: SuggestObjectiveOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);