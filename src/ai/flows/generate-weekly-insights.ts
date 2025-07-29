// src/ai/flows/generate-weekly-insights.ts
'use server';

/**
 * @fileOverview Generates a personalized weekly summary and insights based on user's health data.
 *
 * - generateWeeklyInsights - A function that handles the weekly insights generation process.
 * - WeeklyInsightsInput - The input type for the function.
 * - WeeklyInsightsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for the data records that will be passed in
const GlucoseReadingSchema = z.object({
  value: z.number(),
  timestamp: z.string().datetime(),
  level: z.string(), // e.g., 'normal', 'baixa'
});

const InsulinLogSchema = z.object({
  dose: z.number(),
  timestamp: z.string().datetime(),
  type: z.string(),
});

const ActivityLogSchema = z.object({
  activity_type: z.string(),
  duration_minutes: z.number(),
  timestamp: z.string().datetime(),
});

const MealAnalysisSchema = z.object({
  foodIdentification: z.string(),
  macronutrientEstimates: z.object({
    carbohydrates: z.number(),
    protein: z.number(),
    fat: z.number(),
  }),
  timestamp: z.string().datetime(),
});

const MedicationLogSchema = z.object({
    medication_name: z.string(),
    dosage: z.string(),
    timestamp: z.string().datetime(),
});

const UserProfileSchema = z.object({
  name: z.string().optional(),
  hypo_glucose_threshold: z.number().optional(),
  target_glucose_low: z.number().optional(),
  target_glucose_high: z.number().optional(),
  hyper_glucose_threshold: z.number().optional(),
});

// The comprehensive input for the AI flow
export const WeeklyInsightsInputSchema = z.object({
  userProfile: UserProfileSchema,
  glucoseReadings: z.array(GlucoseReadingSchema),
  insulinLogs: z.array(InsulinLogSchema),
  activityLogs: z.array(ActivityLogSchema),
  mealAnalyses: z.array(MealAnalysisSchema),
  medicationLogs: z.array(MedicationLogSchema),
  language: z.string().optional().default('pt-BR'),
});
export type WeeklyInsightsInput = z.infer<typeof WeeklyInsightsInputSchema>;

// The desired structured output from the AI
export const WeeklyInsightsOutputSchema = z.object({
  weeklySummary: z.string().describe("A friendly, narrative summary of the user's week, mentioning key metrics like average glucose and time in range."),
  positiveObservations: z.array(z.string()).describe("A list of positive patterns or habits observed. E.g., good time in range, consistent logging, impact of exercise."),
  improvementPoints: z.array(z.string()).describe("A list of identified patterns that could be improved or discussed with a doctor. E.g., post-meal spikes, morning hypoglycemia."),
  actionableTip: z.string().describe("One clear, actionable, and personalized tip for the upcoming week based on the most significant observation."),
});
export type WeeklyInsightsOutput = z.infer<typeof WeeklyInsightsOutputSchema>;

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
