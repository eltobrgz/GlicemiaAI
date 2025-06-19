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
    *   **Project URL**: Encontrada na seção "Configuration" -> "URL".
    *   **Project API Keys** -> `anon` `public`: Encontrada na seção "Project API Keys" -> "Default API Keys". **Use a chave `anon public`**. Não use a `service_role` key no frontend.

Copie esses dois valores.

## Passo 3: Configurar Variáveis de Ambiente no Projeto Next.js

1.  No seu projeto Next.js (GlicemiaAI), crie um arquivo chamado `.env.local` na raiz do projeto, se ainda não existir. É no mesmo nível que `package.json`.
2.  Adicione as chaves que você copiou do Supabase a este arquivo, da seguinte forma:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=SUA_PROJECT_URL_AQUI
    NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_PUBLIC_KEY_AQUI
    ```

    Substitua `SUA_PROJECT_URL_AQUI` e `SUA_ANON_PUBLIC_KEY_AQUI` pelos valores reais que você copiou.
    **Importante**: O prefixo `NEXT_PUBLIC_` é necessário para que essas variáveis sejam expostas ao navegador.

## Passo 4: Configurar o Banco de Dados (Tabelas e RLS)

Agora você precisa criar as tabelas no seu banco de dados Supabase e configurar as políticas de Row Level Security (RLS). RLS é crucial para garantir que os usuários só possam acessar e modificar seus próprios dados.

1.  No painel do seu projeto Supabase, vá para o **SQL Editor** (ícone de banco de dados com "SQL").
2.  Clique em "**New query**".
3.  Copie e cole os scripts SQL abaixo, um de cada vez ou todos juntos, e execute-os.

### Script SQL para Criação de Tabelas e RLS

```sql
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
-- Este trigger assume que você passa 'full_name' nos metadados durante o cadastro (signUp).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name', -- Captura o nome dos metadados
    new.raw_user_meta_data->>'avatar_url' -- Captura avatar_url dos metadados, se houver
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
  meal_context text, -- Ex: 'antes_refeicao', 'depois_refeicao', 'jejum', 'outro'
  notes text,
  level text, -- Ex: 'baixa', 'normal', 'alta', 'muito_alta'
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
  image_url text, -- Armazenará a URL pública da imagem do Supabase Storage
  original_image_file_name text,
  food_identification text NOT NULL,
  macronutrient_estimates jsonb NOT NULL, -- Armazenar como {"carbohydrates": 0, "protein": 0, "fat": 0}
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
  type text NOT NULL, -- 'glicemia' ou 'insulina'
  name text NOT NULL,
  time time without time zone NOT NULL, -- Armazenar como 'HH24:MI:SS'
  days jsonb NOT NULL, -- Armazenar como array JSON de strings ou "todos_os_dias"
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

```

**Importante sobre RLS**: As políticas de Row Level Security são essenciais. Sem elas, qualquer usuário com a chave `anon public` poderia, teoricamente, acessar dados de outros usuários. As políticas acima garantem que os usuários só possam interagir com seus próprios registros.

**Importante sobre a Trigger `handle_new_user`**:
Se você executar esta trigger:
*   Ela criará automaticamente uma entrada na tabela `profiles` quando um novo usuário se cadastrar através do sistema de autenticação do Supabase.
*   Ela espera que `full_name` (e opcionalmente `avatar_url`) seja passado no campo `options: { data: { full_name: 'Nome do Usuario' } }` durante a chamada de `supabase.auth.signUp()` no seu frontend. O código atual em `SignupForm.tsx` já faz isso para `full_name`.

Se você não quiser usar a trigger, precisará garantir que um perfil seja criado manualmente ou através da lógica do seu app após o cadastro.

## Passo 5: Configurar o Supabase Storage (Buckets e Políticas)

Precisamos criar buckets para armazenar as fotos de perfil e as fotos das refeições.

1.  No painel do seu projeto Supabase, vá para **Storage** (ícone de pasta).
2.  Clique em "**New bucket**" para criar o primeiro bucket:
    *   **Bucket name**: `profile-pictures`
    *   **Public bucket**: Deixe **desmarcado** por enquanto. Vamos configurar políticas de acesso.
    *   Clique em "**Create bucket**".
3.  Clique no bucket `profile-pictures` recém-criado e vá para a aba "**Policies**".
4.  Clique em "**New policy**" e escolha "**Create a new policy from scratch**".
5.  Crie as seguintes políticas para `profile-pictures` (você pode precisar de múltiplas políticas ou combinar):

    *   **Política para Leitura Pública de Avatares:**
        *   **Policy name**: `Public Read Access for Avatars`
        *   **Allowed operations**: Marque `SELECT`.
        *   **Target roles**: Marque `anon`, `authenticated`.
        *   **Policy definition (USING expression)**:
            ```sql
            true
            ```
        *   Clique em "**Review**" e "**Save policy**".

    *   **Política para Usuários Gerenciarem Seus Próprios Avatares:**
        *   **Policy name**: `Users can manage their own avatars`
        *   **Allowed operations**: Marque `INSERT`, `UPDATE`, `DELETE`.
        *   **Target roles**: Marque `authenticated`.
        *   **Policy definition (USING expression for SELECT, DELETE, UPDATE; WITH CHECK expression for INSERT, UPDATE)**:
            ```sql
            -- Para SELECT, UPDATE, DELETE (o que o usuário PODE acessar/modificar)
            (bucket_id = 'profile-pictures' AND auth.uid() = (storage.foldername(name))[1])

            -- Para INSERT, UPDATE (o que o usuário PODE criar/modificar)
            (bucket_id = 'profile-pictures' AND auth.uid() = (storage.foldername(name))[1])
            ```
            *Nota: Esta política assume que você armazenará os avatares em pastas nomeadas com o `user_id`, por exemplo: `users/{user_id}/profile.png`. A lógica de upload no app precisará seguir este padrão.*
            *Se preferir um nome de arquivo fixo por usuário, a política pode ser mais simples. Se os arquivos têm nomes únicos e o path inclui o user_id, como `auth.uid()::text || '/' || name` (ex: `{user_id}/profile.png`), a política acima é um bom começo.*
            *Alternativa mais simples para INSERT/UPDATE se os nomes de arquivo não seguem um padrão de pasta com user_id, mas você confia na lógica do app para colocar na pasta correta (menos seguro se a lógica do app falhar):*
            ```sql
            -- Para INSERT/UPDATE (CHECK)
            (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated')
            -- Para SELECT/DELETE (USING)
            (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated') -- Ou true se for público
            ```
            *Vamos usar uma abordagem onde o app garante o path `users/{uid}/filename`.*

            Policy Example (INSERT for profile-pictures):
            Name: `Allow user to insert own avatar`
            Operations: `INSERT`
            Roles: `authenticated`
            USING expression: `(bucket_id = 'profile-pictures') AND ((storage.foldername(name))[1] = (auth.uid())::text)`
            WITH CHECK expression: `(bucket_id = 'profile-pictures') AND ((storage.foldername(name))[1] = (auth.uid())::text)`

            Policy Example (SELECT for profile-pictures - Public Read):
            Name: `Allow public read for avatars`
            Operations: `SELECT`
            Roles: `anon`, `authenticated`
            USING expression: `bucket_id = 'profile-pictures'`
            WITH CHECK expression: `(false)` (não aplicável para select)

            Policy Example (UPDATE for profile-pictures):
            Name: `Allow user to update own avatar`
            Operations: `UPDATE`
            Roles: `authenticated`
            USING expression: `(bucket_id = 'profile-pictures') AND ((storage.foldername(name))[1] = (auth.uid())::text)`
            WITH CHECK expression: `(bucket_id = 'profile-pictures') AND ((storage.foldername(name))[1] = (auth.uid())::text)`

            Policy Example (DELETE for profile-pictures):
            Name: `Allow user to delete own avatar`
            Operations: `DELETE`
            Roles: `authenticated`
            USING expression: `(bucket_id = 'profile-pictures') AND ((storage.foldername(name))[1] = (auth.uid())::text)`
            WITH CHECK expression: `(false)` (não aplicável para delete)

6.  Clique em "**New bucket**" novamente para criar o segundo bucket:
    *   **Bucket name**: `meal-photos`
    *   **Public bucket**: Deixe **desmarcado**.
    *   Clique em "**Create bucket**".
7.  Clique no bucket `meal-photos` e vá para a aba "**Policies**".
8.  Crie políticas similares para `meal-photos`:

    *   **Política para Leitura Pública de Fotos de Refeição:**
        *   **Policy name**: `Public Read Access for Meal Photos`
        *   **Allowed operations**: Marque `SELECT`.
        *   **Target roles**: Marque `anon`, `authenticated`.
        *   **Policy definition (USING expression)**:
            ```sql
            true
            ```
        *   Clique em "**Review**" e "**Save policy**".

    *   **Política para Usuários Enviarem Suas Fotos de Refeição:**
        *   **Policy name**: `Users can upload their meal photos`
        *   **Allowed operations**: Marque `INSERT`.
        *   **Target roles**: Marque `authenticated`.
        *   **Policy definition (WITH CHECK expression)**:
            ```sql
            (bucket_id = 'meal-photos' AND auth.uid() = (storage.foldername(name))[1])
            ```
             *Isso também assume que as fotos das refeições serão armazenadas em pastas com `user_id`, ex: `users/{user_id}/meals/{some_uuid}.jpg`.*

            Policy Example (INSERT for meal-photos):
            Name: `Allow user to insert own meal photo`
            Operations: `INSERT`
            Roles: `authenticated`
            USING expression: `(bucket_id = 'meal-photos') AND ((storage.foldername(name))[1] = (auth.uid())::text)`
            WITH CHECK expression: `(bucket_id = 'meal-photos') AND ((storage.foldername(name))[1] = (auth.uid())::text)`

            Policy Example (SELECT for meal-photos - Public Read):
            Name: `Allow public read for meal photos`
            Operations: `SELECT`
            Roles: `anon`, `authenticated`
            USING expression: `bucket_id = 'meal-photos'`

            Policy Example (DELETE for meal-photos - User can delete their own):
            Name: `Allow user to delete own meal photo`
            Operations: `DELETE`
            Roles: `authenticated`
            USING expression: `(bucket_id = 'meal-photos') AND ((storage.foldername(name))[1] = (auth.uid())::text)`


## Passo 6: Configurações de Autenticação no Supabase

1.  No painel do seu projeto Supabase, vá para **Authentication** (ícone de escudo).
2.  **Providers**:
    *   **Email** já deve estar habilitado por padrão. Você pode configurar outras opções aqui se desejar (Google, GitHub, etc.), mas a aplicação Next.js está configurada apenas para Email/Senha por enquanto.
3.  **Settings**:
    *   **Confirm email**: Por padrão, isso geralmente está habilitado. Isso significa que os usuários precisarão confirmar o email antes de poderem fazer login. Para desenvolvimento, você pode querer desabilitar temporariamente para facilitar os testes. Lembre-se de habilitá-lo para produção.
    *   **Redirect URLs**: Configure o "Site URL" (geralmente `http://localhost:3000` para desenvolvimento) e "Additional Redirect URLs" se necessário para o fluxo de autenticação (ex: links de confirmação de email, reset de senha).
4.  **Email Templates**: Personalize os templates de email (Confirmação, Reset de Senha, etc.) para que correspondam à identidade visual da sua aplicação.

## Passo 7: Reiniciar a Aplicação Next.js

Se sua aplicação Next.js estiver rodando, **pare-a e reinicie-a completamente**.
Isso é crucial para que ela carregue as variáveis de ambiente do arquivo `.env.local`.

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

## Passo 8: Testar a Integração

1.  Tente se cadastrar com um novo usuário.
2.  Verifique se o usuário foi criado na seção "Authentication" -> "Users" do seu painel Supabase.
3.  Verifique se um perfil foi criado na tabela `profiles`.
4.  Tente fazer login com o usuário cadastrado.
5.  Teste todas as funcionalidades que salvam e buscam dados:
    *   Registrar e visualizar glicemias.
    *   Registrar e visualizar doses de insulina.
    *   **Analisar refeições (com upload de imagem para o Storage).**
    *   Configurar e visualizar lembretes.
    *   **Visualizar e editar o perfil do usuário (com upload de foto de perfil para o Storage).**

## Solução de Problemas Comuns

*   **Erro "Missing env.NEXT_PUBLIC_SUPABASE_..."**:
    *   Verifique se o arquivo `.env.local` está na raiz do projeto.
    *   Verifique se os nomes das variáveis (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) estão corretos.
    *   Verifique se os valores das chaves estão corretos e não contêm erros de digitação.
    *   **REINICIE O SERVIDOR NEXT.JS.**
*   **Erros de Permissão (RLS)**: Se você receber erros indicando que não tem permissão para acessar ou modificar dados (inclusive no Storage), verifique suas políticas de RLS nas tabelas do Supabase e as políticas dos Buckets no Storage. Certifique-se de que elas permitem que usuários autenticados (`auth.uid() = ...`) realizem as operações necessárias.
*   **Erro "fetch failed" ou de rede**: Verifique se a "Project URL" do Supabase está correta no seu `.env.local` e se seu projeto Supabase está ativo e acessível.
*   **Upload para Storage Falha**:
    *   Verifique se o nome do bucket está correto no código.
    *   Verifique as políticas do bucket. A mensagem de erro do Supabase geralmente é informativa.
    *   Verifique o tamanho do arquivo e os tipos permitidos (se configurado).

Seguindo estes passos, você deverá ter seu projeto Supabase configurado e conectado corretamente à sua aplicação GlicemiaAI, incluindo o uso do Storage! Se tiver mais dúvidas ou problemas, me diga.
      
As políticas de storage podem ser um pouco complexas. Para simplificar inicialmente, você pode tornar os buckets públicos (marcando "Public bucket" na criação ou editando-o). Isso remove a necessidade de políticas de SELECT complexas, mas qualquer um com o link poderá acessar os arquivos. Para INSERT, UPDATE, DELETE, você ainda precisará de políticas baseadas em `auth.uid()`. Para produção, políticas mais granulares são recomendadas.

Exemplo de política de Storage mais simples para permitir que usuários autenticados façam upload e qualquer um leia (público):

Para o bucket `profile-pictures` e `meal-photos`:
1.  Marque o bucket como "Public" nas configurações do bucket. Isso lida com o SELECT público.
2.  Adicione uma política para INSERT:
    *   **Policy name**: `Authenticated users can upload`
    *   **Allowed operations**: `INSERT`
    *   **Target roles**: `authenticated`
    *   **Policy definition (WITH CHECK expression)**:
        ```sql
        (bucket_id = 'profile-pictures') -- ou 'meal-photos' para o outro bucket
        ```
3.  Adicione uma política para UPDATE (se necessário, por exemplo, para foto de perfil):
    *   **Policy name**: `Authenticated users can update their own files`
    *   **Allowed operations**: `UPDATE`
    *   **Target roles**: `authenticated`
    *   **Policy definition (USING e WITH CHECK)**:
        ```sql
        (bucket_id = 'profile-pictures' AND auth.uid() = (storage.foldername(name))[1])
        ```
        *(Isso ainda assume que o user_id está no caminho do arquivo)*
4.  Adicione uma política para DELETE (se necessário):
    *   **Policy name**: `Authenticated users can delete their own files`
    *   **Allowed operations**: `DELETE`
    *   **Target roles**: `authenticated`
    *   **Policy definition (USING)**:
        ```sql
        (bucket_id = 'profile-pictures' AND auth.uid() = (storage.foldername(name))[1])
        ```

Lembre-se que `(storage.foldername(name))[1]` extrai a primeira pasta do caminho do arquivo. Se você salvar arquivos como `user_id/photo.jpg`, então `(storage.foldername(name))[1]` será `user_id`.

Para simplificar ainda mais o **desenvolvimento inicial**, você pode usar políticas bem abertas e depois restringi-las:
Ex: Política para `INSERT` em `profile-pictures` (desenvolvimento):
```sql
-- Policy Name: Allow any authenticated user to insert
-- Operations: INSERT
-- Roles: authenticated
-- USING expression: true
-- WITH CHECK expression: (bucket_id = 'profile-pictures')
```
E para `SELECT` (leitura), marcar o bucket como público é o mais fácil. **Lembre-se de revisar e restringir essas políticas para produção!**

```sql
-- Para facilitar o início, políticas de Storage bem permissivas (REVISAR PARA PRODUÇÃO):

-- Para o bucket 'profile-pictures'
-- 1. Permite que qualquer pessoa leia (SELECT)
-- CREATE POLICY "Public Read Access for Profile Pictures" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');

-- 2. Permite que usuários autenticados insiram (INSERT)
-- CREATE POLICY "Authenticated User Insert for Profile Pictures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-pictures');

-- 3. Permite que usuários autenticados atualizem (UPDATE) seus próprios arquivos (assumindo que o user_id está no caminho do arquivo)
-- CREATE POLICY "Authenticated User Update for Own Profile Pictures" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid() = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid() = (storage.foldername(name))[1]);

-- 4. Permite que usuários autenticados deletem (DELETE) seus próprios arquivos
-- CREATE POLICY "Authenticated User Delete for Own Profile Pictures" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid() = (storage.foldername(name))[1]);


-- Para o bucket 'meal-photos'
-- 1. Permite que qualquer pessoa leia (SELECT)
-- CREATE POLICY "Public Read Access for Meal Photos" ON storage.objects FOR SELECT USING (bucket_id = 'meal-photos');

-- 2. Permite que usuários autenticados insiram (INSERT)
-- CREATE POLICY "Authenticated User Insert for Meal Photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'meal-photos');

-- 3. Permite que usuários autenticados deletem (DELETE) seus próprios arquivos (se necessário)
-- CREATE POLICY "Authenticated User Delete for Own Meal Photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'meal-photos' AND auth.uid() = (storage.foldername(name))[1]);

-- Nota: Para executar estas políticas SQL diretamente, você pode precisar habilitar o acesso via SQL para o schema de storage,
-- ou criá-las através da UI do Supabase Storage, que é o método recomendado.
-- As políticas acima com (storage.foldername(name))[1] esperam que o primeiro nível de pasta seja o ID do usuário.
-- Ex: 'profile-pictures/USER_ID/avatar.png'
-- Ex: 'meal-photos/USER_ID/refeicao_xyz.jpg'
```

**Se você optar por buckets públicos na UI do Supabase, você não precisará das políticas de `SELECT` acima.** Você só precisará das políticas de `INSERT`, `UPDATE`, e `DELETE` para usuários autenticados.

**Exemplo de estrutura de pastas no Storage que as políticas acima esperam:**
*   Bucket `profile-pictures`:
    *   `{user_id}/profile.png` (ou `avatar.jpg`, etc.)
*   Bucket `meal-photos`:
    *   `{user_id}/meals/{timestamp_or_uuid}.jpg`

A lógica de upload nos arquivos Typescript (`storage.ts`) será responsável por criar esses caminhos.

```sql
-- Simplificando as políticas de Storage para o Guia (usando a UI do Supabase para criar):

-- BUCKET: profile-pictures
-- Policy 1: Public Read
--   Name: "Public read access for profile pictures"
--   Allowed operation: SELECT
--   Target roles: anon, authenticated
--   USING expression: true

-- Policy 2: Authenticated users can upload/update/delete their own
--   Name: "Users can manage their own profile pictures"
--   Allowed operations: INSERT, UPDATE, DELETE
--   Target roles: authenticated
--   USING expression (for UPDATE, DELETE): auth.uid() = (storage.foldername(name))[1]  -- Checks if the user owns the folder
--   WITH CHECK expression (for INSERT, UPDATE): auth.uid() = (storage.foldername(name))[1] -- Ensures user uploads to their own folder

-- BUCKET: meal-photos
-- Policy 1: Public Read
--   Name: "Public read access for meal photos"
--   Allowed operation: SELECT
--   Target roles: anon, authenticated
--   USING expression: true

-- Policy 2: Authenticated users can upload their own
--   Name: "Users can upload their own meal photos"
--   Allowed operations: INSERT
--   Target roles: authenticated
--   WITH CHECK expression: auth.uid() = (storage.foldername(name))[1]

-- Policy 3: Authenticated users can delete their own (opcional, mas bom ter)
--   Name: "Users can delete their own meal photos"
--   Allowed operations: DELETE
--   Target roles: authenticated
--   USING expression: auth.uid() = (storage.foldername(name))[1]
```

O código da aplicação (`storage.ts`) criará os caminhos da seguinte forma:
- Foto de perfil: `NOMEDOBBUCKET/users/{UID_DO_USUARIO}/profile.{EXTENSAO}`
- Foto de refeição: `NOMEDOBBUCKET/users/{UID_DO_USUARIO}/meals/{ID_UNICO_DA_FOTO}.{EXTENSAO}`

Isso significa que `(storage.foldername(name))[1]` resultará em `users` e `(storage.foldername(name))[2]` resultará em `{UID_DO_USUARIO}`.
A política correta para checar o dono do arquivo no segundo nível de pasta seria:
`auth.uid()::text = (storage.foldername(name))[2]`

Vamos ajustar as políticas no guia para refletir essa estrutura de pasta: `users/{user_id}/...`

**Políticas de Storage (REVISADAS para o guia):**

*   **Bucket**: `profile-pictures`
    *   **Política 1: Leitura Pública**
        *   Nome: `Public Read Access for Profile Pictures`
        *   Operações: `SELECT`
        *   Perfis (Roles): `anon`, `authenticated`
        *   Usando expressão (USING): `true`
    *   **Política 2: Usuários Gerenciam Próprias Fotos de Perfil**
        *   Nome: `Users can manage their own profile pictures`
        *   Operações: `INSERT`, `UPDATE`, `DELETE`
        *   Perfis (Roles): `authenticated`
        *   Usando expressão (USING para UPDATE/DELETE): `auth.uid()::text = (storage.foldername(name))[2]`
        *   Com checagem (WITH CHECK para INSERT/UPDATE): `auth.uid()::text = (storage.foldername(name))[2]`

*   **Bucket**: `meal-photos`
    *   **Política 1: Leitura Pública**
        *   Nome: `Public Read Access for Meal Photos`
        *   Operações: `SELECT`
        *   Perfis (Roles): `anon`, `authenticated`
        *   Usando expressão (USING): `true`
    *   **Política 2: Usuários Fazem Upload de Suas Próprias Fotos de Refeição**
        *   Nome: `Users can upload their own meal photos`
        *   Operações: `INSERT`
        *   Perfis (Roles): `authenticated`
        *   Com checagem (WITH CHECK): `auth.uid()::text = (storage.foldername(name))[2]`
    *   **Política 3: Usuários Deletam Suas Próprias Fotos de Refeição**
        *   Nome: `Users can delete their own meal photos`
        *   Operações: `DELETE`
        *   Perfis (Roles): `authenticated`
        *   Usando expressão (USING): `auth.uid()::text = (storage.foldername(name))[2]`

Isso deve cobrir a configuração do Storage.

