import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-ad-creatives.ts';
import '@/ai/flows/predict-performance-score.ts';
import '@/ai/flows/extract-demographics.ts';
