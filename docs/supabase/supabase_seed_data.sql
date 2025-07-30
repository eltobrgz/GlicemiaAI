
-- =================================================================================================
-- ||                                                                                             ||
-- ||                           GlicemiaAI - SCRIPT DE POVOAMENTO DE DADOS                          ||
-- ||                                                                                             ||
-- =================================================================================================
--
--  Este script irá:
--  1. Criar 3 usuários de teste no sistema de autenticação do Supabase.
--  2. Criar os perfis correspondentes para esses usuários na tabela `profiles`.
--  3. Povoar as tabelas `glucose_readings`, `insulin_logs`, `medication_logs`, `activity_logs`
--     com centenas de registros de exemplo para os últimos 90 dias.
--
--  COMO USAR:
--  1. Certifique-se de que você já executou `supabase_schema_create.sql` para criar as tabelas.
--  2. No seu painel do Supabase, vá para o "SQL Editor".
--  3. Copie e cole todo o conteúdo deste arquivo em uma nova query.
--  4. Clique em "RUN".
--
--  CREDENCIAS DE LOGIN (após executar o script):
--  - Email: ana.silva@example.com      | Senha: password123
--  - Email: bruno.costa@example.com    | Senha: password123
--  - Email: carla.dias@example.com     | Senha: password123
--
--  AVISO: Use este script apenas em ambiente de desenvolvimento/teste.
--         Ele apaga registros existentes para os usuários de teste antes de inserir novos dados.

-- Início da transação para garantir que tudo seja executado ou nada
BEGIN;

-- Desabilitar RLS temporariamente para o superusuário poder inserir dados
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_readings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.insulin_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;

-- =================================================================
--                      CRIAR USUÁRIOS DE TESTE
-- =================================================================
-- Usaremos UUIDs fixos para garantir a consistência entre execuções do script.
-- Você pode gerar novos UUIDs se precisar (ex: no site https://www.uuidgenerator.net/)

-- -- User 1: Ana Silva (T1D, usuária detalhista)
-- -- User 2: Bruno Costa (T2D, focado em medicamentos)
-- -- User 3: Carla Dias (Gestacional, focada em refeições)

DO $$
DECLARE
    user_ana_id UUID := '00000000-0000-0000-0000-000000000001';
    user_bruno_id UUID := '00000000-0000-0000-0000-000000000002';
    user_carla_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
    -- Deletar usuários existentes para evitar conflitos (e seus dados em cascata)
    -- A trigger `handle_new_user` irá deletar da tabela `profiles`
    DELETE FROM auth.users WHERE id IN (user_ana_id, user_bruno_id, user_carla_id);

    -- Inserir novos usuários
    INSERT INTO auth.users (id, email, encrypted_password, role, aud, instance_id, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
    VALUES
        (user_ana_id, 'ana.silva@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Silva"}'),
        (user_bruno_id, 'bruno.costa@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bruno Costa"}'),
        (user_carla_id, 'carla.dias@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carla Dias"}');

    RAISE NOTICE 'Usuários de teste criados com sucesso!';
    RAISE NOTICE 'Ana Silva: ana.silva@example.com / password123';
    RAISE NOTICE 'Bruno Costa: bruno.costa@example.com / password123';
    RAISE NOTICE 'Carla Dias: carla.dias@example.com / password123';
END $$;

-- A trigger `handle_new_user` já terá criado os perfis básicos.
-- Agora vamos ATUALIZAR esses perfis com dados detalhados.
DO $$
DECLARE
    user_ana_id UUID := '00000000-0000-0000-0000-000000000001';
    user_bruno_id UUID := '00000000-0000-0000-0000-000000000002';
    user_carla_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
    UPDATE public.profiles
    SET
        name = 'Ana Silva',
        date_of_birth = '1995-05-15',
        diabetes_type = 'tipo1',
        hypo_glucose_threshold = 70,
        target_glucose_low = 70,
        target_glucose_high = 180,
        hyper_glucose_threshold = 250,
        carb_ratio = 10,
        correction_factor = 40,
        target_glucose = 100
    WHERE id = user_ana_id;

    UPDATE public.profiles
    SET
        name = 'Bruno Costa',
        date_of_birth = '1978-09-20',
        diabetes_type = 'tipo2',
        hypo_glucose_threshold = 70,
        target_glucose_low = 80,
        target_glucose_high = 160,
        hyper_glucose_threshold = 200,
        carb_ratio = 15,
        correction_factor = 50,
        target_glucose = 110
    WHERE id = user_bruno_id;

    UPDATE public.profiles
    SET
        name = 'Carla Dias',
        date_of_birth = '1990-11-30',
        diabetes_type = 'gestacional',
        hypo_glucose_threshold = 65,
        target_glucose_low = 70,
        target_glucose_high = 140,
        hyper_glucose_threshold = 180,
        carb_ratio = 12,
        correction_factor = 45,
        target_glucose = 95
    WHERE id = user_carla_id;

    RAISE NOTICE 'Perfis dos usuários de teste atualizados.';
END $$;


-- =================================================================
--                POVOAR DADOS DE SAÚDE (ÚLTIMOS 90 DIAS)
-- =================================================================
DO $$
DECLARE
    user_ana_id UUID := '00000000-0000-0000-0000-000000000001';
    user_bruno_id UUID := '00000000-0000-0000-0000-000000000002';
    user_carla_id UUID := '00000000-0000-0000-0000-000000000003';
    dia INTEGER;
    hora INTEGER;
    glicemia_base INTEGER;
    glicemia_valor INTEGER;
    contexto TEXT;
    tipo_insulina_lenta TEXT := 'Lenta (Glargina, Detemir, Degludeca)';
    tipo_insulina_rapida TEXT := 'Rápida (Aspart, Lispro, Glulisina)';
BEGIN
    -- Limpar dados antigos dos usuários de teste para garantir consistência
    DELETE FROM public.glucose_readings WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.insulin_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.medication_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.activity_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    RAISE NOTICE 'Dados de saúde antigos dos usuários de teste foram limpos.';

    -- Loop pelos últimos 90 dias
    FOR dia IN 0..89 LOOP
        -- ================== DADOS PARA ANA SILVA (TIPO 1) ==================
        -- Ana é muito regrada.
        -- Glicemia em Jejum (7h)
        glicemia_base := 90 + floor(random() * 40 - 20); -- Variação entre 70 e 110
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_ana_id, glicemia_base, now() - (dia || ' days')::interval - '7 hours'::interval, 'jejum', 'normal');
        -- Insulina Lenta (7h)
        INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES (user_ana_id, tipo_insulina_lenta, 18, now() - (dia || ' days')::interval - '7 hours'::interval);

        -- Glicemia Pré-Almoço (12h)
        glicemia_base := 110 + floor(random() * 60 - 30);
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_ana_id, glicemia_base, now() - (dia || ' days')::interval - '12 hours'::interval, 'antes_refeicao', case when glicemia_base > 180 then 'alta' else 'normal' end);
        -- Insulina Rápida (Almoço) (12h)
        INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES (user_ana_id, tipo_insulina_rapida, 6 + floor(random() * 3 - 1), now() - (dia || ' days')::interval - '12 hours'::interval);

        -- Glicemia Pós-Almoço (14h)
        glicemia_base := 140 + floor(random() * 80 - 40);
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_ana_id, glicemia_base, now() - (dia || ' days')::interval - '14 hours'::interval, 'depois_refeicao', case when glicemia_base > 180 then 'alta' else 'normal' end);

        -- Glicemia Pré-Jantar (19h)
        glicemia_base := 100 + floor(random() * 50 - 25);
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_ana_id, glicemia_base, now() - (dia || ' days')::interval - '19 hours'::interval, 'antes_refeicao', case when glicemia_base < 70 then 'baixa' else 'normal' end);
        -- Insulina Rápida (Jantar) (19h)
        INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES (user_ana_id, tipo_insulina_rapida, 5 + floor(random() * 3 - 1), now() - (dia || ' days')::interval - '19 hours'::interval);

        -- Glicemia ao Dormir (22h)
        glicemia_base := 120 + floor(random() * 60 - 30);
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_ana_id, glicemia_base, now() - (dia || ' days')::interval - '22 hours'::interval, 'outro', 'normal');

        -- Atividade física (3x por semana)
        IF dia % 3 = 0 THEN
             INSERT INTO public.activity_logs (user_id, activity_type, duration_minutes, intensity, timestamp) VALUES (user_ana_id, 'musculacao', 50, 'moderada', now() - (dia || ' days')::interval - '18 hours'::interval);
        END IF;

        -- ================== DADOS PARA BRUNO COSTA (TIPO 2) ==================
        -- Bruno foca em medicação oral e mede a glicemia com menos frequência.
        -- Glicemia em Jejum (8h) - Mede 1x a cada 2 dias
        IF dia % 2 = 0 THEN
            glicemia_base := 125 + floor(random() * 30 - 15);
            INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_bruno_id, glicemia_base, now() - (dia || ' days')::interval - '8 hours'::interval, 'jejum', case when glicemia_base > 160 then 'alta' else 'normal' end);
        END IF;
        -- Medicação (8h) - Todos os dias
        INSERT INTO public.medication_logs (user_id, medication_name, dosage, timestamp) VALUES (user_bruno_id, 'Metformina', '850mg', now() - (dia || ' days')::interval - '8 hours'::interval);

        -- Glicemia Pós-Almoço (14h) - Mede 1x a cada 3 dias
        IF dia % 3 = 0 THEN
            glicemia_base := 160 + floor(random() * 60 - 30);
            INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_bruno_id, glicemia_base, now() - (dia || ' days')::interval - '14 hours'::interval, 'depois_refeicao', case when glicemia_base > 160 then 'alta' else 'normal' end);
        END IF;

        -- Medicação (20h) - Todos os dias
        INSERT INTO public.medication_logs (user_id, medication_name, dosage, timestamp) VALUES (user_bruno_id, 'Gliclazida', '30mg', now() - (dia || ' days')::interval - '20 hours'::interval);
        
        -- Atividade física (2x por semana)
        IF dia % 4 = 0 THEN
             INSERT INTO public.activity_logs (user_id, activity_type, duration_minutes, intensity, timestamp) VALUES (user_bruno_id, 'caminhada', 45, 'leve', now() - (dia || ' days')::interval - '17 hours'::interval);
        END IF;


        -- ================== DADOS PARA CARLA DIAS (GESTACIONAL) ==================
        -- Carla foca nas medições pós-refeição.
        -- Glicemia em Jejum (7h)
        glicemia_base := 80 + floor(random() * 20 - 10);
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_carla_id, glicemia_base, now() - (dia || ' days')::interval - '7 hours'::interval, 'jejum', case when glicemia_base > 95 then 'alta' else 'normal' end);

        -- Glicemia Pós-Café (9h)
        glicemia_base := 110 + floor(random() * 40 - 20);
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_carla_id, glicemia_base, now() - (dia || ' days')::interval - '9 hours'::interval, 'depois_refeicao', case when glicemia_base > 140 then 'alta' else 'normal' end);

        -- Glicemia Pós-Almoço (14h)
        glicemia_base := 120 + floor(random() * 50 - 25);
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_carla_id, glicemia_base, now() - (dia || ' days')::interval - '14 hours'::interval, 'depois_refeicao', case when glicemia_base > 140 then 'alta' else 'normal' end);

        -- Glicemia Pós-Jantar (21h)
        glicemia_base := 115 + floor(random() * 45 - 20);
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES (user_carla_id, glicemia_base, now() - (dia || ' days')::interval - '21 hours'::interval, 'depois_refeicao', case when glicemia_base > 140 then 'alta' else 'normal' end);

        -- Às vezes, usa insulina antes de dormir
        IF dia % 5 = 0 AND glicemia_base > 130 THEN
            INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES (user_carla_id, tipo_insulina_rapida, 2, now() - (dia || ' days')::interval - '22 hours'::interval);
        END IF;

         -- Atividade física (leve, 4x por semana)
        IF dia % 2 = 0 THEN
             INSERT INTO public.activity_logs (user_id, activity_type, duration_minutes, intensity, timestamp) VALUES (user_carla_id, 'yoga_pilates', 40, 'leve', now() - (dia || ' days')::interval - '18 hours'::interval);
        END IF;

    END LOOP;
    RAISE NOTICE 'Dados de saúde de exemplo inseridos para os últimos 90 dias.';
END $$;

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insulin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Fim da transação
COMMIT;

RAISE NOTICE 'Script de povoamento concluído com sucesso!';
