# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
# GlicemiaAI

## Configuração Adicional para Funcionalidades de IA (Análise de Refeição)

Para utilizar a funcionalidade de análise de refeição por Inteligência Artificial, você precisará de uma chave de API do Google Gemini.

1.  **Obtenha uma Chave de API:**
    *   Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Crie ou selecione um projeto e gere uma nova chave de API.

2.  **Configure a Variável de Ambiente:**
    *   No seu arquivo `.env.local` (crie um se não existir, na raiz do projeto), adicione a seguinte linha, substituindo `SUA_GEMINI_API_KEY_AQUI` pela chave que você obteve:
        ```env
        GEMINI_API_KEY=SUA_GEMINI_API_KEY_AQUI
        ```
    *   **Importante:** Este arquivo `.env.local` também deve conter suas chaves do Supabase (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Certifique-se de que TODAS as três variáveis estão presentes no seu `.env.local`.

3.  **Reinicie o Servidor:**
    *   Após adicionar TODAS as chaves necessárias ao `.env.local`, pare e reinicie o servidor de desenvolvimento Next.js.

Sem a `GEMINI_API_KEY`, as chamadas para a IA de análise de refeição resultarão em erro de `FAILED_PRECONDITION` ou similar, indicando a ausência da chave de API.
Sem as chaves `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`, a aplicação não conseguirá se conectar ao Supabase e exibirá erros relacionados.
