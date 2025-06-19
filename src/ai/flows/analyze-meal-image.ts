
// src/ai/flows/analyze-meal-image.ts
'use server';

/**
 * @fileOverview Analyzes a photo of a meal to estimate macronutrients and potential blood glucose impact.
 *
 * - analyzeMealImage - A function that handles the meal image analysis process.
 * - AnalyzeMealImageInput - The input type for the analyzeMealImage function.
 * - AnalyzeMealImageOutput - The return type for the analyzeMealImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMealImageInputSchema = z.object({
  mealPhotoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userContext: z
    .string()
    .optional()
    .describe('Additional context about the user, such as their current blood glucose level, insulin sensitivity, and dietary preferences.'),
  language: z
    .string()
    .optional()
    .default('pt-BR')
    .describe('The preferred language for the AI response (e.g., "pt-BR", "en-US"). Defaults to "pt-BR" if not provided.'),
});
export type AnalyzeMealImageInput = z.infer<typeof AnalyzeMealImageInputSchema>;

const AnalyzeMealImageOutputSchema = z.object({
  foodIdentification: z.string().describe('A description of the food items in the meal.'),
  macronutrientEstimates: z
    .object({
      carbohydrates: z.number().describe('Estimated grams of carbohydrates in the meal.'),
      protein: z.number().describe('Estimated grams of protein in the meal.'),
      fat: z.number().describe('Estimated grams of fat in the meal.'),
    })
    .describe('Estimates of the macronutrient content of the meal.'),
  estimatedGlucoseImpact: z
    .string()
    .describe('An estimation of how this meal will impact the users blood glucose levels.'),
  suggestedInsulinDose: z
    .string()
    .describe(
      'Suggested insulin dose to be taken with the meal, taking into consideration user context if provided.'
    ),
  improvementTips: z.string().describe('Suggestions for improving the meal composition.'),
});
export type AnalyzeMealImageOutput = z.infer<typeof AnalyzeMealImageOutputSchema>;

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
