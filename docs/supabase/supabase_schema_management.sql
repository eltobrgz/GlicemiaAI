-- #####################################################################
-- # ATENÇÃO: ESTE ARQUIVO CONTÉM SCRIPTS DE GERENCIAMENTO DE ESQUEMA #
-- # USE COM CUIDADO, ESPECIALMENTE EM AMBIENTES DE PRODUÇÃO.       #
-- # FAÇA BACKUP DOS SEUS DADOS ANTES DE EXECUTAR ESTES SCRIPTS.     #
-- #####################################################################

-- #####################################################################
-- # SCRIPT 1: APAGAR COMPLETAMENTE TODAS AS TABELAS DA APLICAÇÃO    #
-- #####################################################################
-- Descomente e execute as linhas abaixo PARA APAGAR todas as tabelas e
-- objetos relacionados (funções, triggers) da aplicação GlicemiaAI.
-- ISSO RESULTARÁ NA PERDA DE TODOS OS DADOS CONTIDOS NESSAS TABELAS.

/*
-- Remover trigger e função primeiro se existirem, para evitar erros ao dropar 'profiles'
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Dropar as tabelas da aplicação
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.meal_analyses CASCADE;
DROP TABLE IF EXISTS public.insulin_logs CASCADE;
DROP TABLE IF EXISTS public.glucose_readings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

SELECT 'Todas as tabelas da aplicação GlicemiaAI foram apagadas (se existiam).';
*/

-- #####################################################################
-- # SCRIPT 2: CRIAR (OU RECRIAR) TODAS AS TABELAS DA APLICAÇÃO      #
-- # COM A VERSÃO MAIS RECENTE DO ESQUEMA                            #
-- #####################################################################
-- Execute as linhas abaixo para criar todas as tabelas necessárias para
-- a aplicação GlicemiaAI. Se você executou o SCRIPT 1 antes,
-- este script recriará o esquema do zero.

-- 0. GARANTIR QUE AS EXTENSÕES NECESSÁRIAS ESTÃO HABILITADAS
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Necessária para bcrypt no script de povoamento
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Necessária para uuid_generate_v4()

-- 1. Tabela de Perfis (profiles)
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

-- Trigger para criar um perfil quando um novo usuário se cadastra (em auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public -- Importante para segurança
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, language_preference, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name', -- Espera 'full_name' no metadata do signUp
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'language_preference', -- Espera 'language_preference'
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Tabela de Leituras de Glicemia (glucose_readings)
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


-- 3. Tabela de Registros de Insulina (insulin_logs)
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


-- 4. Tabela de Análises de Refeição (meal_analyses)
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


-- 5. Tabela de Lembretes (reminders)
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
-- RLS para activity_logs:
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own activity logs." ON public.activity_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

SELECT 'Esquema da aplicação GlicemiaAI criado/atualizado com sucesso.';

-- FIM DO SCRIPT DE CRIAÇÃO DE TABELAS
