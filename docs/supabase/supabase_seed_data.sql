-- supabase_seed_data.sql

-- Este script povoa o banco de dados com dados de teste para 3 usuários.
-- É projetado para ser executado várias vezes sem causar erros de "chave duplicada".

-- PASSO 1: Habilitar a extensão pgcrypto se ainda não estiver habilitada
-- Esta extensão é necessária para a função crypt() usada para hashear senhas.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PASSO 2: Criar os usuários de teste de forma segura, um por um.
-- Este bloco verifica se cada usuário existe antes de tentar inseri-lo.
DO $$
DECLARE
    user_ana_id UUID;
    user_bruno_id UUID;
    user_carla_id UUID;
BEGIN
    -- Criar Ana Silva se não existir
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ana.silva@example.com') THEN
        user_ana_id := uuid_generate_v4();
        INSERT INTO auth.users (id, email, encrypted_password, role, aud, instance_id, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
        VALUES (user_ana_id, 'ana.silva@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Silva"}');
    END IF;

    -- Criar Bruno Costa se não existir
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'bruno.costa@example.com') THEN
        user_bruno_id := uuid_generate_v4();
        INSERT INTO auth.users (id, email, encrypted_password, role, aud, instance_id, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
        VALUES (user_bruno_id, 'bruno.costa@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bruno Costa"}');
    END IF;

    -- Criar Carla Dias se não existir
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'carla.dias@example.com') THEN
        user_carla_id := uuid_generate_v4();
        INSERT INTO auth.users (id, email, encrypted_password, role, aud, instance_id, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
        VALUES (user_carla_id, 'carla.dias@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carla Dias"}');
    END IF;
END $$;


-- PASSO 3: Limpar dados de saúde antigos e inserir novos dados de teste.
-- Este bloco é executado de forma independente para garantir que os usuários já existam.
DO $$
DECLARE
    user_ana_id UUID := (SELECT id FROM auth.users WHERE email = 'ana.silva@example.com');
    user_bruno_id UUID := (SELECT id FROM auth.users WHERE email = 'bruno.costa@example.com');
    user_carla_id UUID := (SELECT id FROM auth.users WHERE email = 'carla.dias@example.com');
    
    -- Função para gerar um número aleatório em um intervalo
    CREATE OR REPLACE FUNCTION random_between(low INT, high INT) 
    RETURNS INT AS $$
    BEGIN
       RETURN floor(random() * (high - low + 1) + low);
    END;
    $$ language plpgsql;

BEGIN
    -- LIMPAR DADOS ANTIGOS APENAS PARA OS USUÁRIOS DE TESTE
    -- Isso garante que, se você rodar o script novamente, não duplicará os dados.
    DELETE FROM public.glucose_readings WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.insulin_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.activity_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.medication_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.meal_analyses WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);

    -- Atualizar ou Inserir perfis para garantir que eles existam na tabela `profiles`.
    -- A trigger `handle_new_user` já deve ter feito isso, mas o `ON CONFLICT` garante a segurança.
    INSERT INTO public.profiles (id, name, email, diabetes_type, hypo_glucose_threshold, target_glucose_low, target_glucose_high, hyper_glucose_threshold, carb_ratio, correction_factor, target_glucose)
    VALUES 
        (user_ana_id, 'Ana Silva', 'ana.silva@example.com', 'tipo1', 70, 70, 180, 250, 10, 40, 100),
        (user_bruno_id, 'Bruno Costa', 'bruno.costa@example.com', 'tipo2', 65, 80, 160, 220, 15, 50, 110),
        (user_carla_id, 'Carla Dias', 'carla.dias@example.com', 'gestacional', 60, 70, 140, 200, 12, 45, 95)
    ON CONFLICT (id) DO UPDATE 
    SET 
        name = EXCLUDED.name, 
        diabetes_type = EXCLUDED.diabetes_type,
        hypo_glucose_threshold = EXCLUDED.hypo_glucose_threshold,
        target_glucose_low = EXCLUDED.target_glucose_low,
        target_glucose_high = EXCLUDED.target_glucose_high,
        hyper_glucose_threshold = EXCLUDED.hyper_glucose_threshold,
        carb_ratio = EXCLUDED.carb_ratio,
        correction_factor = EXCLUDED.correction_factor,
        target_glucose = EXCLUDED.target_glucose;


    -- INSERIR DADOS DE SAÚDE FICTÍCIOS
    -- Loop para gerar dados para os últimos 90 dias
    FOR i IN 0..89 LOOP
        -- === Ana Silva (Tipo 1, usuária frequente) ===
        -- Glicemia (5-7x por dia)
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level, notes)
        VALUES
            (user_ana_id, random_between(75, 130), NOW() - (i || ' days')::interval - '8 hours'::interval, 'jejum', 'normal', 'Glicemia de jejum'),
            (user_ana_id, random_between(120, 210), NOW() - (i || ' days')::interval - '14 hours'::interval, 'depois_refeicao', 'alta', 'Pós-almoço'),
            (user_ana_id, random_between(60, 110), NOW() - (i || ' days')::interval - '18 hours'::interval, 'antes_refeicao', 'baixa', 'Antes do jantar'),
            (user_ana_id, random_between(90, 160), NOW() - (i || ' days')::interval - '21 hours'::interval, 'depois_refeicao', 'normal', NULL),
            (user_ana_id, random_between(80, 140), NOW() - (i || ' days')::interval - '23 hours'::interval, 'outro', 'normal', 'Antes de dormir');
        
        -- Insulina (4x por dia)
        INSERT INTO public.insulin_logs (user_id, type, dose, timestamp)
        VALUES
            (user_ana_id, 'Lenta (Glargina, Detemir, Degludeca)', 20, NOW() - (i || ' days')::interval - '8 hours'::interval),
            (user_ana_id, 'Rápida (Aspart, Lispro, Glulisina)', random_between(4, 8), NOW() - (i || ' days')::interval - '12 hours'::interval),
            (user_ana_id, 'Rápida (Aspart, Lispro, Glulisina)', random_between(5, 10), NOW() - (i || ' days')::interval - '18 hours'::interval);

        -- Atividade Física (a cada 2 dias)
        IF i % 2 = 0 THEN
            INSERT INTO public.activity_logs (user_id, activity_type, duration_minutes, intensity, timestamp)
            VALUES (user_ana_id, 'corrida', 45, 'moderada', NOW() - (i || ' days')::interval - '17 hours'::interval);
        END IF;

        -- === Bruno Costa (Tipo 2, usuário mais esporádico) ===
        -- Glicemia (2x por dia)
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level)
        VALUES
            (user_bruno_id, random_between(90, 150), NOW() - (i || ' days')::interval - '9 hours'::interval, 'jejum', 'alta'),
            (user_bruno_id, random_between(140, 230), NOW() - (i || ' days')::interval - '20 hours'::interval, 'depois_refeicao', 'muito_alta');

        -- Medicamentos (todos os dias)
        INSERT INTO public.medication_logs (user_id, medication_name, dosage, timestamp)
        VALUES
            (user_bruno_id, 'Metformina', '850mg', NOW() - (i || ' days')::interval - '9 hours'::interval),
            (user_bruno_id, 'Gliclazida', '30mg', NOW() - (i || ' days')::interval - '9 hours'::interval);

        -- Atividade (a cada 3 dias)
        IF i % 3 = 0 THEN
             INSERT INTO public.activity_logs (user_id, activity_type, duration_minutes, intensity, timestamp)
             VALUES (user_bruno_id, 'caminhada', 60, 'leve', NOW() - (i || ' days')::interval - '10 hours'::interval);
        END IF;

        -- === Carla Dias (Gestacional, focada em refeições) ===
        -- Glicemia (4x por dia, focada pós-refeição)
        INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level)
        VALUES
            (user_carla_id, random_between(65, 95), NOW() - (i || ' days')::interval - '8 hours'::interval, 'jejum', 'normal'),
            (user_carla_id, random_between(100, 150), NOW() - (i || ' days')::interval - '11 hours'::interval, 'depois_refeicao', 'alta'),
            (user_carla_id, random_between(110, 160), NOW() - (i || ' days')::interval - '15 hours'::interval, 'depois_refeicao', 'alta'),
            (user_carla_id, random_between(90, 140), NOW() - (i || ' days')::interval - '21 hours'::interval, 'depois_refeicao', 'normal');

        -- Análise de Refeição (a cada 4 dias)
        IF i % 4 = 0 THEN
            INSERT INTO public.meal_analyses(user_id, timestamp, food_identification, macronutrient_estimates, estimated_glucose_impact, improvement_tips, image_url)
            VALUES (user_carla_id, NOW() - (i || ' days')::interval - '13 hours'::interval, 'Salada de frango com arroz integral e legumes', '{"fat": 15, "protein": 30, "carbohydrates": 45}', 'Impacto Glicêmico Moderado', 'Boa combinação de macronutrientes.', 'https://placehold.co/400x300.png');
        END IF;
    END LOOP;

    -- Imprimir as credenciais para o usuário
    RAISE NOTICE 'Usuários de teste criados com sucesso!';
    RAISE NOTICE '-------------------------------------';
    RAISE NOTICE 'Email: ana.silva@example.com | Senha: password123';
    RAISE NOTICE 'Email: bruno.costa@example.com | Senha: password123';
    RAISE NOTICE 'Email: carla.dias@example.com | Senha: password123';
    RAISE NOTICE '-------------------------------------';
END $$;

    