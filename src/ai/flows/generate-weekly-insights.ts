// src/ai/flows/generate-weekly-insights.ts
'use server';

/**
 * @fileOverview Generates a personalized weekly summary and insights based on user's health data.
 *
 * - generateWeeklyInsights - A function that handles the weekly insights generation process.
 */

import {ai} from '@/ai/genkit';
import type { WeeklyInsightsInput, WeeklyInsightsOutput } from '@/types';
import { WeeklyInsightsInputSchema, WeeklyInsightsOutputSchema } from '@/types/schemas';


// The exported function to be called from the frontend
export async function generateWeeklyInsights(input: WeeklyInsightsInput): Promise<WeeklyInsightsOutput> {
  return generateWeeklyInsightsFlow(input);
}

const generateWeeklyInsightsPrompt = ai.definePrompt({
  name: 'generateWeeklyInsightsPrompt',
  input: {schema: WeeklyInsightsInputSchema},
  output: {schema: WeeklyInsightsOutputSchema},
  prompt: `You are an empathetic and intelligent AI health assistant for the GlicemiaAI app, specializing in diabetes management. Your role is to analyze a user's health data from the last 14 days and generate a supportive and insightful summary for their most recent week.

Your response MUST be in the language specified by the 'language' input (defaults to pt-BR).

**Your Task:**
Analyze the provided JSON data which includes the user's profile (with their personalized glucose targets), glucose readings, insulin logs, medication logs, activities, and meal analyses.
Based on this data, generate a personalized report covering the last 7 days.

**Analysis Guidelines:**
1.  **Weekly Summary:** Start with a friendly, narrative summary. Mention the average glucose, time-in-range percentage, and compare the average glucose to the previous week (days 8-14) to identify a trend (stable, increasing, decreasing).
2.  **Identify Patterns (Be a Detective):**
    *   Look for correlations: Does exercise on a certain day lead to better glucose levels? Do meals high in carbohydrates consistently cause spikes?
    *   Look for time-based patterns: Are hypos or hypers frequent in the morning? Or after dinner?
    *   Acknowledge logged data: Mention their logged activities or meals as part of the analysis.
3.  **Formulate Insights:**
    *   **Positive Observations:** Create a list of 2-3 encouraging observations. Focus on what the user is doing well. Examples: "Your glucose levels after your registered walks were consistently in range." or "Great job logging your data consistently this week!".
    *   **Improvement Points:** Create a list of 1-2 key patterns that might warrant attention. Frame these gently and always advise consulting a healthcare professional. Examples: "It seems there's a pattern of glucose spikes after breakfast. This could be a good topic to discuss with your doctor or nutritionist." or "We noticed a couple of instances of hypoglycemia late at night."
    *   **Actionable Tip:** Provide one single, highly relevant tip for the next week. It should be directly related to the most significant pattern you found.

**Important Rules:**
-   **DO NOT provide medical advice.** Always frame suggestions as points of observation to be discussed with a doctor or nutritionist. Use phrases like "It might be helpful to observe...", "This could be a topic for your next doctor's appointment.", "You might want to pay attention to...".
-   Be empathetic, supportive, and non-judgmental.
-   Keep the language clear and easy to understand.
-   Base your entire analysis STRICTLY on the data provided. Do not invent information.

**Input Data:**
\`\`\`json
{{{jsonStringify .}}}
\`\`\`
`,
});

const generateWeeklyInsightsFlow = ai.defineFlow(
  {
    name: 'generateWeeklyInsightsFlow',
    inputSchema: WeeklyInsightsInputSchema,
    outputSchema: WeeklyInsightsOutputSchema,
  },
  async (input) => {
    // Check if there is enough data to proceed
    if (input.glucoseReadings.length < 3) {
        return {
            weeklySummary: "Não há dados de glicemia suficientes para gerar uma análise completa. Continue registrando seus níveis para receber insights na próxima semana.",
            positiveObservations: [],
            improvementPoints: [],
            actionableTip: "O primeiro passo é o mais importante! Tente registrar sua glicemia pelo menos uma vez por dia nesta semana."
        };
    }
    const {output} = await generateWeeklyInsightsPrompt(input);
    return output!;
  }
);
