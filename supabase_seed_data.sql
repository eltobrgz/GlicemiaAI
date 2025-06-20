
-- #####################################################################
-- # SCRIPT PARA POVOAR O BANCO DE DADOS COM DADOS DE EXEMPLO         #
-- #####################################################################
-- Este script insere usuários de exemplo e dados associados.
-- Assegure-se de que as tabelas (profiles, glucose_readings, etc.)
-- já foram criadas com o script do arquivo supabase_schema_create.sql.
--
-- ATENÇÃO: Este script assume que a extensão pgcrypto está habilitada.
-- (Já incluído no script supabase_schema_create.sql)
--
-- As senhas dos usuários de exemplo são 'password123'.

DO $$
DECLARE
    user_ana_id uuid := uuid_generate_v4();
    user_bruno_id uuid := uuid_generate_v4();
    user_charles_id uuid := uuid_generate_v4();
    fixed_bcrypt_hash text := '$2a$10$OBG3kS3cXiGcoHnl9ey.uOEZ4S4049CCFuqgLkPGXjch2S48BKMHy'; -- Hash bcrypt para 'password123'
    current_ts_utc timestamptz := timezone('utc', now());
BEGIN

    -- Inserir Usuários no auth.users
    -- (O trigger handle_new_user criará entradas básicas em public.profiles)
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
    VALUES
        ('00000000-0000-0000-0000-000000000000', user_ana_id, 'authenticated', 'authenticated', 'ana.silva@example.com', fixed_bcrypt_hash, current_ts_utc, NULL, NULL, current_ts_utc,
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Ana Silva', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=AS'),
        current_ts_utc, current_ts_utc, NULL, '', NULL
        ),
        ('00000000-0000-0000-0000-000000000000', user_bruno_id, 'authenticated', 'authenticated', 'bruno.costa@example.com', fixed_bcrypt_hash, current_ts_utc, NULL, NULL, current_ts_utc,
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Bruno Costa', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=BC'),
        current_ts_utc, current_ts_utc, NULL, '', NULL
        ),
        ('00000000-0000-0000-0000-000000000000', user_charles_id, 'authenticated', 'authenticated', 'charles.smith@example.com', fixed_bcrypt_hash, current_ts_utc, NULL, NULL, current_ts_utc,
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Charles Smith', 'language_preference', 'en-US', 'avatar_url', 'https://placehold.co/150x150.png?text=CS'),
        current_ts_utc, current_ts_utc, NULL, '', NULL
        );

    RAISE NOTICE 'Usuários de exemplo inseridos em auth.users.';
    RAISE NOTICE 'Ana Silva: ana.silva@example.com / password123 (ID: %)', user_ana_id;
    RAISE NOTICE 'Bruno Costa: bruno.costa@example.com / password123 (ID: %)', user_bruno_id;
    RAISE NOTICE 'Charles Smith: charles.smith@example.com / password123 (ID: %)', user_charles_id;

    -- Atualizar Perfis em public.profiles (o trigger já criou a linha, aqui adicionamos detalhes)
    -- Certifique-se de que as colunas target_glucose_low, target_glucose_high, hypo_glucose_threshold, hyper_glucose_threshold
    -- existem na sua tabela profiles antes de executar este script.
    -- Se não existirem, execute os comandos ALTER TABLE apropriados (veja SUPABASE_SETUP_GUIDE.md).
    UPDATE public.profiles SET
        name = 'Ana Silva',
        email = 'ana.silva@example.com', -- Redundante se o trigger pegar do auth.users, mas garante
        avatar_url = 'https://placehold.co/150x150.png?text=AS',
        date_of_birth = '1985-05-15',
        diabetes_type = 'tipo1',
        language_preference = 'pt-BR',
        target_glucose_low = 80,
        target_glucose_high = 160,
        hypo_glucose_threshold = 70,
        hyper_glucose_threshold = 200,
        updated_at = current_ts_utc
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
        hyper_glucose_threshold = 220,
        updated_at = current_ts_utc
    WHERE id = user_bruno_id;
    
    UPDATE public.profiles SET
        name = 'Charles Smith',
        email = 'charles.smith@example.com',
        avatar_url = 'https://placehold.co/150x150.png?text=CS',
        date_of_birth = '1978-07-20',
        diabetes_type = 'outro',
        language_preference = 'en-US',
        target_glucose_low = 70,
        target_glucose_high = 150,
        hypo_glucose_threshold = 65,
        hyper_glucose_threshold = 180,
        updated_at = current_ts_utc
    WHERE id = user_charles_id;

    RAISE NOTICE 'Perfis de exemplo atualizados em public.profiles.';

    -- Leituras de Glicemia para Ana Silva
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_ana_id, 95, current_ts_utc - interval '3 days 2 hours', 'jejum', 'Acordei bem', 'normal'),
    (user_ana_id, 150, current_ts_utc - interval '3 days', 'depois_refeicao', 'Almoço com macarrão', 'alta'),
    (user_ana_id, 110, current_ts_utc - interval '2 days 10 hours', 'antes_refeicao', 'Antes do jantar', 'normal'),
    (user_ana_id, 65, current_ts_utc - interval '2 days 5 hours', 'outro', 'Senti tremedeira', 'baixa'),
    (user_ana_id, 185, current_ts_utc - interval '1 day 3 hours', 'depois_refeicao', 'Pizza ontem à noite', 'alta');

    -- Leituras de Glicemia para Bruno Costa
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_bruno_id, 120, current_ts_utc - interval '2 days 1 hours', 'jejum', 'Manhã normal', 'normal'),
    (user_bruno_id, 210, current_ts_utc - interval '1 day 20 hours', 'depois_refeicao', 'Sobremesa extra', 'muito_alta');

    RAISE NOTICE 'Leituras de glicemia de exemplo inseridas.';

    -- Registros de Insulina para Ana Silva
    INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES
    (user_ana_id, 'Rápida (Lispro)', 8, current_ts_utc - interval '3 days'),
    (user_ana_id, 'Lenta (Glargina)', 22, current_ts_utc - interval '3 days 20 minutes'),
    (user_ana_id, 'Rápida (Lispro)', 6, current_ts_utc - interval '1 day 3 hours');

    RAISE NOTICE 'Registros de insulina de exemplo inseridos.';

    -- Análises de Refeição para Ana Silva
    INSERT INTO public.meal_analyses (user_id, timestamp, image_url, original_image_file_name, food_identification, macronutrient_estimates, estimated_glucose_impact, suggested_insulin_dose, improvement_tips) VALUES
    (user_ana_id, current_ts_utc - interval '2 days', 'https://placehold.co/600x400.png?text=Prato+Saudavel', 'prato_saudavel.jpg', 'Salada colorida com frango grelhado e quinoa.', '{"carbohydrates": 30, "protein": 40, "fat": 15}', 'Impacto glicêmico moderado, elevação gradual.', '4-6 unidades de insulina rápida, ajustar conforme sensibilidade.', 'Adicionar mais fibras de vegetais folhosos escuros.');

    RAISE NOTICE 'Análises de refeição de exemplo inseridas.';

    -- Lembretes para Ana Silva
    INSERT INTO public.reminders (user_id, type, name, "time", days, enabled, insulin_type, insulin_dose) VALUES
    (user_ana_id, 'glicemia', 'Glicemia Jejum', '07:00:00', '["Seg", "Qua", "Sex"]'::jsonb, true, NULL, NULL),
    (user_ana_id, 'insulina', 'Insulina Basal Noite', '22:00:00', '"todos_os_dias"'::jsonb, true, 'Lenta (Glargina)', 22);

    RAISE NOTICE 'Lembretes de exemplo inseridos.';

    -- Atividades Físicas para Bruno Costa
    INSERT INTO public.activity_logs (user_id, timestamp, activity_type, duration_minutes, intensity, notes) VALUES
    (user_bruno_id, current_ts_utc - interval '1 day 10 hours', 'caminhada', 45, 'moderada', 'Caminhada no parque, ritmo bom.'),
    (user_bruno_id, current_ts_utc - interval '3 days 8 hours', 'musculacao', 60, 'moderada', 'Treino de superiores.');

    RAISE NOTICE 'Atividades físicas de exemplo inseridas.';
    RAISE NOTICE 'Povoamento de dados concluído com sucesso!';

END $$;
