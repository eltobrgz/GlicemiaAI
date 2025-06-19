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
  avatar_url text,
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
  image_url text,
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

## Passo 5: Configurações de Autenticação no Supabase

1.  No painel do seu projeto Supabase, vá para **Authentication** (ícone de escudo).
2.  **Providers**:
    *   **Email** já deve estar habilitado por padrão. Você pode configurar outras opções aqui se desejar (Google, GitHub, etc.), mas a aplicação Next.js está configurada apenas para Email/Senha por enquanto.
3.  **Settings**:
    *   **Confirm email**: Por padrão, isso geralmente está habilitado. Isso significa que os usuários precisarão confirmar o email antes de poderem fazer login. Para desenvolvimento, você pode querer desabilitar temporariamente para facilitar os testes. Lembre-se de habilitá-lo para produção.
    *   **Redirect URLs**: Configure o "Site URL" (geralmente `http://localhost:3000` para desenvolvimento) e "Additional Redirect URLs" se necessário para o fluxo de autenticação (ex: links de confirmação de email, reset de senha).
4.  **Email Templates**: Personalize os templates de email (Confirmação, Reset de Senha, etc.) para que correspondam à identidade visual da sua aplicação.

## Passo 6: Reiniciar a Aplicação Next.js

Se sua aplicação Next.js estiver rodando, **pare-a e reinicie-a completamente**.
Isso é crucial para que ela carregue as variáveis de ambiente do arquivo `.env.local`.

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

## Passo 7: Testar a Integração

1.  Tente se cadastrar com um novo usuário.
2.  Verifique se o usuário foi criado na seção "Authentication" -> "Users" do seu painel Supabase.
3.  Verifique se um perfil foi criado na tabela `profiles` (você pode usar o "Table Editor" no Supabase para isso).
4.  Tente fazer login com o usuário cadastrado.
5.  Teste todas as funcionalidades que salvam e buscam dados:
    *   Registrar e visualizar glicemias.
    *   Registrar e visualizar doses de insulina.
    *   Analisar refeições.
    *   Configurar e visualizar lembretes.
    *   Visualizar e editar o perfil do usuário.

## Solução de Problemas Comuns

*   **Erro "Missing env.NEXT_PUBLIC_SUPABASE_..."**:
    *   Verifique se o arquivo `.env.local` está na raiz do projeto.
    *   Verifique se os nomes das variáveis (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) estão corretos.
    *   Verifique se os valores das chaves estão corretos e não contêm erros de digitação.
    *   **REINICIE O SERVIDOR NEXT.JS.**
*   **Erros de Permissão (RLS)**: Se você receber erros indicando que não tem permissão para acessar ou modificar dados, verifique suas políticas de RLS nas tabelas do Supabase. Certifique-se de que elas permitem que usuários autenticados (`auth.uid() = user_id`) realizem as operações necessárias.
*   **Erro "fetch failed" ou de rede**: Verifique se a "Project URL" do Supabase está correta no seu `.env.local` e se seu projeto Supabase está ativo e acessível.

Seguindo estes passos, você deverá ter seu projeto Supabase configurado e conectado corretamente à sua aplicação GlicemiaAI! Se tiver mais dúvidas ou problemas, me diga.
