# Guia de Configuração do Supabase para o Projeto GlicemiaAI

Este guia detalha os passos para configurar seu projeto no Supabase e conectá-lo à sua aplicação Next.js GlicemiaAI.

## Passo 1: Criar um Projeto no Supabase

1.  Vá para [supabase.com](https://supabase.com) e crie uma conta ou faça login.
2.  No painel, clique em "**New project**".
3.  Escolha uma organização (ou crie uma nova).
4.  Preencha os seguintes campos:
    *   **Project name**: Ex: `GlicemiaAI`
    *   **Database Password**: Crie uma senha forte e segura. Guarde-a bem, você precisará dela se precisar acessar o banco diretamente.
    *   **Region**: Escolha a região mais próxima dos seus usuários.
    *   **Pricing Plan**: O plano "Free" é suficiente para começar e para desenvolvimento.
5.  Clique em "**Create new project**". Aguarde alguns minutos enquanto seu projeto é provisionado.

## Passo 2: Obter as Chaves da API do Supabase

Após a criação do projeto, você será redirecionado para o painel do projeto.

1.  No menu lateral esquerdo, vá para **Project Settings** (ícone de engrenagem).
2.  Selecione a aba **API**.
3.  Você precisará de duas informações desta página:
    *   **Project URL**: Encontrada na seção "Configuration" -> "URL". **Este é o valor para `NEXT_PUBLIC_SUPABASE_URL`**.
    *   **Project API Keys** -> `anon` `public`: Encontrada na seção "Project API Keys" -> "Default API Keys". **Use a chave `anon public`**. Não use a `service_role` key no frontend. **Este é o valor para `NEXT_PUBLIC_SUPABASE_ANON_KEY`**.

Copie esses dois valores. Certifique-se de que o Project URL é o correto (ex: `https://SEU_ID_DE_PROJETO.supabase.co`).

## Passo 3: Configurar Variáveis de Ambiente no Projeto Next.js

1.  No seu projeto Next.js (GlicemiaAI), crie um arquivo chamado `.env.local` na raiz do projeto, se ainda não existir. É no mesmo nível que `package.json`.
2.  Adicione as chaves que você copiou do Supabase a este arquivo, da seguinte forma:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=SUA_PROJECT_URL_AQUI
    NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_PUBLIC_KEY_AQUI
    ```

    Substitua `SUA_PROJECT_URL_AQUI` e `SUA_ANON_PUBLIC_KEY_AQUI` pelos valores reais que você copiou.
    **Importante**: O prefixo `NEXT_PUBLIC_` é necessário para que essas variáveis sejam expostas ao navegador.
    **Lembre-se**: Se você também for usar a funcionalidade de IA, precisará adicionar a `GEMINI_API_KEY` a este arquivo (veja o `README.md`).

## Passo 4: Configurar o Banco de Dados (Tabelas e RLS)

Para configurar as tabelas e as políticas de segurança (RLS) no seu banco de dados Supabase, você usará o script SQL `supabase_schema_create.sql`.

1.  **Localize o Script SQL:** No seu projeto, você encontrará o arquivo `docs/supabase/supabase_schema_create.sql`.
2.  **Execute o Script no SQL Editor do Supabase:**
    *   No painel do seu projeto Supabase, vá para o **SQL Editor** (ícone de banco de dados com "SQL").
    *   Clique em "**New query**".
    *   Abra o arquivo `supabase_schema_create.sql` no seu editor de código.
    *   Copie todo o conteúdo do script.
    *   Cole o script no SQL Editor do Supabase.
    *   Clique em "**RUN**".
    *   Este script criará todas as tabelas, suas colunas, RLS e a trigger `handle_new_user`.

## Passo 5: Configurar o Supabase Storage (Buckets e Políticas)

Precisamos criar buckets para armazenar as fotos de perfil e as fotos das refeições. Siga as instruções detalhadas no arquivo `docs/supabase/SUPABASE_SETUP_GUIDE.md` original ou no seu projeto para criar os buckets `profile-pictures` e `meal-photos` e configurar suas respectivas políticas de acesso (RLS). Esta etapa é crucial para que o upload e a exibição de imagens funcionem.

## Passo 6: Configurações de Autenticação no Supabase

1.  No painel do seu projeto Supabase, vá para **Authentication** (ícone de escudo).
2.  Em **Configuration** -> **General**:
    *   **Disable email confirmations**: Para desenvolvimento e para que o script de povoamento de dados funcione corretamente, **habilite esta opção (coloque o switch na posição ON)**. Isso fará com que os usuários de teste sejam criados e ativados imediatamente. **Lembre-se de desabilitar em produção.**
    *   **Enable Signups**: Certifique-se de que está habilitado.

## Passo 7: Povoar Banco de Dados com Dados de Teste (Novo - via Script JS)

Em vez de um script SQL, agora usaremos um script JavaScript para povoar o banco de dados. É mais seguro e confiável.

1.  **Instale as dependências:** Abra um terminal na raiz do seu projeto e execute:
    ```bash
    npm install --save-dev @supabase/supabase-js node-fetch
    ```
2.  **Crie o script:** Crie um arquivo na raiz do seu projeto chamado `seed.mjs`.
3.  **Copie o código:** Cole o conteúdo do arquivo `docs/supabase/seed.mjs` do seu projeto neste novo arquivo `seed.mjs`.
4.  **Adicione as variáveis de ambiente:** Você precisará da `service_role key` do Supabase para este script. Vá para `Project Settings` > `API` no seu painel Supabase, encontre a chave `service_role` na seção "Project API Keys" e adicione-a ao seu arquivo `.env.local`:
    ```env
    # .env.local
    ...
    SUPABASE_SERVICE_KEY=SUA_SERVICE_ROLE_KEY_AQUI
    ```
5.  **Execute o script:** No seu terminal, execute o seguinte comando:
    ```bash
    node seed.mjs
    ```
6.  **Aguarde:** O script levará alguns instantes para criar os usuários e todos os dados de teste. A saída no terminal informará o progresso. Ao final, você terá 3 usuários de teste com uma grande quantidade de dados.

**Credenciais dos Usuários de Teste:**
*   **Email:** `ana.silva@example.com` / `bruno.costa@example.com` / `carla.dias@example.com`
*   **Senha (para todos):** `password123`

## Passo 8: Limpar Dados de Teste Antigos (Opcional)

Se você precisar apagar os usuários de teste e seus dados para executar o script de povoamento novamente, use o script `docs/supabase/supabase_delete_test_users.sql` no SQL Editor do Supabase.

## Passo 9: Reiniciar a Aplicação Next.js

Sempre que você alterar arquivos `.env.local`, é crucial parar e reiniciar seu servidor de desenvolvimento:
```bash
# Pare o servidor (Ctrl+C no terminal onde está rodando)
npm run dev
```
Agora você está pronto para testar o aplicativo com uma base de dados rica!
