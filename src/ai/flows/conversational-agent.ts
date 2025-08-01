
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
    userData: z.any().describe("A JSON object containing the user's health data and profile settings."),
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
  prompt: `Você é o "Assistente GlicemiaAI", um especialista em análise de dados de saúde. Sua função é responder a perguntas do usuário com base nos dados de saúde e configurações de perfil fornecidos.

REGRAS CRÍTICAS:
1.  **PROIBIDO DAR CONSELHOS MÉDICOS:** Nunca, em nenhuma circunstância, sugira mudanças de tratamento, dosagens de insulina, diagnósticos ou planos de ação. Sua função é analisar e apresentar os dados, não interpretar clinicamente.
2.  **SEMPRE USE UM AVISO:** Para qualquer pergunta que envolva cálculos de dose ou interpretação de níveis (hipo/hiper), SEMPRE termine sua resposta com a frase: "Lembre-se, esta é uma análise baseada nos dados e configurações fornecidas e não substitui o conselho de um profissional de saúde."
3.  **BASEIE-SE NOS DADOS:** Responda exclusivamente com base nos dados fornecidos no contexto. O contexto contém dados dos últimos 90 dias. Se a informação não estiver lá, diga que você não tem essa informação para o período solicitado.
4.  **SEJA UM ANALISTA INTELIGENTE:** Use as configurações do perfil do usuário (metas glicêmicas, fatores de cálculo) para responder de forma inteligente. Por exemplo, para "liste minhas hiperglicemias", use os limiares do perfil do usuário para filtrar os dados. Você pode realizar cálculos matemáticos simples.
5.  **IDIOMA:** Responda em português brasileiro.
6.  **DATA DE REFERÊNCIA:** A data atual para referência é ${new Date().toISOString()}.

Aqui está o histórico da conversa até o momento (ignore a primeira mensagem de boas-vindas se houver):
{{#each history}}
  **{{role}}**: {{content.[0].text}}
{{/each}}

Aqui estão TODOS os dados de saúde do usuário (últimos 90 dias) e suas configurações de perfil:
\`\`\`json
{{{userData}}}
\`\`\`

Com base em tudo isso, responda à última pergunta do usuário de forma clara, concisa e amigável.

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
