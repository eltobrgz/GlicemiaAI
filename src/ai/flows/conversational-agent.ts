'use server';

/**
 * @fileOverview A conversational AI agent that answers questions based on user's health data.
 *
 * - conversationalAgent - The main flow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAllUserDataForAI } from '@/lib/storage'; // We'll need to create this function
import type { User } from '@supabase/supabase-js';

// Define the input schema for the flow
const ConversationalAgentInputSchema = z.array(
    z.object({
        role: z.enum(['user', 'model']),
        content: z.array(z.object({ text: z.string() })),
    })
);

export async function conversationalAgent(history: z.infer<typeof ConversationalAgentInputSchema>): Promise<string> {
  const allUserData = await getAllUserDataForAI();
  
  const result = await conversationalAgentFlow({
      history,
      userData: allUserData,
  });
  return result;
}


const ConversationalAgentFlowInputSchema = z.object({
    history: ConversationalAgentInputSchema,
    userData: z.any(),
});


const prompt = ai.definePrompt({
  name: 'conversationalAgentPrompt',
  input: { schema: ConversationalAgentFlowInputSchema },
  output: { format: 'text' },
  prompt: `Você é o "Assistente GlicemiaAI", um especialista em análise de dados de saúde. Sua função é responder a perguntas do usuário com base nos dados de saúde fornecidos, que incluem leituras de glicemia, registros de insulina, medicamentos, atividades físicas e análises de refeições.

REGRAS IMPORTANTES:
1.  **NÃO DÊ CONSELHOS MÉDICOS.** Nunca sugira mudanças de tratamento, dosagens ou diagnósticos. Em vez disso, diga frases como "Notei um padrão aqui, seria interessante discutir isso com seu médico" ou "Com base nos seus dados...". Sua função é analisar e apresentar os dados, não interpretar clinicamente.
2.  Responda exclusivamente com base nos dados fornecidos no contexto. Se a informação não estiver nos dados, diga que você não tem essa informação.
3.  Seja claro, conciso e amigável.
4.  Responda em português brasileiro.
5.  Entenda consultas sobre períodos de tempo (ex: "últimos 7 dias", "mês passado", "hoje"). A data atual para referência é ${new Date().toISOString()}.

Aqui está o histórico da conversa até o momento:
{{#each history}}
  **{{role}}**: {{content.[0].text}}
{{/each}}

Aqui estão TODOS os dados de saúde do usuário:
\`\`\`json
{{{jsonStringify userData}}}
\`\`\`

Com base em tudo isso, responda à última pergunta do usuário.

**Usuário**: {{history.[history.length-1].content.[0].text}}
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
