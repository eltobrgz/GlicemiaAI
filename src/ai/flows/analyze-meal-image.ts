
// src/ai/flows/analyze-meal-image.ts
'use server';

/**
 * @fileOverview Analyzes a photo of a meal to estimate macronutrients and potential blood glucose impact.
 *
 * - analyzeMealImage - A function that handles the meal image analysis process.
 */

import {ai} from '@/ai/genkit';
import type { AnalyzeMealImageInput, AnalyzeMealImageOutput } from '@/types';
import { AnalyzeMealImageInputSchema, AnalyzeMealImageOutputSchema } from '@/types/schemas';


export async function analyzeMealImage(input: AnalyzeMealImageInput): Promise<AnalyzeMealImageOutput> {
  return analyzeMealImageFlow(input);
}

const analyzeMealImagePrompt = ai.definePrompt({
  name: 'analyzeMealImagePrompt',
  input: {schema: AnalyzeMealImageInputSchema},
  output: {schema: AnalyzeMealImageOutputSchema},
  prompt: `You are a registered dietician that specializes in helping diabetics manage their blood sugar through diet.

Your response MUST be in the language specified by the 'language' input (e.g., 'en-US' for English, 'pt-BR' for Brazilian Portuguese). If the 'language' input is not provided, is empty, or is not a recognized language code, your response MUST be in Brazilian Portuguese (pt-BR).

User's preferred language for response: {{{language}}}

You will analyze an image of a meal and provide an estimate of the macronutrients (carbohydrates, protein, and fat) present in the meal. You will also provide an estimate of how the meal will impact the user's blood glucose levels, suggest an appropriate insulin dosage (if applicable), and offer tips for improving the meal composition.

Here is some context about the user (if provided): {{{userContext}}}

Analyze the following meal:

{{media url=mealPhotoDataUri}}
`,
});

const analyzeMealImageFlow = ai.defineFlow(
  {
    name: 'analyzeMealImageFlow',
    inputSchema: AnalyzeMealImageInputSchema,
    outputSchema: AnalyzeMealImageOutputSchema,
  },
  async (input) => {
    // Ensure language is explicitly passed, defaulting if necessary
    const languageToUse = input.language || 'pt-BR';
    const {output} = await analyzeMealImagePrompt({...input, language: languageToUse});
    return output!;
  }
);
