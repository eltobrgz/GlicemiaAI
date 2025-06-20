
-- supabase_data_management.sql

-- ATENÇÃO:
-- Rodar estes scripts diretamente no SQL Editor do Supabase.
-- O SCRIPT 1 é DESTRUTIVO e apagará todos os dados dos usuários e seus registros.
-- O SCRIPT 2 populará o banco com dados de exemplo.

--------------------------------------------------------------------------------
-- SCRIPT 1: DELETAR TODOS OS DADOS DA APLICAÇÃO (USUÁRIOS E SEUS REGISTROS)
--------------------------------------------------------------------------------
-- AVISO: Este script é DESTRUTIVO. Ele removerá todos os usuários
-- e, devido às configurações de ON DELETE CASCADE, todos os dados associados
-- nas tabelas: profiles, glucose_readings, insulin_logs, meal_analyses, reminders, activity_logs.
-- USE COM EXTREMO CUIDADO. FAÇA BACKUP SE NECESSÁRIO.

-- Para executar a deleção, DESCOMENTE a linha abaixo:
-- DELETE FROM auth.users;

-- SELECT 'TODOS OS DADOS DA APLICAÇÃO (INCLUINDO USUÁRIOS) FORAM DELETADOS SE A LINHA "DELETE FROM auth.users;" FOI DESCOMENTADA E EXECUTADA.' AS resultado_script_1;


--------------------------------------------------------------------------------
-- SCRIPT 2: POVOAR O BANCO DE DADOS COM DADOS DE EXEMPLO
--------------------------------------------------------------------------------
-- Este script irá:
-- 1. Criar 3 usuários fictícios (Ana Silva, Bruno Costa, Charles Smith).
--    - As senhas serão 'password123' para todos.
--    - Assume que o trigger `handle_new_user` está ativo para criar entradas em `profiles`.
-- 2. Preencher dados de perfil para esses usuários.
-- 3. Adicionar registros de glicemia, insulina, análises de refeição, atividades e lembretes.

DO $$
DECLARE
    user_ana_id uuid := uuid_generate_v4();
    user_bruno_id uuid := uuid_generate_v4();
    user_charles_id uuid := uuid_generate_v4();
    fixed_bcrypt_hash text := '$2a$10$3V.xH.L.c5lLx.XmZQz7W.D9Y.xP.G.zY0Z.O.I.Z.t6j8p.H.40m'; -- Hash para 'password123'
BEGIN

    -- 1. Criar Usuários Fictícios em auth.users
    -- (O trigger handle_new_user deve criar os perfis básicos)

    -- Usuário 1: Ana Silva
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        recovery_token, recovery_sent_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_sent_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_ana_id, 'authenticated', 'authenticated', 'ana.silva@example.com', fixed_bcrypt_hash, now(),
        NULL, NULL, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Ana Silva', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=AS'),
        now(), now(), NULL, '', NULL
    );

    -- Usuário 2: Bruno Costa
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        recovery_token, recovery_sent_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_sent_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_bruno_id, 'authenticated', 'authenticated', 'bruno.costa@example.com', fixed_bcrypt_hash, now(),
        NULL, NULL, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Bruno Costa', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=BC'),
        now(), now(), NULL, '', NULL
    );

    -- Usuário 3: Charles Smith
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        recovery_token, recovery_sent_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_sent_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_charles_id, 'authenticated', 'authenticated', 'charles.smith@example.com', fixed_bcrypt_hash, now(),
        NULL, NULL, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Charles Smith', 'language_preference', 'en-US', 'avatar_url', 'https://placehold.co/150x150.png?text=CS'),
        now(), now(), NULL, '', NULL
    );

    -- 2. Atualizar Perfis em public.profiles
    -- (Estes foram criados pelo trigger, agora vamos adicionar mais detalhes)
    UPDATE public.profiles SET
        name = 'Ana Silva',
        email = 'ana.silva@example.com',
        avatar_url = 'https://placehold.co/150x150.png?text=AS',
        date_of_birth = '1985-05-15',
        diabetes_type = 'tipo1',
        language_preference = 'pt-BR',
        target_glucose_low = 80,
        target_glucose_high = 160,
        hypo_glucose_threshold = 70,
        hyper_glucose_threshold = 200,
        updated_at = now()
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
        hyper_glucose_threshold = 250,
        updated_at = now()
    WHERE id = user_bruno_id;

    UPDATE public.profiles SET
        name = 'Charles Smith',
        email = 'charles.smith@example.com',
        avatar_url = 'https://placehold.co/150x150.png?text=CS',
        date_of_birth = '1978-02-10',
        diabetes_type = 'outro', -- Ex: LADA ou não especificado
        language_preference = 'en-US',
        target_glucose_low = 70,
        target_glucose_high = 150,
        hypo_glucose_threshold = 65,
        hyper_glucose_threshold = 180,
        updated_at = now()
    WHERE id = user_charles_id;


    -- 3. Adicionar Registros de Glicemia (glucose_readings)
    -- Ana Silva
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_ana_id, 95, now() - interval '1 day' - interval '10 hours', 'jejum', 'Acordei bem', 'normal'),
    (user_ana_id, 150, now() - interval '1 day' - interval '7 hours', 'depois_refeicao', 'Almoço com macarrão', 'normal'),
    (user_ana_id, 185, now() - interval '1 day' - interval '2 hours', 'depois_refeicao', 'Jantar leve', 'alta'),
    (user_ana_id, 65, now() - interval '23 hours', 'outro', 'Durante caminhada', 'baixa'),
    (user_ana_id, 110, now() - interval '20 hours', 'jejum', 'Manhã seguinte', 'normal');

    -- Bruno Costa
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES
    (user_bruno_id, 130, now() - interval '1 day' - interval '12 hours', 'jejum', 'normal'),
    (user_bruno_id, 220, now() - interval '1 day' - interval '9 hours', 'depois_refeicao', 'alta'),
    (user_bruno_id, 160, now() - interval '1 day' - interval '4 hours', 'antes_refeicao', 'normal');


    -- 4. Adicionar Registros de Insulina (insulin_logs)
    -- Ana Silva
    INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES
    (user_ana_id, 'Rápida (Lispro)', 8, now() - interval '1 day' - interval '7 hours' + interval '5 minutes'),
    (user_ana_id, 'Lenta (Glargina)', 20, now() - interval '1 day' - interval '1 hours');

    -- Bruno Costa
    INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES
    (user_bruno_id, 'Pré-misturada', 25, now() - interval '1 day' - interval '12 hours' + interval '10 minutes');


    -- 5. Adicionar Análises de Refeição (meal_analyses)
    -- Ana Silva
    INSERT INTO public.meal_analyses (user_id, timestamp, image_url, original_image_file_name, food_identification, macronutrient_estimates, estimated_glucose_impact, suggested_insulin_dose, improvement_tips) VALUES
    (user_ana_id, now() - interval '1 day' - interval '7 hours', 'https://placehold.co/600x400.png?text=AlmocoAna', 'almoco_ana.jpg',
     'Prato de macarrão à bolonhesa com salada verde.',
     '{"carbohydrates": 70, "protein": 30, "fat": 25}',
     'Pode causar uma elevação significativa na glicemia nas próximas 1-2 horas devido à quantidade de carboidratos do macarrão.',
     'Considerar 7-9 unidades de insulina rápida, dependendo da sua relação carboidrato/insulina e sensibilidade atual.',
     'Adicionar mais fibras (ex: vegetais cozidos) pode ajudar a modular a absorção dos carboidratos. Controlar a porção do macarrão.');

    -- Charles Smith (para testar a interface de análise de refeição sem dados prévios)
    -- Sem análises de refeição para Charles por enquanto.


    -- 6. Adicionar Lembretes (reminders)
    -- Ana Silva
    INSERT INTO public.reminders (user_id, type, name, time, days, enabled, insulin_type, insulin_dose) VALUES
    (user_ana_id, 'glicemia', 'Glicemia Jejum', '07:30:00', 'todos_os_dias', true, NULL, NULL),
    (user_ana_id, 'insulina', 'Insulina Basal Noite', '22:00:00', 'todos_os_dias', true, 'Lenta (Glargina)', 20),
    (user_ana_id, 'glicemia', 'Glicemia Pós-Almoço', '14:30:00', '["Seg", "Qua", "Sex"]', true, NULL, NULL);

    -- Bruno Costa
    INSERT INTO public.reminders (user_id, type, name, time, days, enabled, is_simulated_call, simulated_call_contact) VALUES
    (user_bruno_id, 'insulina', 'Insulina Manhã', '08:00:00', 'todos_os_dias', true, true, 'Dr. Diabetes');


    -- 7. Adicionar Registros de Atividade Física (activity_logs)
    -- Ana Silva
    INSERT INTO public.activity_logs (user_id, timestamp, activity_type, duration_minutes, intensity, notes) VALUES
    (user_ana_id, now() - interval '25 hours', 'caminhada', 45, 'moderada', 'Caminhada no parque, ritmo bom.'),
    (user_ana_id, now() - interval '3 hours', 'yoga_pilates', 60, 'leve', 'Aula de Yoga relaxante.');

    -- Bruno Costa
    INSERT INTO public.activity_logs (user_id, timestamp, activity_type, duration_minutes, intensity) VALUES
    (user_bruno_id, now() - interval '50 hours', 'musculacao', 70, 'intensa');

    RAISE NOTICE '-----------------------------------------------------------------------';
    RAISE NOTICE 'BANCO DE DADOS POVOADO COM DADOS DE EXEMPLO!';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Credenciais de Login (senha para todos: password123):';
    RAISE NOTICE '1. Ana Silva: ana.silva@example.com (ID: %)', user_ana_id;
    RAISE NOTICE '2. Bruno Costa: bruno.costa@example.com (ID: %)', user_bruno_id;
    RAISE NOTICE '3. Charles Smith: charles.smith@example.com (ID: %)', user_charles_id;
    RAISE NOTICE '-----------------------------------------------------------------------';

END $$;

SELECT 'SCRIPT DE POVOAMENTO CONCLUÍDO. VERIFIQUE OS LOGS PARA CREDENCIAIS.' AS resultado_script_2;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
_xcontent_name
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile." ON public.
profile
s FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Opcional: Trigger para criar um perfil quando um novo usuário se cadastra (em auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, language_preference)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    new.raw_user_meta_data->>'language_preference'
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

**Importante sobre RLS**: As políticas de Row Level Security são essenciais. Sem elas, qualquer usuário com a chave `anon public` poderia, teoricamente, acessar dados de outros usuários. As políticas acima garantem que os usuários só possam interagir com seus próprios registros.

**Importante sobre a Trigger `handle_new_user`**:
Se você executar esta trigger:
*   Ela criará automaticamente uma entrada na tabela `profiles` quando um novo usuário se cadastrar através do sistema de autenticação do Supabase.
*   Ela espera que `full_name` (e opcionalmente `avatar_url` e `language_preference`) seja passado no campo `options: { data: { full_name: 'Nome do Usuario', language_preference: 'pt-BR' } }` durante a chamada de `supabase.auth.signUp()` no seu frontend.
*   Se você já tem usuários, talvez precise adicionar manualmente os novos campos (`target_glucose_low`, etc.) aos perfis existentes ou definir valores padrão.

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
            *   **Policy definition (USING expression para UPDATE/DELETE)**: `(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[2])`
            *   **Policy definition (WITH CHECK expression para INSERT/UPDATE)**: `(bucket_id = 'profile-pictures') AND (auth.uid()::text = (storage.foldername(name))[2])`
            *   Clique em "**Review**" e "**Save policy**".

4.  Repita o processo para o bucket `meal-photos`:
    *   **Tornar o Bucket Público (se necessário):** Siga o passo 2 acima para o bucket `meal-photos`. Teste a URL pública no navegador.
    *   **Configurar Políticas de Objeto:**
        *   **Política 1: Leitura Pública para Fotos de Refeição** (Mesma configuração da Política 1 de `profile-pictures`, mas com `bucket_id = 'meal-photos'`)
        *   **Política 2: Usuários Fazem Upload de Suas Próprias Fotos de Refeição (INSERT)** (Mesma configuração da Política 2 de `profile-pictures` para INSERT, mas com `bucket_id = 'meal-photos'`)
        *   **Política 3: Usuários Deletam Suas Próprias Fotos de Refeição (DELETE)** (Mesma configuração da Política 2 de `profile-pictures` para DELETE, mas com `bucket_id = 'meal-photos'`)

#### Opção B: Configurar Políticas de Storage via SQL Editor (Apenas para RLS dos Objetos)

Se preferir, você pode criar as políticas RLS dos objetos usando o SQL Editor. **Isso NÃO tornará o bucket público em si; isso ainda precisa ser feito pela UI se você estiver recebendo "Bucket not found" para URLs `/object/public/`.**

```sql
-- Políticas para o bucket 'profile-pictures'
CREATE POLICY "Public Read Access for Profile Pictures" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'profile-pictures');
CREATE POLICY "Users can insert their own profile pictures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users can update their own profile pictures" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[2]) WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Políticas para o bucket 'meal-photos'
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
