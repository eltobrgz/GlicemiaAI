
-- #####################################################################
-- # SCRIPT PARA CRIAR (OU RECRIAR) TODAS AS TABELAS DA APLICAÇÃO     #
-- #####################################################################
-- Este script cria todas as tabelas necessárias para a aplicação GlicemiaAI,
-- incluindo as políticas de Row Level Security (RLS) e a trigger para
-- criar um perfil de usuário automaticamente.
--
-- ATENÇÃO: Se você já possui tabelas com esses nomes e dados importantes,
-- execute o script supabase_schema_drop.sql PRIMEIRO para limpar o esquema
-- ou faça um BACKUP dos seus dados.
-- #####################################################################


-- 1. Habilitar extensão pgcrypto se não estiver habilitada (para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- 2. Tabela de Perfis (profiles)
-- Armazena informações adicionais do usuário.
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE, -- Chave estrangeira para auth.users
  name text,
  email text UNIQUE, -- Pode ser sincronizado do auth.users
  avatar_url text,
  date_of_birth date,
  diabetes_type text, -- 'tipo1', 'tipo2', 'gestacional', 'outro'
  language_preference text DEFAULT 'pt-BR', -- e.g., 'pt-BR', 'en-US'
  target_glucose_low integer,
  target_glucose_high integer,
  hypo_glucose_threshold integer,
  hyper_glucose_threshold integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para profiles:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending auth.users.';

-- 3. Tabela de Leituras de Glicemia (glucose_readings)
CREATE TABLE public.glucose_readings (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  value integer NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  meal_context text, -- 'antes_refeicao', 'depois_refeicao', 'jejum', 'outro'
  notes text,
  level text, -- 'baixa', 'normal', 'alta', 'muito_alta' - Classificado na aplicação
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para glucose_readings:
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own glucose readings." ON public.glucose_readings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
COMMENT ON TABLE public.glucose_readings IS 'Stores blood glucose readings for users.';

-- 4. Tabela de Registros de Insulina (insulin_logs)
CREATE TABLE public.insulin_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL,
  dose numeric(5,1) NOT NULL, -- Ex: 10.5 unidades
  timestamp timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para insulin_logs:
ALTER TABLE public.insulin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own insulin logs." ON public.insulin_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
COMMENT ON TABLE public.insulin_logs IS 'Stores insulin administration logs for users.';

-- 5. Tabela de Análises de Refeição (meal_analyses)
CREATE TABLE public.meal_analyses (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  timestamp timestamp with time zone NOT NULL,
  image_url text,
  original_image_file_name text,
  food_identification text NOT NULL,
  macronutrient_estimates jsonb, -- { "carbohydrates": number, "protein": number, "fat": number }
  estimated_glucose_impact text,
  suggested_insulin_dose text,
  improvement_tips text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para meal_analyses:
ALTER TABLE public.meal_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own meal analyses." ON public.meal_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
COMMENT ON TABLE public.meal_analyses IS 'Stores AI-powered meal analysis results.';

-- 6. Tabela de Lembretes (reminders)
CREATE TABLE public.reminders (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL, -- 'glicemia' or 'insulina'
  name text NOT NULL,
  "time" time without time zone NOT NULL, -- HH:MM:SS
  days jsonb NOT NULL, -- Array de strings ['Seg', 'Ter'] ou string 'todos_os_dias'
  enabled boolean DEFAULT true NOT NULL,
  insulin_type text,
  insulin_dose numeric(5,1),
  is_simulated_call boolean DEFAULT false,
  simulated_call_contact text,
  custom_sound text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS para reminders:
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own reminders." ON public.reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
COMMENT ON TABLE public.reminders IS 'Stores user-configured reminders for glucose/insulin.';

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
COMMENT ON TABLE public.activity_logs IS 'Stores physical activity logs for users.';


-- 8. Função e Trigger para criar perfil automaticamente ao criar novo usuário no Supabase Auth
-- Drop a trigger e a função se já existirem para evitar erros ao rodar o script múltiplas vezes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, language_preference, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name', -- Pega 'full_name' do metadata, se disponível
    NEW.raw_user_meta_data->>'avatar_url', -- Pega 'avatar_url' do metadata, se disponível
    'pt-BR', -- Define um idioma padrão
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile upon new user signup in auth.users.';

RAISE NOTICE 'GlicemiaAI: Esquema do banco de dados e RLS configurados com sucesso!';
RAISE NOTICE 'GlicemiaAI: Trigger on_auth_user_created configurada para popular a tabela de perfis.';

-- FIM DO SCRIPT
