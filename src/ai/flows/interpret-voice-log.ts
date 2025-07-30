
'use server';
/**
 * @fileOverview An AI flow to interpret natural language text into a structured health log entry.
 *
 * - interpretVoiceLog - A function that handles the interpretation process.
 */
import {ai} from '@/ai/genkit';
import type { InterpretedLog } from '@/types';
import { InterpretedLogSchema, VoiceLogInputSchema } from '@/types/schemas';
import { z } from 'zod';


// The wrapper function to be called from the frontend
export async function interpretVoiceLog(input: z.infer<typeof VoiceLogInputSchema>): Promise<InterpretedLog> {
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

-   **CRITICAL RULE:** Always assume the timestamp for the log is the current time provided in the input. You MUST provide this timestamp in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) in the 'timestamp' field for all successful recognitions.
-   If the user mentions context or feelings (e.g., "...e me senti um pouco tonto"), include this in the 'notes' field for glucose readings.
-   If the text is ambiguous or does not clearly match any of the log types, return 'unrecognized' with a brief reason.
-   For insulin and activity, if the type is mentioned, use it. If not, try to infer it (e.g., 'corrida' for "corri por 20 minutos"). If it's still unclear, use a generic term like "Insulina" or "Atividade física".

User's spoken request: "{{{input}}}"
Current ISO Timestamp: "{{{now}}}"
`,
});

const interpretVoiceLogFlow = ai.defineFlow(
  {
    name: 'interpretVoiceLogFlow',
    inputSchema: VoiceLogInputSchema,
    outputSchema: InterpretedLogSchema,
  },
  async (input) => {
    const { output } = await prompt({
      input: input.input,
      now: new Date().toISOString()
    });
    if (!output) {
      return { logType: 'unrecognized', data: { reason: 'A IA não conseguiu interpretar o comando.' } };
    }
    return output;
  }
);
