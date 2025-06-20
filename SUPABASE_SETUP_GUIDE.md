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

Agora você precisa criar as tabelas no seu banco de dados Supabase e configurar as políticas de Row Level Security (RLS). RLS é crucial para garantir que os usuários só possam acessar e modificar seus próprios dados.

1.  No painel do seu projeto Supabase, vá para o **SQL Editor** (ícone de banco de dados com "SQL").
2.  Clique em "**New query**".
3.  Copie e cole os scripts SQL abaixo, um de cada vez ou todos juntos, e execute-os.

### Script SQL para Criação de Tabelas e RLS (Esquema Mais Recente)

Este script contém a definição completa e mais recente das tabelas. Se você está começando ou pode recriar suas tabelas (após backup, se necessário), este é o script a ser usado.

```sql
-- 0. GARANTIR QUE A EXTENSÃO pgcrypto ESTÁ HABILITADA (necessária para bcrypt no script de povoamento)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Habilitar extensão UUID (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis (profiles)
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text,
  email text UNIQUE, -- Pode ser sincronizado de auth.users
  avatar_url text, -- Armazenará a URL pública da imagem do Supabase Storage
  date_of_birth date,
  diabetes_type text, -- Ex: 'tipo1', 'tipo2', 'gestacional', 'outro'
  language_preference text DEFAULT 'pt-BR', -- Preferência de idioma do usuário, ex: 'pt-BR', 'en-US'
  target_glucose_low integer, -- Meta mínima de glicemia ideal
  target_glucose_high integer, -- Meta máxima de glicemia ideal
  hypo_glucose_threshold integer, -- Limite para hipoglicemia
  hyper_glucose_threshold integer, -- Limite para hiperglicemia (antes de muito_alta)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);
-- RLS para profiles:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Opcional: Trigger para criar um perfil quando um novo usuário se cadastra (em auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, language_preference, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'language_preference',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Tabela de Leituras de Glicemia (glucose_readings)
CREATE TABLE public.glucose_readings (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  value integer NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  meal_context text,
  notes text,
  level text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para glucose_readings:
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own glucose readings." ON public.glucose_readings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 4. Tabela de Registros de Insulina (insulin_logs)
CREATE TABLE public.insulin_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL,
  dose numeric NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para insulin_logs:
ALTER TABLE public.insulin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own insulin logs." ON public.insulin_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 5. Tabela de Análises de Refeição (meal_analyses)
CREATE TABLE public.meal_analyses (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  timestamp timestamp with time zone NOT NULL,
  image_url text,
  original_image_file_name text,
  food_identification text NOT NULL,
  macronutrient_estimates jsonb NOT NULL,
  estimated_glucose_impact text NOT NULL,
  suggested_insulin_dose text NOT NULL,
  improvement_tips text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para meal_analyses:
ALTER TABLE public.meal_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own meal analyses." ON public.meal_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 6. Tabela de Lembretes (reminders)
CREATE TABLE public.reminders (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  time time without time zone NOT NULL,
  days jsonb NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  insulin_type text,
  insulin_dose numeric,
  is_simulated_call boolean,
  simulated_call_contact text,
  custom_sound text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para reminders:
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own reminders." ON public.reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Tabela de Registros de Atividade Física (activity_logs)
CREATE TABLE public.activity_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  timestamp timestamp with time zone NOT NULL, -- Data e hora do início da atividade
  activity_type text NOT NULL, -- Ex: 'caminhada', 'corrida', 'musculacao', 'outro'
  duration_minutes integer NOT NULL, -- Duração em minutos
  intensity text, -- Ex: 'leve', 'moderada', 'intensa'
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para activity_logs:
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own activity logs." ON public.activity_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

```

### Opção para Atualizar a Tabela `profiles` Existente (se colunas de metas estiverem faltando)

Se você já tem uma tabela `profiles` e dados nela, mas está recebendo erros sobre colunas como `target_glucose_low` não existirem, você pode tentar adicionar essas colunas à sua tabela existente. **Faça um backup dos seus dados antes de executar estes comandos!**

Execute os seguintes comandos `ALTER TABLE` no SQL Editor do Supabase. Eles só adicionarão a coluna se ela ainda não existir:

```sql
-- COMANDOS PARA ADICIONAR COLUNAS DE METAS À TABELA 'profiles' SE ESTIVEREM FALTANDO
-- Execute estes ANTES de rodar scripts de povoamento que dependam dessas colunas.
-- É recomendável fazer backup dos seus dados antes de alterar o esquema.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS target_glucose_low integer,
ADD COLUMN IF NOT EXISTS target_glucose_high integer,
ADD COLUMN IF NOT EXISTS hypo_glucose_threshold integer,
ADD COLUMN IF NOT EXISTS hyper_glucose_threshold integer,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Se a coluna created_at também estiver faltando (menos provável, mas possível):
-- ALTER TABLE public.profiles
-- ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Após adicionar as colunas, você pode querer atualizar os valores de 'updated_at' para os registros existentes se eles não foram definidos
-- UPDATE public.profiles SET updated_at = created_at WHERE updated_at IS NULL;
-- UPDATE public.profiles SET updated_at = timezone('utc'::text, now()) WHERE updated_at IS NULL; -- Ou para o tempo atual
```

**Importante sobre RLS**: As políticas de Row Level Security são essenciais. Sem elas, qualquer usuário com a chave `anon public` poderia, teoricamente, acessar dados de outros usuários. As políticas acima garantem que os usuários só possam interagir com seus próprios registros.

**Importante sobre a Trigger `handle_new_user`**:
Se você executar esta trigger:
*   Ela criará automaticamente uma entrada na tabela `profiles` quando um novo usuário se cadastrar através do sistema de autenticação do Supabase.
*   Ela espera que `full_name` (e opcionalmente `avatar_url` e `language_preference`) seja passado no campo `options: { data: { full_name: 'Nome do Usuario', language_preference: 'pt-BR' } }` durante a chamada de `supabase.auth.signUp()` no seu frontend.
*   Se você já tem usuários e adicionou as novas colunas (`target_glucose_low`, etc.) via `ALTER TABLE`, talvez precise atualizar manualmente os perfis existentes ou definir valores padrão para essas novas colunas nos registros já existentes.

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

## Passo 6: Configurações de Autenticação no Supabase
(Sem alterações nesta seção, mas garanta que está configurado)

## Passo 7: Reiniciar a Aplicação Next.js
(Crucial após qualquer alteração no `.env.local` ou `next.config.ts`)

## Passo 8: Testar a Integração
(Teste todas as funcionalidades, especialmente o upload e exibição de imagens de perfil e refeição)

## Solução de Problemas Comuns

*   **IMAGENS NÃO APARECEM ou ERRO "Bucket not found" ao acessar URL pública DIRETAMENTE NO NAVEGADOR**:
    *   **Causa mais provável: O bucket não está marcado como "Public" na UI do Supabase OU as Políticas de Storage (RLS para `storage.objects`) para LEITURA PÚBLICA estão INCORRETAS ou AUSENTES.**
        *   **Ação Primária:** No painel do Supabase, vá para Storage, selecione o bucket, clique nos três pontinhos (...), escolha "Edit bucket" e MARQUE a opção "This bucket is public". Salve e teste a URL pública novamente.
        *   **Ação Secundária:** Verifique as políticas RLS de `SELECT` nos objetos do bucket. Elas devem permitir `SELECT` para `anon` e `authenticated`.
    *   Verifique se o `hostname` no `next.config.ts` está correto e se o servidor Next.js foi reiniciado.

Seguindo estes passos, você deverá ter seu projeto Supabase configurado e conectado corretamente!

    