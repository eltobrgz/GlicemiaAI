
'use server';
/**
 * @fileOverview A conversational AI agent that can answer questions about a user's health data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  getMostRecentGlucoseReading,
  getGlucoseReadingsInRange,
  countReadingsByLevel,
  findExtremeGlucoseReading,
  getMostRecentInsulinLog,
  getMostRecentActivityLog,
  getMostRecentMedicationLog,
} from '@/lib/data-tools';

// Define tools that the AI can use to answer questions
const tools = {
  getMostRecentGlucoseReading: ai.defineTool(
    {
      name: 'getMostRecentGlucoseReading',
      description: 'Get the most recent blood glucose reading for the user.',
      input: z.object({}),
      output: z.object({
        value: z.number(),
        timestamp: z.string(),
        level: z.string(),
      }).nullable(),
    },
    async () => await getMostRecentGlucoseReading()
  ),
  getGlucoseReadingsInRange: ai.defineTool(
    {
      name: 'getGlucoseReadingsInRange',
      description: 'Get all blood glucose readings for the user within a specified date range.',
      input: z.object({
        startDate: z.string().describe('The start date of the range in ISO format.'),
        endDate: z.string().describe('The end date of the range in ISO format.'),
      }),
      output: z.array(z.object({
        value: z.number(),
        timestamp: z.string(),
        level: z.string(),
      })),
    },
    async ({ startDate, endDate }) => await getGlucoseReadingsInRange({ startDate, endDate })
  ),
  countReadingsByLevel: ai.defineTool(
      {
          name: 'countReadingsByLevel',
          description: 'Count the number of glucose readings for each level (low, normal, high, very high) in a given period.',
           input: z.object({
                days: z.number().describe('The number of past days to analyze (e.g., 7 for the last week).'),
           }),
          output: z.object({
                low: z.number(),
                normal: z.number(),
                high: z.number(),
                veryHigh: z.number(),
          }),
      },
      async ({ days }) => await countReadingsByLevel({ days })
  ),
  findExtremeGlucoseReading: ai.defineTool(
    {
        name: 'findExtremeGlucoseReading',
        description: 'Find the highest (max) or lowest (min) glucose reading within a specified date range.',
        input: z.object({
            startDate: z.string().describe('The start date of the range in ISO format.'),
            endDate: z.string().describe('The end date of the range in ISO format.'),
            type: z.enum(['max', 'min']).describe('The type of extreme to find: "max" for highest, "min" for lowest.'),
        }),
        output: z.object({
            value: z.number(),
            timestamp: z.string(),
        }).nullable(),
    },
    async ({ startDate, endDate, type }) => await findExtremeGlucoseReading({ startDate, endDate, type })
  ),
  getMostRecentInsulinLog: ai.defineTool({
    name: 'getMostRecentInsulinLog',
    description: "Get the user's most recent insulin application log.",
    input: z.object({}),
    output: z.object({
        type: z.string(),
        dose: z.number(),
        timestamp: z.string(),
    }).nullable(),
  }, async () => await getMostRecentInsulinLog()),
  getMostRecentActivityLog: ai.defineTool({
      name: 'getMostRecentActivityLog',
      description: "Get the user's most recent physical activity log.",
      input: z.object({}),
      output: z.object({
          activity_type: z.string(),
          duration_minutes: z.number(),
          timestamp: z.string(),
      }).nullable(),
  }, async () => await getMostRecentActivityLog()),
  getMostRecentMedicationLog: ai.defineTool({
      name: 'getMostRecentMedicationLog',
      description: "Get the user's most recent non-insulin medication log.",
      input: z.object({}),
      output: z.object({
          medication_name: z.string(),
          dosage: z.string(),
          timestamp: z.string(),
      }).nullable(),
  }, async () => await getMostRecentMedicationLog()),
};

const chatHistorySchema = z.array(
  z.object({
    role: z.string(),
    content: z.array(z.object({ text: z.string() })),
  })
);

const chatPrompt = ai.definePrompt({
  name: 'conversationalAgentPrompt',
  system: `You are GlicemiaAI, a friendly and helpful AI assistant for diabetes management.
- Your responses MUST be in Brazilian Portuguese (pt-BR).
- Use the provided tools to answer questions about the user's health data.
- If you don't have a tool to answer a question, say that you cannot answer it and explain why if possible (e.g., "Não consigo calcular médias, apenas buscar dados."). Do not invent answers or tools.
- Do not provide medical advice. Always advise the user to consult with their doctor for medical decisions.
- Keep your answers concise and easy to understand.
- When you use a tool and it returns data, present it to the user in a clear, friendly way. For dates, use relative terms like "hoje", "ontem", ou "dd/MM" when possible.
- If a tool returns no data, inform the user in a gentle way (e.g., "Não encontrei registros de...").
- You can also answer general knowledge questions about diabetes, health, and nutrition in a helpful, educational way.
- For questions about periods like "this month" or "last month", you must calculate the correct start and end dates to use with the tools. Today's date is ${new Date().toISOString()}.`,
  tools: Object.values(tools),
  input: {
    schema: chatHistorySchema,
  },
});

export async function conversationalAgent(history: z.infer<typeof chatHistorySchema>) {
    console.log("HISTORY", history);
    const response = await chatPrompt(history);
    return response.content;
}
