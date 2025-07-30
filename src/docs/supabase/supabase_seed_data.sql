-- GlicemiaAI Supabase Seed Data Script
-- version 2.0
--
-- This script populates the database with realistic sample data for 3 users over the last 90 days.
-- It is designed to be idempotent, meaning it can be run multiple times without causing errors.
--
-- How it works:
-- 1. It attempts to create the test users. If they already exist, it does nothing.
-- 2. It retrieves the UUIDs for the test users.
-- 3. It DELETES all previous data associated ONLY with these test users.
-- 4. It inserts a fresh, comprehensive set of data for the last 90 days.
--
-- To use this script:
-- 1. Ensure you have run the `supabase_schema_create.sql` script first to create the tables.
-- 2. Navigate to the SQL Editor in your Supabase project dashboard.
-- 3. Copy and paste the entire content of this file.
-- 4. Click "RUN".
--
-- Test User Credentials:
-- Email: ana.silva@example.com / Password: password123
-- Email: bruno.costa@example.com / Password: password123
-- Email: carla.dias@example.com / Password: password123

DO $$
DECLARE
    user_ana_id uuid;
    user_bruno_id uuid;
    user_carla_id uuid;
BEGIN
    -- 1. Create test users if they don't exist.
    -- This uses ON CONFLICT DO NOTHING to avoid errors on subsequent runs.
    INSERT INTO auth.users (id, email, encrypted_password, role, aud, instance_id, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
    VALUES
        ('00000000-0000-0000-0000-000000000001', 'ana.silva@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Silva"}'),
        ('00000000-0000-0000-0000-000000000002', 'bruno.costa@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bruno Costa"}'),
        ('00000000-0000-0000-0000-000000000003', 'carla.dias@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', uuid_generate_v4(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carla Dias"}')
    ON CONFLICT (email) DO NOTHING;

    -- 2. Get the UUIDs of our test users.
    SELECT id INTO user_ana_id FROM auth.users WHERE email = 'ana.silva@example.com';
    SELECT id INTO user_bruno_id FROM auth.users WHERE email = 'bruno.costa@example.com';
    SELECT id INTO user_carla_id FROM auth.users WHERE email = 'carla.dias@example.com';
    
    -- Raise notice with user credentials
    RAISE NOTICE 'Test User Credentials:';
    RAISE NOTICE 'User: Ana Silva, Email: ana.silva@example.com, Password: password123';
    RAISE NOTICE 'User: Bruno Costa, Email: bruno.costa@example.com, Password: password123';
    RAISE NOTICE 'User: Carla Dias, Email: carla.dias@example.com, Password: password123';

    -- 3. Clean up old data for ONLY these test users to ensure a fresh start.
    DELETE FROM public.glucose_readings WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.insulin_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.medication_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.activity_logs WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.meal_analyses WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);
    DELETE FROM public.reminders WHERE user_id IN (user_ana_id, user_bruno_id, user_carla_id);

    -- Also ensure profiles are created or updated.
    -- The handle_new_user trigger should create these, but upserting here makes the script more robust.
    INSERT INTO public.profiles (id, name, email, diabetes_type, hypo_glucose_threshold, target_glucose_low, target_glucose_high, hyper_glucose_threshold, carb_ratio, correction_factor, target_glucose)
    VALUES
        (user_ana_id, 'Ana Silva', 'ana.silva@example.com', 'tipo1', 70, 80, 160, 240, 10, 40, 100),
        (user_bruno_id, 'Bruno Costa', 'bruno.costa@example.com', 'tipo2', 70, 80, 180, 250, 15, 50, 120),
        (user_carla_id, 'Carla Dias', 'carla.dias@example.com', 'gestacional', 65, 70, 140, 200, 12, 45, 95)
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        diabetes_type = EXCLUDED.diabetes_type,
        hypo_glucose_threshold = EXCLUDED.hypo_glucose_threshold,
        target_glucose_low = EXCLUDED.target_glucose_low,
        target_glucose_high = EXCLUDED.target_glucose_high,
        hyper_glucose_threshold = EXCLUDED.hyper_glucose_threshold,
        carb_ratio = EXCLUDED.carb_ratio,
        correction_factor = EXCLUDED.correction_factor,
        target_glucose = EXCLUDED.target_glucose;


    -- 4. Generate and insert fresh data for the last 90 days.
    FOR i IN 0..90 LOOP
        -- Ana Silva (Tipo 1, mais detalhista)
        -- Glicemias (5-7 por dia)
        INSERT INTO public.glucose_readings (user_id, "timestamp", value, meal_context, notes, level)
        VALUES
            (user_ana_id, now() - (i || ' days')::interval - '07:00:00'::interval, 90 + floor(random() * 20), 'jejum', 'Glicemia de jejum', 'normal'),
            (user_ana_id, now() - (i || ' days')::interval - '09:30:00'::interval, 150 + floor(random() * 40), 'depois_refeicao', 'Após café da manhã', 'alta'),
            (user_ana_id, now() - (i || ' days')::interval - '12:30:00'::interval, 110 + floor(random() * 30), 'antes_refeicao', NULL, 'normal'),
            (user_ana_id, now() - (i || ' days')::interval - '15:00:00'::interval, 180 + floor(random() * 50), 'depois_refeicao', 'Após almoço', 'alta'),
            (user_ana_id, now() - (i || ' days')::interval - '19:00:00'::interval, 125 + floor(random() * 40), 'antes_refeicao', NULL, 'normal'),
            (user_ana_id, now() - (i || ' days')::interval - '22:00:00'::interval, 140 + floor(random() * 60), 'outro', 'Antes de dormir', 'alta');

        -- Insulina (4-5 por dia)
        INSERT INTO public.insulin_logs (user_id, "timestamp", type, dose)
        VALUES
            (user_ana_id, now() - (i || ' days')::interval - '07:05:00'::interval, 'Rápida (Aspart, Lispro, Glulisina)', 6 + random()),
            (user_ana_id, now() - (i || ' days')::interval - '12:35:00'::interval, 'Rápida (Aspart, Lispro, Glulisina)', 8 + random()*2),
            (user_ana_id, now() - (i || ' days')::interval - '19:05:00'::interval, 'Rápida (Aspart, Lispro, Glulisina)', 7 + random()),
            (user_ana_id, now() - (i || ' days')::interval - '22:05:00'::interval, 'Lenta (Glargina, Detemir, Degludeca)', 20);

        -- Atividade (a cada 2 dias)
        IF i % 2 = 0 THEN
            INSERT INTO public.activity_logs (user_id, "timestamp", activity_type, duration_minutes, intensity, notes)
            VALUES (user_ana_id, now() - (i || ' days')::interval - '17:00:00'::interval, 'caminhada', 45, 'moderada', 'Caminhada no parque');
        END IF;


        -- Bruno Costa (Tipo 2, focado em medicação)
        -- Glicemias (2-3 por dia)
        INSERT INTO public.glucose_readings (user_id, "timestamp", value, meal_context, level)
        VALUES
            (user_bruno_id, now() - (i || ' days')::interval - '08:00:00'::interval, 120 + floor(random() * 30), 'jejum', 'normal'),
            (user_bruno_id, now() - (i || ' days')::interval - '20:00:00'::interval, 190 + floor(random() * 60), 'depois_refeicao', 'alta');

        -- Medicação (2x por dia)
        INSERT INTO public.medication_logs (user_id, "timestamp", medication_name, dosage)
        VALUES
            (user_bruno_id, now() - (i || ' days')::interval - '08:05:00'::interval, 'Metformina', '850mg'),
            (user_bruno_id, now() - (i || ' days')::interval - '20:05:00'::interval, 'Metformina', '850mg');

        -- Atividade (a cada 3 dias)
        IF i % 3 = 0 THEN
            INSERT INTO public.activity_logs (user_id, "timestamp", activity_type, duration_minutes, intensity)
            VALUES (user_bruno_id, now() - (i || ' days')::interval - '09:00:00'::interval, 'musculacao', 60, 'moderada');
        END IF;
        
        
        -- Carla Dias (Gestacional, focada em refeições)
        -- Glicemias (4 por dia, pós-prandial)
        INSERT INTO public.glucose_readings (user_id, "timestamp", value, meal_context, level)
        VALUES
            (user_carla_id, now() - (i || ' days')::interval - '08:00:00'::interval, 85 + floor(random() * 15), 'jejum', 'normal'),
            (user_carla_id, now() - (i || ' days')::interval - '10:00:00'::interval, 130 + floor(random() * 25), 'depois_refeicao', 'alta'),
            (user_carla_id, now() - (i || ' days')::interval - '14:30:00'::interval, 125 + floor(random() * 30), 'depois_refeicao', 'normal'),
            (user_carla_id, now() - (i || ' days')::interval - '21:00:00'::interval, 115 + floor(random() * 20), 'depois_refeicao', 'normal');

        -- Análise de Refeição (a cada 5 dias)
        IF i % 5 = 0 THEN
             INSERT INTO public.meal_analyses (user_id, "timestamp", food_identification, macronutrient_estimates, estimated_glucose_impact, improvement_tips, image_url)
             VALUES (
                 user_carla_id,
                 now() - (i || ' days')::interval - '12:30:00'::interval,
                 'Salada de frango grelhado com quinoa, abacate e vegetais variados.',
                 '{"fat": 15, "protein": 30, "carbohydrates": 40}',
                 'Impacto glicêmico moderado devido à boa quantidade de fibras e proteínas.',
                 'Excelente escolha! Para um impacto ainda menor, considere adicionar um pouco mais de azeite de oliva para aumentar as gorduras boas.',
                 'https://placehold.co/600x400.png'
             );
        END IF;
    END LOOP;
END $$;
