
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

Para configurar as tabelas e as políticas de segurança (RLS) no seu banco de dados Supabase, você usará os scripts SQL fornecidos no seu projeto.

1.  **Localize os Scripts SQL:**
    *   No seu projeto, você encontrará dois arquivos SQL principais para gerenciamento de esquema:
        *   `supabase_schema_drop.sql`: Contém o script para **APAGAR** todas as tabelas da aplicação.
        *   `supabase_schema_create.sql`: Contém o script para **CRIAR (OU RECRIAR)** todas as tabelas da aplicação com a versão mais recente.

2.  **Executando os Scripts no SQL Editor do Supabase:**
    *   No painel do seu projeto Supabase, vá para o **SQL Editor** (ícone de banco de dados com "SQL").
    *   Clique em "**New query**".

    *   **Para Apagar Todas as Tabelas (Opcional, Use com Cautela):**
        *   Abra o arquivo `supabase_schema_drop.sql` no seu editor de código.
        *   Copie o conteúdo do script.
        *   **Leia os avisos no script!** Se você tem certeza que quer apagar todas as tabelas e dados da aplicação, cole o script no SQL Editor do Supabase.
        *   **Descomente** as linhas `DROP TABLE IF EXISTS ...` e/ou `DELETE FROM auth.users;` conforme sua necessidade.
        *   Clique em "**RUN**".
        *   **Atenção:** Esta ação é destrutiva e apagará os dados das tabelas da aplicação.

    *   **Para Criar ou Recriar o Esquema (Tabelas e RLS):**
        *   Abra o arquivo `supabase_schema_create.sql` no seu editor de código.
        *   Copie todo o conteúdo do script.
        *   Cole o script no SQL Editor do Supabase (pode ser em uma nova query ou após limpar a anterior).
        *   Clique em "**RUN**".
        *   Este script criará todas as tabelas (`profiles`, `glucose_readings`, `insulin_logs`, `meal_analyses`, `reminders`, `activity_logs`), suas colunas, RLS e a trigger `handle_new_user`.
        
    *   **Para Atualizar um Esquema Existente (Ex: Adicionar Colunas de Metas Glicêmicas):**
        *   Se você já tem uma tabela `profiles` e só quer adicionar as novas colunas de metas, você pode rodar o seguinte comando SQL:
        ```sql
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS hypo_glucose_threshold INTEGER,
        ADD COLUMN IF NOT EXISTS target_glucose_low INTEGER,
        ADD COLUMN IF NOT EXISTS target_glucose_high INTEGER,
        ADD COLUMN IF NOT EXISTS hyper_glucose_threshold INTEGER;

        COMMENT ON COLUMN public.profiles.hypo_glucose_threshold IS 'Limite para hipoglicemia definido pelo usuário (mg/dL).';
        COMMENT ON COLUMN public.profiles.target_glucose_low IS 'Limite inferior da meta glicêmica do usuário (mg/dL).';
        COMMENT ON COLUMN public.profiles.target_glucose_high IS 'Limite superior da meta glicêmica do usuário (mg/dL).';
        COMMENT ON COLUMN public.profiles.hyper_glucose_threshold IS 'Limite para hiperglicemia definido pelo usuário (mg/dL).';
        ```
        *   O `ADD COLUMN IF NOT EXISTS` garante que o comando não dará erro se as colunas já existirem.

## Passo 5: Configurar o Supabase Storage (Buckets e Políticas)

Precisamos criar buckets para armazenar as fotos de perfil e as fotos das refeições.

1.  No painel do seu projeto Supabase, vá para **Storage** (ícone de pasta).
2.  Clique em "**New bucket**" para criar o primeiro bucket:
    *   **Bucket name**: `profile-pictures`
    *   Clique em "**Create bucket**".
3.  Clique em "**New bucket**" novamente para criar o segundo bucket:
    *   **Bucket name**: `meal-photos`
    *   Clique em "**Create bucket**".

### Configurar Políticas de Storage e Acesso Público aos Buckets

**MUITO IMPORTANTE:** Para que as imagens possam ser exibidas na sua aplicação através das URLs `/object/public/...`, você PRECISA configurar políticas que permitam a LEITURA (SELECT) pública dos objetos nesses buckets E, crucialmente, se as URLs `/object/public/...` retornarem "Bucket not found" (erro 404), você precisará marcar o bucket como "Public" na UI do Supabase.

#### Opção A: Configurar Políticas de Storage e Acesso Público via Interface do Supabase

1.  Clique no bucket `profile-pictures` recém-criado.
2.  **Tornar o Bucket Público (se necessário):**
    *   Vá para a aba "Bucket settings".
    *   Se a opção "This bucket is public" **NÃO** estiver marcada, clique em "Edit bucket" e MARQUE-A. Salve.
    *   **Teste uma URL pública de um arquivo de imagem diretamente no seu navegador.** Se o erro "Bucket not found" desaparecer, ótimo!
3.  **Configurar Políticas de Objeto (RLS no Storage):**
    *   Vá para a aba "**Policies**" do bucket.
    *   Clique em "**New policy**" e escolha "**Create a new policy from scratch**".
    *   Crie as seguintes políticas para `profile-pictures`:

        *   **Política 1: Leitura Pública para Avatares (ESSENCIAL PARA EXIBIÇÃO)**
            *   **Policy name**: `Public Read Access for Profile Pictures`
            *   **Allowed operations**: Marque **APENAS `SELECT`**.
            *   **Target roles**: Marque `anon` E `authenticated`.
            *   **Policy definition (USING expression)**: `(bucket_id = 'profile-pictures')`
            *   Clique em "**Review**" e "**Save policy**".

        *   **Política 2: Usuários Gerenciam Suas Próprias Fotos de Perfil (INSERT, UPDATE, DELETE)**
            *   **Policy name**: `Users can manage their own profile pictures`
            *   **Allowed operations**: Marque `INSERT`, `UPDATE`, `DELETE`.
            *   **Target roles**: Marque `authenticated`.
            *   **Policy definition (USING expression para UPDATE/DELETE)**: `(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[1])`
            *   **Policy definition (WITH CHECK expression para INSERT/UPDATE)**: `(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[1])`
            *   **Nota:** A estrutura de pastas para fotos de perfil é `profile-pictures/USER_ID/nome_do_arquivo.ext`. Portanto, `(storage.foldername(name))[1]` corresponde ao `USER_ID`. Se você estiver usando uma estrutura como `profile-pictures/users/USER_ID/...`, então seria `(storage.foldername(name))[2]`. Para este guia, assumimos `profile-pictures/USER_ID/...`.

            *   Clique em "**Review**" e "**Save policy**".

4.  Repita o processo para o bucket `meal-photos`:
    *   **Tornar o Bucket Público (se necessário):** Siga o passo 2 acima para o bucket `meal-photos`. Teste a URL pública no navegador.
    *   **Configurar Políticas de Objeto:**
        *   **Política 1: Leitura Pública para Fotos de Refeição**
            *   **Policy name**: `Public Read Access for Meal Photos`
            *   **Allowed operations**: `SELECT`
            *   **Target roles**: `anon`, `authenticated`
            *   **Policy definition (USING expression)**: `(bucket_id = 'meal-photos')`
        *   **Política 2: Usuários Fazem Upload de Suas Próprias Fotos de Refeição (INSERT)**
            *   **Policy name**: `Users can upload their own meal photos`
            *   **Allowed operations**: `INSERT`
            *   **Target roles**: `authenticated`
            *   **Policy definition (WITH CHECK expression)**: `(bucket_id = 'meal-photos') AND (auth.uid()::text = (storage.foldername(name))[2])` (Assumindo caminho `meal-photos/users/USER_ID/meals/nome_arquivo.ext`, onde `(storage.foldername(name))[2]` é o `USER_ID`).
        *   **Política 3: Usuários Deletam Suas Próprias Fotos de Refeição (DELETE)**
            *   **Policy name**: `Users can delete their own meal photos`
            *   **Allowed operations**: `DELETE`
            *   **Target roles**: `authenticated`
            *   **Policy definition (USING expression)**: `(bucket_id = 'meal-photos') AND (auth.uid()::text = (storage.foldername(name))[2])` (Assumindo caminho `meal-photos/users/USER_ID/meals/nome_arquivo.ext`)

#### Opção B: Configurar Políticas de Storage via SQL Editor (Apenas para RLS dos Objetos)

Se preferir, você pode criar as políticas RLS dos objetos usando o SQL Editor. **Isso NÃO tornará o bucket público em si; isso ainda precisa ser feito pela UI se você estiver recebendo "Bucket not found" para URLs `/object/public/`.**
Assumindo que o caminho no storage para fotos de perfil é `profile-pictures/USER_ID/profile.ext` e para fotos de refeição é `meal-photos/users/USER_ID/meals/MEAL_ID.ext`.

```sql
-- Políticas para o bucket 'profile-pictures'
-- Caminho esperado no storage: profile-pictures/USER_ID/nome_da_foto.ext
-- (storage.foldername(name))[1] será USER_ID
CREATE POLICY "Public Read Access for Profile Pictures" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'profile-pictures');
CREATE POLICY "Users can insert their own profile pictures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own profile pictures" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para o bucket 'meal-photos'
-- Caminho esperado no storage: meal-photos/users/USER_ID/meals/nome_da_foto_refeicao.ext
-- (storage.foldername(name))[1] será 'users'
-- (storage.foldername(name))[2] será USER_ID
-- (storage.foldername(name))[3] será 'meals'
CREATE POLICY "Public Read Access for Meal Photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'meal-photos');
CREATE POLICY "Users can upload their own meal photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users can delete their own meal photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[2]);
```

**DIAGNÓSTICO CRÍTICO:** Se você tentar acessar uma URL como `https://[SEU_ID_DE_PROJETO].supabase.co/storage/v1/object/public/[NOME_DO_BUCKET]/caminho/para/imagem.jpg` diretamente no seu navegador e receber `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`, a causa mais provável é que o bucket em si não está marcado como "Public" nas configurações do bucket na UI do Supabase. **Marcar o bucket como "Public" na UI do Supabase geralmente resolve isso.** As políticas RLS acima ainda são importantes para controlar o acesso aos objetos dentro do bucket.

## Passo 6: Script SQL para Povoamento de Dados (Opcional)

Se desejar povoar seu banco de dados com dados de exemplo para testar a aplicação, você pode usar o script SQL fornecido no arquivo `supabase_seed_data.sql`.
Para executar:
1.  Abra o arquivo `supabase_seed_data.sql` no seu editor de código.
2.  Copie todo o conteúdo do script.
3.  Cole o script no **SQL Editor** do Supabase (após ter criado as tabelas com `supabase_schema_create.sql`).
4.  Clique em "**RUN**".
5.  Verifique a saída "Messages" para as credenciais de login dos usuários de exemplo.

**Atenção:** Este script criará usuários com senhas fixas (`password123`). Use apenas para desenvolvimento/teste.

## Passo 7: Configurações de Autenticação no Supabase

1.  No painel do seu projeto Supabase, vá para **Authentication** (ícone de escudo).
2.  Em **Configuration** -> **General**:
    *   **Disable email confirmations**: Para desenvolvimento, você pode querer desabilitar a confirmação de email para facilitar o cadastro de usuários de teste. **Lembre-se de habilitar em produção.**
    *   **Enable Signups**: Certifique-se de que está habilitado.
3.  Em **Configuration** -> **Providers**:
    *   **Email**: Certifique-se de que está habilitado.
    *   Você pode adicionar outros provedores (Google, GitHub, etc.) aqui se desejar.

## Passo 8: Reiniciar a Aplicação Next.js

Sempre que você alterar arquivos `.env.local` ou `next.config.ts`, é crucial parar e reiniciar seu servidor de desenvolvimento Next.js para que as novas configurações sejam carregadas:

```bash
# Pare o servidor (Ctrl+C no terminal onde está rodando)
npm run dev
```

## Passo 9: Testar a Integração

1.  Tente se cadastrar com um novo usuário na sua aplicação.
2.  Verifique se o usuário aparece em "Authentication" -> "Users" no seu painel Supabase.
3.  Verifique se um perfil correspondente é criado na tabela `profiles` (pelo trigger `handle_new_user`).
4.  Se você executou o script de povoamento (`supabase_seed_data.sql`), tente fazer login com as credenciais de exemplo.
5.  Teste as funcionalidades de registro de glicemia, insulina, análise de refeição, etc.
6.  Verifique se os dados são salvos corretamente nas respectivas tabelas no Supabase.
7.  Teste o upload de imagens (perfil e refeição) e verifique se aparecem nos buckets do Supabase Storage e se as URLs públicas funcionam na aplicação.

## Solução de Problemas Comuns

*   **IMAGENS NÃO APARECEM ou ERRO "Bucket not found" ao acessar URL pública DIRETAMENTE NO NAVEGADOR**:
    *   **Causa mais provável: O bucket não está marcado como "Public" na UI do Supabase OU as Políticas de Storage (RLS para `storage.objects`) para LEITURA PÚBLICA estão INCORRETAS ou AUSENTES.**
        *   **Ação Primária:** No painel do Supabase, vá para Storage, selecione o bucket, clique nos três pontinhos (...), escolha "Edit bucket" e MARQUE a opção "This bucket is public". Salve e teste a URL pública novamente.
        *   **Ação Secundária:** Verifique as políticas RLS de `SELECT` nos objetos do bucket. Elas devem permitir `SELECT` para `anon` e `authenticated`.
    *   Verifique se o `hostname` no `next.config.ts` está correto e se o servidor Next.js foi reiniciado.
*   **ERROS DE RLS ou "new row violates row-level security policy"**:
    *   Verifique se as políticas de RLS nas suas tabelas (`supabase_schema_create.sql`) estão corretas e permitem as operações necessárias (INSERT, SELECT, UPDATE, DELETE) para os usuários autenticados e para `auth.uid() = user_id`.
*   **ERRO `column "target_glucose_low" of relation "profiles" does not exist` (ou similar para outras colunas de metas)**:
    *   Isso indica que sua tabela `profiles` não possui essas colunas. Execute o script `supabase_schema_create.sql` (após possivelmente rodar `supabase_schema_drop.sql` se quiser limpar tudo) para criar as tabelas com o esquema mais recente.
    *   Alternativamente, adicione as colunas faltantes usando o comando `ALTER TABLE` mostrado no Passo 4 deste guia.

Seguindo estes passos, você deverá ter seu projeto Supabase configurado e conectado corretamente!
