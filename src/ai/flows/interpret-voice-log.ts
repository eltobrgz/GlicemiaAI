'use server';
/**
 * @fileOverview An AI flow to interpret natural language text into a structured health log entry.
 *
 * - interpretVoiceLog - A function that handles the interpretation process.
 * - InterpretedLog - The output type for the interpretVoiceLog function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define base schemas for each log type that can be extracted from voice
const GlucoseLogSchema = z.object({
  value: z.number().describe('The blood glucose value in mg/dL.'),
  notes: z.string().optional().describe('Any additional notes or context mentioned by the user.'),
});

const InsulinLogSchema = z.object({
  dose: z.number().describe('The dose of insulin in units.'),
  type: z.string().describe('The type or brand name of the insulin.'),
});

const MedicationLogSchema = z.object({
  medication_name: z.string().describe('The name of the medication.'),
  dosage: z.string().describe('The dosage of the medication (e.g., "500mg", "1 comprimido").'),
});

const ActivityLogSchema = z.object({
  activity_type: z.string().describe('The type of physical activity.'),
  duration_minutes: z.number().describe('The duration of the activity in minutes.'),
});

// Create a discriminated union for the output
const InterpretedLogSchema = z.discriminatedUnion('logType', [
  z.object({ logType: z.literal('glucose'), data: GlucoseLogSchema }),
  z.object({ logType: z.literal('insulin'), data: InsulinLogSchema }),
  z.object({ logType: z.literal('medication'), data: MedicationLogSchema }),
  z.object({ logType: z.literal('activity'), data: ActivityLogSchema }),
  z.object({ logType: z.literal('unrecognized'), data: z.object({ reason: z.string().describe('Reason why the input could not be interpreted.') }) }),
]);
export type InterpretedLog = z.infer<typeof InterpretedLogSchema>;

// The input is a simple string from the user's speech
const VoiceLogInputSchema = z.string();
export type VoiceLogInput = z.infer<typeof VoiceLogInputSchema>;

// The wrapper function to be called from the frontend
export async function interpretVoiceLog(input: VoiceLogInput): Promise<InterpretedLog> {
  return interpretVoiceLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretVoiceLogPrompt',
  input: { schema: VoiceLogInputSchema },
  output: { schema: InterpretedLogSchema },
  prompt: `You are an expert AI assistant for the GlicemiaAI app. Your task is to interpret a user's spoken request and structure it into a specific log entry. The user's request will be in Brazilian Portuguese.

Analyze the user's text and determine if they are logging one of the following:
1.  **Glucose Reading:** Look for a number and keywords like "glicemia", "glicose", "deu", "agora é". Example: "minha glicemia agora é 110".
2.  **Insulin Dose:** Look for a number and keywords like "unidades", "insulina", or common insulin names (e.g., "Lantus", "Novorapid", "Tresiba"). Example: "apliquei 10 unidades de Lantus".
3.  **Medication:** Look for medication names and dosages. Example: "tomei 500mg de metformina".
4.  **Physical Activity:** Look for an activity type and a duration in minutes or hours. Example: "fiz 30 minutos de caminhada".

-   Always assume the timestamp is the current time. Do not try to interpret time references like "yesterday".
-   If the user mentions context or feelings (e.g., "...e me senti um pouco tonto"), include this in the 'notes' field for glucose readings.
-   If the text is ambiguous or does not clearly match any of the log types, return 'unrecognized' with a brief reason.
-   For insulin and activity, if the type is mentioned, use it. If not, try to infer it (e.g., 'corrida' for "corri por 20 minutos"). If it's still unclear, use a generic term like "Insulina" or "Atividade física".

User's spoken request: "{{{input}}}"
`,
});

const interpretVoiceLogFlow = ai.defineFlow(
  {
    name: 'interpretVoiceLogFlow',
    inputSchema: VoiceLogInputSchema,
    outputSchema: InterpretedLogSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return { logType: 'unrecognized', data: { reason: 'A IA não conseguiu interpretar o comando.' } };
    }
    return output;
  }
);
