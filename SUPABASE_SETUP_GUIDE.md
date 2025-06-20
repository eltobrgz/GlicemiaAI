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

Para configurar as tabelas e as políticas de segurança (RLS) no seu banco de dados Supabase:

1.  **Use o Arquivo de Gerenciamento de Esquema:**
    *   No seu projeto, você encontrará um arquivo chamado `supabase_schema_management.sql`.
    *   Este arquivo contém dois scripts principais:
        *   **SCRIPT 1: APAGAR COMPLETAMENTE TODAS AS TABELAS DA APLICAÇÃO**
        *   **SCRIPT 2: CRIAR (OU RECRIAR) TODAS AS TABELAS DA APLICAÇÃO COM A VERSÃO MAIS RECENTE**

2.  **Executando os Scripts no SQL Editor do Supabase:**
    *   No painel do seu projeto Supabase, vá para o **SQL Editor** (ícone de banco de dados com "SQL").
    *   Clique em "**New query**".
    *   **Para Criar ou Recriar o Esquema:**
        *   Abra o arquivo `supabase_schema_management.sql` no seu editor de código.
        *   Se você deseja começar do zero ou garantir que está com o esquema mais recente (e **APAGARÁ TODOS OS DADOS EXISTENTES NAS TABELAS DA APLICAÇÃO**), primeiro copie e execute a seção "SCRIPT 1: APAGAR..." (lembre-se de descomentar as linhas `DROP TABLE`).
        *   Em seguida (ou se estiver configurando pela primeira vez), copie e execute a seção "SCRIPT 2: CRIAR..." no SQL Editor.
    *   Clique em "**RUN**" para cada script.

    **Atenção:** O "SCRIPT 1" apagará todas as tabelas da aplicação e seus dados. Use com cautela e faça backups se necessário. O "SCRIPT 2" criará as tabelas com as colunas, RLS e triggers mais recentes, incluindo `target_glucose_low`, `target_glucose_high`, etc., na tabela `profiles`.

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
            *   **Nota:** O caminho da imagem no storage deve ser `bucket_id/user_id/nome_arquivo.ext`. O `(storage.foldername(name))[1]` refere-se ao `user_id`. Ajuste se sua estrutura de pastas for diferente (ex: `users/user_id/...` seria `(storage.foldername(name))[2]`). Para o guia atual, estamos usando `users/user_id/...`, então `(storage.foldername(name))[2]` está correto.

            *   Clique em "**Review**" e "**Save policy**".

4.  Repita o processo para o bucket `meal-photos`:
    *   **Tornar o Bucket Público (se necessário):** Siga o passo 2 acima para o bucket `meal-photos`. Teste a URL pública no navegador.
    *   **Configurar Políticas de Objeto:**
        *   **Política 1: Leitura Pública para Fotos de Refeição** (Mesma configuração da Política 1 de `profile-pictures`, mas com `bucket_id = 'meal-photos'`)
        *   **Política 2: Usuários Fazem Upload de Suas Próprias Fotos de Refeição (INSERT)** (Mesma configuração da Política 2 de `profile-pictures` para INSERT, mas com `bucket_id = 'meal-photos'` e `(storage.foldername(name))[2]` se o caminho for `users/user_id/meals/...`)
        *   **Política 3: Usuários Deletam Suas Próprias Fotos de Refeição (DELETE)** (Mesma configuração da Política 2 de `profile-pictures` para DELETE, mas com `bucket_id = 'meal-photos'` e `(storage.foldername(name))[2]` se o caminho for `users/user_id/meals/...`)

#### Opção B: Configurar Políticas de Storage via SQL Editor (Apenas para RLS dos Objetos)

Se preferir, você pode criar as políticas RLS dos objetos usando o SQL Editor. **Isso NÃO tornará o bucket público em si; isso ainda precisa ser feito pela UI se você estiver recebendo "Bucket not found" para URLs `/object/public/`.**
Assumindo que o caminho no storage seja `users/USER_ID/profile.ext` ou `users/USER_ID/meals/MEAL_ID.ext`.

```sql
-- Políticas para o bucket 'profile-pictures'
-- Caminho esperado no storage: users/USER_ID/nome_da_foto.ext
-- (storage.foldername(name))[1] será 'users'
-- (storage.foldername(name))[2] será USER_ID
CREATE POLICY "Public Read Access for Profile Pictures" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'profile-pictures');
CREATE POLICY "Users can insert their own profile pictures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users can update their own profile pictures" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[2]) WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Políticas para o bucket 'meal-photos'
-- Caminho esperado no storage: users/USER_ID/meals/nome_da_foto_refeicao.ext
-- (storage.foldername(name))[1] será 'users'
-- (storage.foldername(name))[2] será USER_ID
-- (storage.foldername(name))[3] será 'meals'
CREATE POLICY "Public Read Access for Meal Photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'meal-photos');
CREATE POLICY "Users can upload their own meal photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users can delete their own meal photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[2]);
```

**DIAGNÓSTICO CRÍTICO:** Se você tentar acessar uma URL como `https://[SEU_ID_DE_PROJETO].supabase.co/storage/v1/object/public/[NOME_DO_BUCKET]/caminho/para/imagem.jpg` diretamente no seu navegador e receber `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`, a causa mais provável é que o bucket em si não está marcado como "Public" nas configurações do bucket na UI do Supabase. **Marcar o bucket como "Public" na UI do Supabase geralmente resolve isso.** As políticas RLS acima ainda são importantes para controlar o acesso aos objetos dentro do bucket.

## Passo 6: Script SQL para Povoamento de Dados (Opcional)

Se desejar povoar seu banco de dados com dados de exemplo para testar a aplicação, você pode usar o script abaixo. Execute-o no **SQL Editor** do Supabase.
**Atenção:** Este script criará usuários com senhas fixas (`password123`). Use apenas para desenvolvimento/teste.

```sql
-- #####################################################################
-- # SCRIPT PARA POVOAR O BANCO DE DADOS COM DADOS DE EXEMPLO         #
-- #####################################################################
-- Este script insere usuários de exemplo e dados associados.
-- Assegure-se de que as tabelas (profiles, glucose_readings, etc.)
-- já foram criadas com o SCRIPT 2 do arquivo supabase_schema_management.sql.
--
-- ATENÇÃO: Este script assume que a extensão pgcrypto está habilitada.
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto"; (Já incluído no script de criação de tabelas)
--
-- As senhas dos usuários de exemplo são 'password123'.

DO $$
DECLARE
    user_ana_id uuid := uuid_generate_v4();
    user_bruno_id uuid := uuid_generate_v4();
    user_charles_id uuid := uuid_generate_v4();
    fixed_bcrypt_hash text := '$2a$10$OBG3kS3cXiGcoHnl9ey.uOEZ4S4049CCFuqgLkPGXjch2S48BKMHy'; -- Hash bcrypt para 'password123'
    current_ts_utc timestamptz := timezone('utc', now());
BEGIN

    -- COMANDOS PARA ADICIONAR COLUNAS DE METAS À TABELA 'profiles' SE ESTIVEREM FALTANDO
    -- Execute estes ANTES de rodar este script de povoamento se sua tabela 'profiles' não tiver estas colunas.
    -- É recomendável fazer backup dos seus dados antes de alterar o esquema.
    -- Estes comandos já estão sugeridos no arquivo supabase_schema_management.sql antes da criação das tabelas.
    -- Se você usou o script de criação mais recente, estas colunas já devem existir.
    /*
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'pt-BR',
    ADD COLUMN IF NOT EXISTS target_glucose_low integer,
    ADD COLUMN IF NOT EXISTS target_glucose_high integer,
    ADD COLUMN IF NOT EXISTS hypo_glucose_threshold integer,
    ADD COLUMN IF NOT EXISTS hyper_glucose_threshold integer,
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
    */

    -- Inserir Usuários no auth.users
    -- (O trigger handle_new_user criará entradas básicas em public.profiles)
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
    VALUES
        ('00000000-0000-0000-0000-000000000000', user_ana_id, 'authenticated', 'authenticated', 'ana.silva@example.com', fixed_bcrypt_hash, current_ts_utc, NULL, NULL, current_ts_utc,
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Ana Silva', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=AS'),
        current_ts_utc, current_ts_utc, NULL, '', NULL
        ),
        ('00000000-0000-0000-0000-000000000000', user_bruno_id, 'authenticated', 'authenticated', 'bruno.costa@example.com', fixed_bcrypt_hash, current_ts_utc, NULL, NULL, current_ts_utc,
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Bruno Costa', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=BC'),
        current_ts_utc, current_ts_utc, NULL, '', NULL
        ),
        ('00000000-0000-0000-0000-000000000000', user_charles_id, 'authenticated', 'authenticated', 'charles.smith@example.com', fixed_bcrypt_hash, current_ts_utc, NULL, NULL, current_ts_utc,
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Charles Smith', 'language_preference', 'en-US', 'avatar_url', 'https://placehold.co/150x150.png?text=CS'),
        current_ts_utc, current_ts_utc, NULL, '', NULL
        );

    RAISE NOTICE 'Usuários de exemplo inseridos em auth.users.';
    RAISE NOTICE 'Ana Silva: ana.silva@example.com / password123 (ID: %)', user_ana_id;
    RAISE NOTICE 'Bruno Costa: bruno.costa@example.com / password123 (ID: %)', user_bruno_id;
    RAISE NOTICE 'Charles Smith: charles.smith@example.com / password123 (ID: %)', user_charles_id;

    -- Atualizar Perfis em public.profiles (o trigger já criou a linha, aqui adicionamos detalhes)
    UPDATE public.profiles SET
        name = 'Ana Silva',
        email = 'ana.silva@example.com', -- Redundante se o trigger pegar do auth.users, mas garante
        avatar_url = 'https://placehold.co/150x150.png?text=AS',
        date_of_birth = '1985-05-15',
        diabetes_type = 'tipo1',
        language_preference = 'pt-BR',
        target_glucose_low = 80,
        target_glucose_high = 160,
        hypo_glucose_threshold = 70,
        hyper_glucose_threshold = 200,
        updated_at = current_ts_utc
    WHERE id = user_ana_id;

    UPDATE public.profiles SET
        name = 'Bruno Costa',
        email = 'bruno.costa@example.com',
        avatar_url = 'https://placehold.co/150x150.png?text=BC',
        date_of_birth = '1992-11-30',
        diabetes_type = 'tipo2',
        language_preference = 'pt-BR',
        target_glucose_low = 90,
        target_glucose_high = 180,
        hypo_glucose_threshold = 75,
        hyper_glucose_threshold = 220,
        updated_at = current_ts_utc
    WHERE id = user_bruno_id;
    
    UPDATE public.profiles SET
        name = 'Charles Smith',
        email = 'charles.smith@example.com',
        avatar_url = 'https://placehold.co/150x150.png?text=CS',
        date_of_birth = '1978-07-20',
        diabetes_type = 'outro',
        language_preference = 'en-US',
        target_glucose_low = 70,
        target_glucose_high = 150,
        hypo_glucose_threshold = 65,
        hyper_glucose_threshold = 180,
        updated_at = current_ts_utc
    WHERE id = user_charles_id;

    RAISE NOTICE 'Perfis de exemplo atualizados em public.profiles.';

    -- Leituras de Glicemia para Ana Silva
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_ana_id, 95, current_ts_utc - interval '3 days 2 hours', 'jejum', 'Acordei bem', 'normal'),
    (user_ana_id, 150, current_ts_utc - interval '3 days', 'depois_refeicao', 'Almoço com macarrão', 'alta'),
    (user_ana_id, 110, current_ts_utc - interval '2 days 10 hours', 'antes_refeicao', 'Antes do jantar', 'normal'),
    (user_ana_id, 65, current_ts_utc - interval '2 days 5 hours', 'outro', 'Senti tremedeira', 'baixa'),
    (user_ana_id, 185, current_ts_utc - interval '1 day 3 hours', 'depois_refeicao', 'Pizza ontem à noite', 'alta');

    -- Leituras de Glicemia para Bruno Costa
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_bruno_id, 120, current_ts_utc - interval '2 days 1 hours', 'jejum', 'Manhã normal', 'normal'),
    (user_bruno_id, 210, current_ts_utc - interval '1 day 20 hours', 'depois_refeicao', 'Sobremesa extra', 'muito_alta');

    RAISE NOTICE 'Leituras de glicemia de exemplo inseridas.';

    -- Registros de Insulina para Ana Silva
    INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES
    (user_ana_id, 'Rápida (Lispro)', 8, current_ts_utc - interval '3 days'),
    (user_ana_id, 'Lenta (Glargina)', 22, current_ts_utc - interval '3 days 20 minutes'),
    (user_ana_id, 'Rápida (Lispro)', 6, current_ts_utc - interval '1 day 3 hours');

    RAISE NOTICE 'Registros de insulina de exemplo inseridos.';

    -- Análises de Refeição para Ana Silva
    INSERT INTO public.meal_analyses (user_id, timestamp, image_url, original_image_file_name, food_identification, macronutrient_estimates, estimated_glucose_impact, suggested_insulin_dose, improvement_tips) VALUES
    (user_ana_id, current_ts_utc - interval '2 days', 'https://placehold.co/600x400.png?text=Prato+Saudavel', 'prato_saudavel.jpg', 'Salada colorida com frango grelhado e quinoa.', '{"carbohydrates": 30, "protein": 40, "fat": 15}', 'Impacto glicêmico moderado, elevação gradual.', '4-6 unidades de insulina rápida, ajustar conforme sensibilidade.', 'Adicionar mais fibras de vegetais folhosos escuros.');

    RAISE NOTICE 'Análises de refeição de exemplo inseridas.';

    -- Lembretes para Ana Silva
    INSERT INTO public.reminders (user_id, type, name, time, days, enabled, insulin_type, insulin_dose) VALUES
    (user_ana_id, 'glicemia', 'Glicemia Jejum', '07:00:00', 'todos_os_dias', true, NULL, NULL),
    (user_ana_id, 'insulina', 'Insulina Basal Noite', '22:00:00', 'todos_os_dias', true, 'Lenta (Glargina)', 22);

    RAISE NOTICE 'Lembretes de exemplo inseridos.';

    -- Atividades Físicas para Bruno Costa
    INSERT INTO public.activity_logs (user_id, timestamp, activity_type, duration_minutes, intensity, notes) VALUES
    (user_bruno_id, current_ts_utc - interval '1 day 10 hours', 'caminhada', 45, 'moderada', 'Caminhada no parque, ritmo bom.'),
    (user_bruno_id, current_ts_utc - interval '3 days 8 hours', 'musculacao', 60, 'moderada', 'Treino de superiores.');

    RAISE NOTICE 'Atividades físicas de exemplo inseridas.';
    RAISE NOTICE 'Povoamento de dados concluído com sucesso!';

END $$;
```

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
3.  Verifique se um perfil correspondente é criado na tabela `profiles` (se você implementou o trigger `handle_new_user`).
4.  Teste as funcionalidades de registro de glicemia, insulina, análise de refeição, etc.
5.  Verifique se os dados são salvos corretamente nas respectivas tabelas no Supabase.
6.  Teste o upload de imagens (perfil e refeição) e verifique se aparecem nos buckets do Supabase Storage e se as URLs públicas funcionam na aplicação.

## Solução de Problemas Comuns

*   **IMAGENS NÃO APARECEM ou ERRO "Bucket not found" ao acessar URL pública DIRETAMENTE NO NAVEGADOR**:
    *   **Causa mais provável: O bucket não está marcado como "Public" na UI do Supabase OU as Políticas de Storage (RLS para `storage.objects`) para LEITURA PÚBLICA estão INCORRETAS ou AUSENTES.**
        *   **Ação Primária:** No painel do Supabase, vá para Storage, selecione o bucket, clique nos três pontinhos (...), escolha "Edit bucket" e MARQUE a opção "This bucket is public". Salve e teste a URL pública novamente.
        *   **Ação Secundária:** Verifique as políticas RLS de `SELECT` nos objetos do bucket. Elas devem permitir `SELECT` para `anon` e `authenticated`.
    *   Verifique se o `hostname` no `next.config.ts` está correto e se o servidor Next.js foi reiniciado.
*   **ERROS DE RLS ou "new row violates row-level security policy"**:
    *   Verifique se as políticas de RLS nas suas tabelas estão corretas e permitem as operações necessárias (INSERT, SELECT, UPDATE, DELETE) para os usuários autenticados e para `auth.uid() = user_id`.
*   **ERRO `column "target_glucose_low" of relation "profiles" does not exist` (ou similar para outras colunas de metas)**:
    *   Isso indica que sua tabela `profiles` não possui essas colunas. Execute o "SCRIPT 2" do arquivo `supabase_schema_management.sql` para recriar as tabelas com o esquema mais recente (isso apagará os dados existentes nas tabelas) ou, se preferir manter os dados, adicione as colunas manualmente via `ALTER TABLE` (veja a seção de "Opção para Atualizar a Tabela profiles Existente" que estava no guia anterior ou adapte os comandos do script de criação).

Seguindo estes passos, você deverá ter seu projeto Supabase configurado e conectado corretamente!
