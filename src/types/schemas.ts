
// src/types/schemas.ts
import { z } from 'zod';

// Schema for analyzeMealImage flow
export const AnalyzeMealImageInputSchema = z.object({
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

export const AnalyzeMealImageOutputSchema = z.object({
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


// Schemas for generateWeeklyInsights flow
const WeeklyGlucoseReadingSchema = z.object({
  value: z.number(),
  timestamp: z.string(),
  level: z.string(), // e.g., 'normal', 'baixa'
});

const WeeklyInsulinLogSchema = z.object({
  dose: z.number(),
  timestamp: z.string(),
  type: z.string(),
});

const WeeklyActivityLogSchema = z.object({
  activity_type: z.string(),
  duration_minutes: z.number(),
  timestamp: z.string(),
});

const WeeklyMealAnalysisSchema = z.object({
  foodIdentification: z.string(),
  macronutrientEstimates: z.object({
    carbohydrates: z.number(),
    protein: z.number(),
    fat: z.number(),
  }),
  timestamp: z.string(),
});

const WeeklyMedicationLogSchema = z.object({
    medication_name: z.string(),
    dosage: z.string(),
    timestamp: z.string(),
});

const UserProfileSchema = z.object({
  name: z.string().optional(),
  hypo_glucose_threshold: z.number().optional(),
  target_glucose_low: z.number().optional(),
  target_glucose_high: z.number().optional(),
  hyper_glucose_threshold: z.number().optional(),
});

export const WeeklyInsightsInputSchema = z.object({
  userProfile: UserProfileSchema,
  glucoseReadings: z.array(WeeklyGlucoseReadingSchema),
  insulinLogs: z.array(WeeklyInsulinLogSchema),
  activityLogs: z.array(WeeklyActivityLogSchema),
  mealAnalyses: z.array(WeeklyMealAnalysisSchema),
  medicationLogs: z.array(WeeklyMedicationLogSchema),
  language: z.string().optional().default('pt-BR'),
});

export const WeeklyInsightsOutputSchema = z.object({
  weeklySummary: z.string().describe("A friendly, narrative summary of the user's week, mentioning key metrics like average glucose and time in range."),
  positiveObservations: z.array(z.string()).describe("A list of positive patterns or habits observed. E.g., good time in range, consistent logging, impact of exercise."),
  improvementPoints: z.array(z.string()).describe("A list of identified patterns that could be improved or discussed with a doctor. E.g., post-meal spikes, morning hypoglycemia."),
  actionableTip: z.string().describe("One clear, actionable, and personalized tip for the upcoming week based on the most significant observation."),
});


// Schemas for interpretVoiceLog flow
const VoiceGlucoseLogSchema = z.object({
  value: z.number().describe('The blood glucose value in mg/dL.'),
  notes: z.string().optional().describe('Any additional notes or context mentioned by the user.'),
  timestamp: z.string().describe('The ISO 8601 timestamp for when the log occurred.'),
});

const VoiceInsulinLogSchema = z.object({
  dose: z.number().describe('The dose of insulin in units.'),
  type: z.string().describe('The type or brand name of the insulin.'),
  timestamp: z.string().describe('The ISO 8601 timestamp for when the log occurred.'),
});

const VoiceMedicationLogSchema = z.object({
  medication_name: z.string().describe('The name of the medication.'),
  dosage: z.string().describe('The dosage of the medication (e.g., "500mg", "1 comprimido").'),
  timestamp: z.string().describe('The ISO 8601 timestamp for when the log occurred.'),
});

const VoiceActivityLogSchema = z.object({
  activity_type: z.string().describe('The type of physical activity.'),
  duration_minutes: z.number().describe('The duration of the activity in minutes.'),
  timestamp: z.string().describe('The ISO 8601 timestamp for when the log occurred.'),
});

export const InterpretedLogSchema = z.discriminatedUnion('logType', [
  z.object({ logType: z.literal('glucose'), data: VoiceGlucoseLogSchema }),
  z.object({ logType: z.literal('insulin'), data: VoiceInsulinLogSchema }),
  z.object({ logType: z.literal('medication'), data: VoiceMedicationLogSchema }),
  z.object({ logType: z.literal('activity'), data: VoiceActivityLogSchema }),
  z.object({ logType: z.literal('unrecognized'), data: z.object({ reason: z.string().describe('Reason why the input could not be interpreted.') }) }),
]);

export const VoiceLogInputSchema = z.object({
  input: z.string().describe("The user's transcribed voice command."),
});
