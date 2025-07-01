'use server';
/**
 * @fileOverview Extrae la demografía del público objetivo a partir de una creatividad de anuncio.
 *
 * - extractDemographics - Analiza una imagen de anuncio para inferir y describir el público objetivo.
 * - ExtractDemographicsInput - El tipo de entrada para la función extractDemographics.
 * - ExtractDemographicsOutput - El tipo de retorno para la función extractDemographics.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDemographicsInputSchema = z.object({
  creativeDataUri: z
    .string()
    .describe(
      "La creatividad del anuncio (imagen) como un URI de datos que debe incluir un tipo MIME y usar codificación Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractDemographicsInput = z.infer<
  typeof ExtractDemographicsInputSchema
>;

const ExtractDemographicsOutputSchema = z.object({
  demographics: z
    .string()
    .describe(
      'Una descripción detallada de la demografía del público objetivo inferida de la imagen, como "Hombres y mujeres de 25 a 40 años, interesados en el fitness y un estilo de vida saludable."'
    ),
});
export type ExtractDemographicsOutput = z.infer<
  typeof ExtractDemographicsOutputSchema
>;

export async function extractDemographics(
  input: ExtractDemographicsInput
): Promise<ExtractDemographicsOutput> {
  return extractDemographicsFlow(input);
}

const extractDemographicsPrompt = ai.definePrompt({
  name: 'extractDemographicsPrompt',
  input: {schema: ExtractDemographicsInputSchema},
  output: {schema: ExtractDemographicsOutputSchema},
  prompt: `Eres un estratega de marketing experto. Tu tarea es analizar la siguiente creatividad de anuncio y describir el público objetivo más probable en una sola frase. Responde SIEMPRE en español.

Basándote en los elementos visuales, el estilo, los productos mostrados y el ambiente general de la imagen, infiere y resume la demografía del público objetivo.

**Ejemplo de respuesta:** "Hombres y mujeres de 25 a 40 años, residentes urbanos, interesados en la tecnología y el diseño minimalista."

**Creatividad del anuncio:**
{{media url=creativeDataUri}}
`,
});

const extractDemographicsFlow = ai.defineFlow(
  {
    name: 'extractDemographicsFlow',
    inputSchema: ExtractDemographicsInputSchema,
    outputSchema: ExtractDemographicsOutputSchema,
  },
  async (input) => {
    const {output} = await extractDemographicsPrompt(input);
    return output!;
  }
);
