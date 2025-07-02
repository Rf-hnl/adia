'use server';

import { analyzeAdCreatives, type AnalyzeAdCreativesInput } from '@/ai/flows/analyze-ad-creatives';
import { extractDemographics, type ExtractDemographicsInput } from '@/ai/flows/extract-demographics';
import { suggestCampaignObjective, type SuggestObjectiveInput } from '@/ai/flows/suggest-campaign-objective';

export async function getAdAnalysis(input: AnalyzeAdCreativesInput) {
  try {
    const result = await analyzeAdCreatives(input);
    return { success: true, data: result };
  } catch (e) {
    console.error('Error in getAdAnalysis:', e);
    const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido durante el análisis.';
    return { success: false, error: errorMessage };
  }
}

export async function getDemographicsFromCreative(input: ExtractDemographicsInput) {
  try {
    const result = await extractDemographics(input);
    return { success: true, data: result };
  } catch (e) {
    console.error('Error in getDemographicsFromCreative:', e);
    const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido durante la extracción.';
    return { success: false, error: errorMessage };
  }
}

export async function getCampaignObjectiveSuggestion(input: SuggestObjectiveInput) {
  try {
    console.log('getCampaignObjectiveSuggestion input:', {
      hasCreativeDataUri: !!input.creativeDataUri,
      creativeDataUriLength: input.creativeDataUri?.length,
      demographics: input.demographics,
    });
    
    const result = await suggestCampaignObjective(input);
    console.log('getCampaignObjectiveSuggestion result:', result);
    
    return { success: true, data: result };
  } catch (e) {
    console.error('Error in getCampaignObjectiveSuggestion:', e);
    const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido durante la sugerencia de objetivo.';
    return { success: false, error: errorMessage };
  }
}
