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
    *   **Public bucket**: **Deixe desmarcado** por enquanto. Vamos configurar políticas de acesso via SQL ou UI.
    *   Clique em "**Create bucket**".
3.  Clique em "**New bucket**" novamente para criar o segundo bucket:
    *   **Bucket name**: `meal-photos`
    *   **Public bucket**: **Deixe desmarcado** por enquanto.
    *   Clique em "**Create bucket**".

**Estrutura de Pastas Esperada no Storage:**
O código da aplicação (`storage.ts`) criará os caminhos da seguinte forma:
- Foto de perfil: `NOMEDOBBUCKET/users/{UID_DO_USUARIO}/profile.{EXTENSAO}`
- Foto de refeição: `NOMEDOBBUCKET/users/{UID_DO_USUARIO}/meals/{ID_UNICO_DA_FOTO}.{EXTENSAO}`
Isso significa que nas políticas de storage, `(storage.foldername(name))[1]` resultará em `users` e `(storage.foldername(name))[2]` resultará no `{UID_DO_USUARIO}`. Usaremos `(storage.foldername(name))[2]` para verificar a propriedade do usuário.

### Opção A: Configurar Políticas de Storage via Interface do Supabase

1.  Clique no bucket `profile-pictures` recém-criado e vá para a aba "**Policies**".
2.  Clique em "**New policy**" e escolha "**Create a new policy from scratch**".
3.  Crie as seguintes políticas para `profile-pictures`:

    *   **Política 1: Leitura Pública para Avatares**
        *   **Policy name**: `Public Read Access for Profile Pictures`
        *   **Allowed operations**: Marque `SELECT`.
        *   **Target roles**: Marque `anon`, `authenticated`.
        *   **Policy definition (USING expression)**: `true`
        *   Clique em "**Review**" e "**Save policy**".

    *   **Política 2: Usuários Gerenciam Suas Próprias Fotos de Perfil (INSERT, UPDATE, DELETE)**
        *   **Policy name**: `Users can manage their own profile pictures`
        *   **Allowed operations**: Marque `INSERT`, `UPDATE`, `DELETE`.
        *   **Target roles**: Marque `authenticated`.
        *   **Policy definition (USING expression para UPDATE/DELETE)**: `(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[2])`
        *   **Policy definition (WITH CHECK expression para INSERT/UPDATE)**: `(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[2])`
        *   Clique em "**Review**" e "**Save policy**".

4.  Repita o processo para o bucket `meal-photos`:

    *   **Política 1: Leitura Pública para Fotos de Refeição**
        *   **Policy name**: `Public Read Access for Meal Photos`
        *   **Allowed operations**: Marque `SELECT`.
        *   **Target roles**: Marque `anon`, `authenticated`.
        *   **Policy definition (USING expression)**: `true`

    *   **Política 2: Usuários Fazem Upload de Suas Próprias Fotos de Refeição (INSERT)**
        *   **Policy name**: `Users can upload their own meal photos`
        *   **Allowed operations**: Marque `INSERT`.
        *   **Target roles**: Marque `authenticated`.
        *   **Policy definition (WITH CHECK expression)**: `(bucket_id = 'meal-photos') AND (auth.uid()::text = (storage.foldername(name))[2])`

    *   **Política 3: Usuários Deletam Suas Próprias Fotos de Refeição (DELETE)** (Opcional, mas recomendado se a funcionalidade existir no app)
        *   **Policy name**: `Users can delete their own meal photos`
        *   **Allowed operations**: Marque `DELETE`.
        *   **Target roles**: Marque `authenticated`.
        *   **Policy definition (USING expression)**: `(bucket_id = 'meal-photos') AND (auth.uid()::text = (storage.foldername(name))[2])`

### Opção B: Configurar Políticas de Storage via SQL Editor

Se preferir, você pode criar as políticas de storage usando o SQL Editor. Vá para o SQL Editor no painel do Supabase e execute os seguintes scripts. **Certifique-se de que os buckets `profile-pictures` e `meal-photos` já foram criados pela UI como descrito acima.**

```sql
-- Políticas para o bucket 'profile-pictures'

-- 1. Permite que qualquer pessoa leia (SELECT) fotos de perfil
CREATE POLICY "Public Read Access for Profile Pictures"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-pictures');

-- 2. Permite que usuários autenticados insiram (INSERT) suas próprias fotos de perfil
-- A estrutura de pasta esperada é 'users/USER_ID/filename.ext'
CREATE POLICY "Users can insert their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2] -- Checa se o segundo nível da pasta é o UID do usuário
);

-- 3. Permite que usuários autenticados atualizem (UPDATE) suas próprias fotos de perfil
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- 4. Permite que usuários autenticados deletem (DELETE) suas próprias fotos de perfil
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
);


-- Políticas para o bucket 'meal-photos'

-- 1. Permite que qualquer pessoa leia (SELECT) fotos de refeições
CREATE POLICY "Public Read Access for Meal Photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'meal-photos');

-- 2. Permite que usuários autenticados insiram (INSERT) suas próprias fotos de refeições
-- A estrutura de pasta esperada é 'users/USER_ID/meals/filename.ext'
CREATE POLICY "Users can upload their own meal photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-photos' AND
  auth.uid()::text = (storage.foldername(name))[2] -- Checa se o segundo nível da pasta é o UID do usuário
);

-- 3. Permite que usuários autenticados deletem (DELETE) suas próprias fotos de refeições (se a funcionalidade for implementada no app)
CREATE POLICY "Users can delete their own meal photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```
**Nota sobre `(storage.foldername(name))[2]`**: Esta função extrai o nome da segunda pasta no caminho do arquivo. A aplicação está configurada para salvar arquivos em `users/{user_id}/...`, então `(storage.foldername(name))[1]` seria "users" e `(storage.foldername(name))[2]` seria o ID do usuário.

## Passo 6: Configurações de Autenticação no Supabase

1.  No painel do seu projeto Supabase, vá para **Authentication** (ícone de escudo).
2.  **Providers**:
    *   **Email** já deve estar habilitado por padrão. Você pode configurar outras opções aqui se desejar (Google, GitHub, etc.), mas a aplicação Next.js está configurada apenas para Email/Senha por enquanto.
3.  **Settings**:
    *   **Confirm email**: Por padrão, isso geralmente está habilitado. Isso significa que os usuários precisarão confirmar o email antes de poderem fazer login. Para desenvolvimento, você pode querer desabilitar temporariamente para facilitar os testes. Lembre-se de habilitá-lo para produção.
    *   **Redirect URLs**: Configure o "Site URL" (geralmente `http://localhost:3000` para desenvolvimento, ou a URL da sua aplicação em produção) e "Additional Redirect URLs" se necessário para o fluxo de autenticação (ex: links de confirmação de email, reset de senha). A URL base é importante para que os links mágicos de confirmação funcionem.
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
    *   Verifique as políticas do bucket (seja via UI ou SQL). A mensagem de erro do Supabase geralmente é informativa.
    *   Verifique o tamanho do arquivo e os tipos permitidos (se configurado).
    *   Confirme que a estrutura de pastas (`users/UID_DO_USUARIO/...`) está sendo respeitada pelo código de upload e que as políticas correspondem a essa estrutura.

Seguindo estes passos, você deverá ter seu projeto Supabase configurado e conectado corretamente à sua aplicação GlicemiaAI, incluindo o uso do Storage! Se tiver mais dúvidas ou problemas, me diga.
