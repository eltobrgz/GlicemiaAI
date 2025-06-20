-- #####################################################################
-- # SCRIPT PARA CRIAR (OU RECRIAR) TODAS AS TABELAS DA APLICAÇÃO     #
-- #####################################################################
-- Este script define o esquema completo do banco de dados para a aplicação GlicemiaAI.
-- Certifique-se de que todas as tabelas referenciadas (como auth.users) já existem
-- ou são criadas pelo Supabase automaticamente.

-- Habilitar a extensão pgcrypto se ainda não estiver habilitada (necessária para uuid_generate_v4 se não for padrão)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Perfis de Usuário (profiles)
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  email text UNIQUE,
  avatar_url text,
  date_of_birth date,
  diabetes_type text, -- 'tipo1', 'tipo2', 'gestacional', 'outro'
  language_preference text DEFAULT 'pt-BR',
  target_glucose_low integer,
  target_glucose_high integer,
  hypo_glucose_threshold integer,
  hyper_glucose_threshold integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Stores public user profile information.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, references auth.users.id.';
COMMENT ON COLUMN public.profiles.diabetes_type IS 'Type of diabetes: tipo1, tipo2, gestacional, outro.';
COMMENT ON COLUMN public.profiles.language_preference IS 'User preferred language (e.g., pt-BR, en-US).';
COMMENT ON COLUMN public.profiles.target_glucose_low IS 'User defined target low glucose level (mg/dL).';
COMMENT ON COLUMN public.profiles.target_glucose_high IS 'User defined target high glucose level (mg/dL).';
COMMENT ON COLUMN public.profiles.hypo_glucose_threshold IS 'User defined hypoglycemia threshold (mg/dL).';
COMMENT ON COLUMN public.profiles.hyper_glucose_threshold IS 'User defined hyperglycemia threshold (mg/dL).';


-- RLS para profiles:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger para manter profiles.updated_at atualizado
CREATE OR REPLACE FUNCTION public.handle_profile_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_profile_update_timestamp();

-- Trigger para criar um perfil quando um novo usuário se registra no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, language_preference, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'language_preference', 'pt-BR'), -- Define 'pt-BR' como padrão se não especificado
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Tabela de Leituras de Glicemia (glucose_readings)
CREATE TABLE public.glucose_readings (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  value integer NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  meal_context text, -- 'antes_refeicao', 'depois_refeicao', 'jejum', 'outro'
  notes text,
  level text, -- 'baixa', 'normal', 'alta', 'muito_alta' (calculado na aplicação)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.glucose_readings IS 'Stores glucose readings for users.';
COMMENT ON COLUMN public.glucose_readings.meal_context IS 'Context of the meal relative to the reading.';
COMMENT ON COLUMN public.glucose_readings.level IS 'Classification of the glucose level (baixa, normal, alta, muito_alta).';

-- RLS para glucose_readings:
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own glucose readings." ON public.glucose_readings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. Tabela de Registros de Insulina (insulin_logs)
CREATE TABLE public.insulin_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL,
  dose numeric(5,1) NOT NULL, -- Permite doses como 10.5
  timestamp timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.insulin_logs IS 'Stores insulin administration logs for users.';
COMMENT ON COLUMN public.insulin_logs.dose IS 'Insulin dose in units, allows for decimal values.';

-- RLS para insulin_logs:
ALTER TABLE public.insulin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own insulin logs." ON public.insulin_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 4. Tabela de Análises de Refeição (meal_analyses)
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
COMMENT ON TABLE public.meal_analyses IS 'Stores AI-driven meal analyses.';
COMMENT ON COLUMN public.meal_analyses.macronutrient_estimates IS 'JSON object with macronutrient estimates.';

-- RLS para meal_analyses:
ALTER TABLE public.meal_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meal analyses." ON public.meal_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 5. Tabela de Lembretes (reminders)
CREATE TABLE public.reminders (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL, -- 'glicemia' or 'insulina'
  name text NOT NULL,
  time time without time zone NOT NULL, -- HH:MM:SS
  days jsonb NOT NULL, -- Array of strings (days of week) or 'todos_os_dias'
  enabled boolean DEFAULT true NOT NULL,
  insulin_type text,
  insulin_dose numeric(5,1),
  is_simulated_call boolean,
  simulated_call_contact text,
  custom_sound text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.reminders IS 'Stores user-configured reminders.';
COMMENT ON COLUMN public.reminders.days IS 'Days of the week for the reminder, as JSON array or "todos_os_dias".';

-- RLS para reminders:
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders." ON public.reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 6. Tabela de Registros de Atividade Física (activity_logs)
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
COMMENT ON TABLE public.activity_logs IS 'Stores physical activity logs for users.';
COMMENT ON COLUMN public.activity_logs.intensity IS 'Intensity of the activity: leve, moderada, intensa.';

-- RLS para activity_logs:
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own activity logs." ON public.activity_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

SELECT 'Schema creation script completed.';
