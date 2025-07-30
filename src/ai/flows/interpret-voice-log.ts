
'use server';
/**
 * @fileOverview An AI flow to interpret natural language text into a structured health log entry.
 *
 * - interpretVoiceLog - A function that handles the interpretation process.
 */
import {ai} from '@/ai/genkit';
import { z } from 'zod';

const VoiceLogInputSchema = z.object({
  input: z.string().describe("The user's transcribed voice command."),
  now: z.string().describe('The current ISO timestamp to be used for the log entry.'),
});

// A Zod schema representing ALL possible fields that the AI can extract.
// This makes the AI's job simpler: just fill in what you find.
const InterpretedLogOutputSchema = z.object({
    logType: z.enum(['glucose', 'insulin', 'medication', 'activity', 'unrecognized']).describe("The type of log entry identified."),
    value: z.number().nullable().describe('The blood glucose value in mg/dL, if applicable.'),
    dose: z.number().nullable().describe('The dose of insulin in units, if applicable.'),
    insulinType: z.string().nullable().describe('The type or brand name of the insulin, if applicable.'),
    medicationName: z.string().nullable().describe('The name of the medication, if applicable.'),
    dosage: z.string().nullable().describe('The dosage of the medication (e.g., "500mg"), if applicable.'),
    activityType: z.string().nullable().describe('The type of physical activity, if applicable.'),
    durationMinutes: z.number().nullable().describe('The duration of the activity in minutes, if applicable.'),
    notes: z.string().nullable().describe('Any additional notes or context mentioned by the user.'),
    timestamp: z.string().describe('The ISO 8601 timestamp for when the log occurred.'),
    unrecognizedReason: z.string().nullable().describe('If the log type is unrecognized, the reason why.'),
});

export async function interpretVoiceLog(input: z.infer<typeof VoiceLogInputSchema>): Promise<z.infer<typeof InterpretedLogOutputSchema>> {
  return interpretVoiceLogFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretVoiceLogPrompt',
  input: { schema: VoiceLogInputSchema },
  output: { schema: InterpretedLogOutputSchema },
  prompt: `You are an expert AI assistant for the GlicemiaAI app. Your task is to interpret a user's spoken request (in Brazilian Portuguese) and extract information into a JSON object based on the provided schema.

Context:
- User's spoken request: "{{{input}}}"
- Current ISO Timestamp: "{{{now}}}"

Your Task:
1.  Analyze the user's request to determine the 'logType'. It MUST be one of: 'glucose', 'insulin', 'medication', 'activity'.
2.  If the request is unclear or doesn't fit any category, set 'logType' to 'unrecognized' and provide a brief reason in 'unrecognizedReason'.
3.  Extract all relevant details from the request and populate the corresponding fields in the JSON output.
4.  Fields that are not relevant to the identified 'logType' MUST be set to 'null'.
5.  **CRITICAL:** The 'timestamp' field MUST always be populated with the "Current ISO Timestamp" provided above.

Examples:
- Input: "minha glicemia agora é 110" -> Extracts { logType: 'glucose', value: 110, timestamp: '...', ...other fields are null }
- Input: "apliquei 10 unidades de Lantus" -> Extracts { logType: 'insulin', dose: 10, insulinType: 'Lantus', timestamp: '...', ...other fields are null }
- Input: "fiz 30 minutos de caminhada" -> Extracts { logType: 'activity', activityType: 'caminhada', durationMinutes: 30, timestamp: '...', ...other fields are null }
- Input: "tomei 500mg de metformina" -> Extracts { logType: 'medication', medicationName: 'metformina', dosage: '500mg', timestamp: '...', ...other fields are null }
- Input: "hoje o dia está bonito" -> Extracts { logType: 'unrecognized', unrecognizedReason: 'The user is not logging any health data.', ...other fields are null }

Return ONLY the JSON object.
`,
});

const interpretVoiceLogFlow = ai.defineFlow(
  {
    name: 'interpretVoiceLogFlow',
    inputSchema: VoiceLogInputSchema,
    outputSchema: InterpretedLogOutputSchema,
  },
  async (input) => { 
    try {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error('AI returned no output.');
        }
        return output;
    } catch (e: any) {
        console.error("Failed to process voice log with AI:", e);
        console.error("Input that caused error:", input.input);
        return {
            logType: 'unrecognized',
            unrecognizedReason: 'A IA falhou ao processar a sua solicitação. Por favor, tente novamente.',
            value: null,
            dose: null,
            insulinType: null,
            medicationName: null,
            dosage: null,
            activityType: null,
            durationMinutes: null,
            notes: null,
            timestamp: input.now,
        };
    }
  }
);
