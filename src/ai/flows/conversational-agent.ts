
'use server';

/**
 * @fileOverview A conversational AI agent that answers questions based on user's health data.
 *
 * - conversationalAgent - The main flow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for the flow
const ConversationalAgentInputSchema = z.object({
    history: z.array(
        z.object({
            role: z.enum(['user', 'model']),
            content: z.array(z.object({ text: z.string() })),
        })
    ),
    userData: z.any().describe("A JSON object containing the user's health data."),
});


export async function conversationalAgent(input: z.infer<typeof ConversationalAgentInputSchema>): Promise<string> {
    // Find the last user message to pass to the prompt
    const lastUserMessage = input.history.find(m => m.role === 'user');
    const userQuestion = lastUserMessage ? lastUserMessage.content[0].text : '';

    const result = await conversationalAgentFlow({
        history: input.history,
        userData: JSON.stringify(input.userData, null, 2),
        userQuestion: userQuestion,
    });
    return result;
}


const ConversationalAgentFlowInputSchema = z.object({
    history: ConversationalAgentInputSchema.shape.history,
    userData: z.string(),
    userQuestion: z.string(),
});


const prompt = ai.definePrompt({
  name: 'conversationalAgentPrompt',
  input: { schema: ConversationalAgentFlowInputSchema },
  output: { format: 'text' },
  prompt: `Você é o "Assistente GlicemiaAI", um especialista em análise de dados de saúde. Sua função é responder a perguntas do usuário com base nos dados de saúde fornecidos, que incluem leituras de glicemia, registros de insulina, medicamentos, atividades físicas e análises de refeições.

REGRAS IMPORTANTES:
1.  **NÃO DÊ CONSELHOS MÉDICOS.** Nunca sugira mudanças de tratamento, dosagens ou diagnósticos. Em vez disso, diga frases como "Notei um padrão aqui, seria interessante discutir isso com seu médico" ou "Com base nos seus dados...". Sua função é analisar e apresentar os dados, não interpretar clinicamente.
2.  Responda exclusivamente com base nos dados fornecidos no contexto. Se a informação não estiver nos dados, diga que você não tem essa informação para o período solicitado (últimos 30 dias).
3.  Seja claro, conciso e amigável.
4.  Responda em português brasileiro.
5.  Entenda consultas sobre períodos de tempo (ex: "últimos 7 dias", "mês passado", "hoje"). A data atual para referência é ${new Date().toISOString()}.

Aqui está o histórico da conversa até o momento (ignore a primeira mensagem de boas-vindas se houver):
{{#each history}}
  **{{role}}**: {{content.[0].text}}
{{/each}}

Aqui estão TODOS os dados de saúde do usuário dos últimos 30 dias:
\`\`\`json
{{{userData}}}
\`\`\`

Com base em tudo isso, responda à última pergunta do usuário.

**Usuário**: {{{userQuestion}}}
`,
});

const conversationalAgentFlow = ai.defineFlow(
  {
    name: 'conversationalAgentFlow',
    inputSchema: ConversationalAgentFlowInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return llmResponse.text;
  }
);

