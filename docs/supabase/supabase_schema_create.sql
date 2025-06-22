--------------------------------------------------------------------------------
-- GlicemiaAI - SCRIPT DE CRIAÇÃO DO ESQUEMA COMPLETO DO BANCO DE DADOS
--
-- Este script irá:
-- 1.  Criar todas as tabelas necessárias para a aplicação (`profiles`, `glucose_readings`, `insulin_logs`, `meal_analyses`, `reminders`, `activity_logs`, `medication_logs`).
-- 2.  Configurar a Segurança a Nível de Linha (RLS - Row Level Security) em todas as tabelas para garantir que os usuários só possam acessar seus próprios dados.
-- 3.  Criar uma função e um trigger para criar automaticamente um perfil para novos usuários na tabela `profiles`.
-- 4.  Adicionar comentários em todas as tabelas e colunas importantes para documentação.
--
-- INSTRUÇÕES DE USO:
-- 1.  Navegue até o SQL Editor no seu painel Supabase.
-- 2.  Copie e cole TODO o conteúdo deste arquivo.
-- 3.  Clique em "RUN".
--
-- NOTA: Se você já possui tabelas antigas, é recomendado apagá-las primeiro
-- usando o script `supabase_schema_drop.sql` para garantir um estado limpo.
--------------------------------------------------------------------------------

-- Tabela `profiles`
-- Armazena dados públicos e preferências dos usuários.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    diabetes_type TEXT,
    language_preference TEXT DEFAULT 'pt-BR',
    target_glucose_low NUMERIC,
    target_glucose_high NUMERIC,
    hypo_glucose_threshold NUMERIC,
    hyper_glucose_threshold NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Stores user-specific public information and preferences.';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users.id';

-- Habilitar RLS para a tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para profiles
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Função para criar um perfil para um novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função handle_new_user após cada novo cadastro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Apaga o trigger antigo se existir
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Opção para Atualizar a Tabela `profiles` Existente (se você não quiser apagar)
-- Execute apenas os comandos ALTER TABLE abaixo se a sua tabela `profiles` já existe mas não tem as colunas de metas.
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_glucose_low NUMERIC;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_glucose_high NUMERIC;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hypo_glucose_threshold NUMERIC;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hyper_glucose_threshold NUMERIC;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'pt-BR';


--------------------------------------------------------------------------------

-- Tabela `glucose_readings`
-- Armazena os registros de glicemia.
CREATE TABLE public.glucose_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    meal_context TEXT,
    notes TEXT,
    level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.glucose_readings IS 'Stores user blood glucose readings.';

-- Habilitar RLS para glucose_readings
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para glucose_readings
CREATE POLICY "Users can manage their own glucose readings."
ON public.glucose_readings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------

-- Tabela `insulin_logs`
-- Armazena os registros de doses de insulina.
CREATE TABLE public.insulin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    dose NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.insulin_logs IS 'Stores user insulin dose logs.';

-- Habilitar RLS para insulin_logs
ALTER TABLE public.insulin_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para insulin_logs
CREATE POLICY "Users can manage their own insulin logs."
ON public.insulin_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------

-- Tabela `activity_logs`
-- Armazena os registros de atividades físicas.
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activity_type TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    intensity TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.activity_logs IS 'Stores user physical activity logs.';

-- Habilitar RLS para activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para activity_logs
CREATE POLICY "Users can manage their own activity logs."
ON public.activity_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------

-- Tabela `medication_logs`
-- Armazena os registros de outros medicamentos.
CREATE TABLE public.medication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.medication_logs IS 'Stores logs of other medications taken by users.';

-- Habilitar RLS para medication_logs
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para medication_logs
CREATE POLICY "Users can manage their own medication logs."
ON public.medication_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------

-- Tabela `meal_analyses`
-- Armazena os resultados das análises de refeição da IA.
CREATE TABLE public.meal_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    image_url TEXT,
    original_image_file_name TEXT,
    food_identification TEXT NOT NULL,
    macronutrient_estimates JSONB NOT NULL,
    estimated_glucose_impact TEXT NOT NULL,
    suggested_insulin_dose TEXT NOT NULL,
    improvement_tips TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.meal_analyses IS 'Stores results from AI meal analysis.';

-- Habilitar RLS para meal_analyses
ALTER TABLE public.meal_analyses ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para meal_analyses
CREATE POLICY "Users can manage their own meal analyses."
ON public.meal_analyses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------

-- Tabela `reminders`
-- Armazena as configurações de lembretes.
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    time TIME NOT NULL,
    days JSONB NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    insulin_type TEXT,
    insulin_dose NUMERIC,
    is_simulated_call BOOLEAN,
    simulated_call_contact TEXT,
    custom_sound TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.reminders IS 'Stores user-configured reminders.';

-- Habilitar RLS para reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para reminders
CREATE POLICY "Users can manage their own reminders."
ON public.reminders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- FIM DO SCRIPT
--------------------------------------------------------------------------------
