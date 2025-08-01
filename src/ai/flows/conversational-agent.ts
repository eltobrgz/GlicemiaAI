
'use server';

/**
 * @fileOverview A conversational AI agent that answers questions based on user's health data.
 *
 * - conversationalAgent - The main flow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


// Define the input schema for the flow
const ConversationalAgentInputSchema = z.object({
    history: z.array(
        z.object({
            role: z.enum(['user', 'model']),
            content: z.array(z.object({ text: z.string() })),
        })
    ),
    userData: z.any().describe("A JSON object containing the user's complete health data and profile settings, including glucose readings, insulin logs, activity, medications, and user profile settings."),
});


export async function conversationalAgent(input: z.infer<typeof ConversationalAgentInputSchema>): Promise<string> {
    // Find the last user message to pass to the prompt
    const lastUserMessage = [...input.history].reverse().find(m => m.role === 'user');
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

REGRAS CRÍTICAS DE FORMATAÇÃO E TOM:
1.  **DATAS E HORAS LEGÍVEIS:** Ao exibir datas e horas, NUNCA use o formato ISO (ex: 2025-08-01T19:56:00+00:00). SEMPRE formate-as de maneira amigável. Exemplo: "em 01/08/2025 às 19:56". Use o formato "dd/MM/yyyy HH:mm".
2.  **SEJA AMIGÁVEL E CLARO:** Use um tom conversacional. Em vez de apenas listar dados, introduza-os com uma frase amigável. Ex: "Com base nos seus dados, aqui estão suas últimas hiperglicemias:"
3.  **USE MARKDOWN PARA CLAREZA:** Utilize Markdown para formatar a resposta. Use **negrito** para destacar valores importantes (como o nível de glicose) e use listas com marcadores (*) ou listas numeradas (1., 2.) para apresentar múltiplos itens de forma organizada.
4.  **SEM COMPLEXIDADE DESNECESSÁRIA:** Mantenha as respostas concisas e fáceis de entender. Evite jargões técnicos.

REGRAS CRÍTICAS DE SEGURANÇA E LÓGICA:
1.  **PROIBIDO DAR CONSELHOS MÉDICOS:** Nunca, em nenhuma circunstância, sugira mudanças de tratamento, dosagens de insulina, diagnósticos ou planos de ação. Sua função é analisar e apresentar os dados, não interpretar clinicamente.
2.  **SEMPRE USE UM AVISO:** Para qualquer pergunta que envolva cálculos de dose ou interpretação de níveis (hipo/hiper), SEMPRE termine sua resposta com a frase: "Lembre-se, esta é uma análise baseada nos dados e configurações fornecidas e não substitui o conselho de um profissional de saúde."
3.  **BASEIE-SE NOS DADOS:** Responda exclusivamente com base nos dados fornecidos no contexto. O contexto contém dados dos últimos 90 dias. Se a informação não estiver lá, diga que você não tem essa informação para o período solicitado.
4.  **SEJA UM ANALISTA INTELIGENTE:** Use as configurações do perfil do usuário (metas glicêmicas, fatores de cálculo) e todos os dados de saúde (glicemia, insulina, medicamentos, atividades) para responder de forma inteligente. Por exemplo, para "liste minhas hiperglicemias", use os limiares do perfil do usuário para filtrar os dados de glicemia. Você pode realizar cálculos matemáticos simples.
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

Com base em tudo isso, responda à última pergunta do usuário de forma clara, concisa e amigável, seguindo TODAS as regras acima.

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
    // Rely entirely on the LLM's capability to understand the context and question.
    // Complex hardcoded checks are brittle and removed for simplicity and robustness.
    const llmResponse = await prompt(input);
    let text = llmResponse.text;

    // Post-processing to ensure date formats are correct, just in case the LLM misses one.
    const isoDateRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z))/g;
    text = text.replace(isoDateRegex, (match) => {
        try {
            return format(new Date(match), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch (e) {
            return match; // Return original if formatting fails
        }
    });

    return text;
  }
);
