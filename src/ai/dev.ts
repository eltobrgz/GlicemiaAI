import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-meal-image.ts';
import '@/ai/flows/interpret-voice-log.ts';
import '@/ai/flows/generate-weekly-insights.ts';
import '@/ai/flows/conversational-agent.ts';
import '@/ai/flows/text-to-speech.ts';
