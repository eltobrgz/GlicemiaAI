
-- ####################################################################################
-- #  SCRIPT DE GERENCIAMENTO DE DADOS PARA GLICEMIAAI                                #
-- #  Contém:                                                                         #
-- #  1. Script para DELETAR todos os dados da aplicação (usuários e seus registros). #
-- #  2. Script para POVOAR o banco com dados de exemplo.                             #
-- ####################################################################################


-- ####################################################################################
-- #  SCRIPT 1: DELETAR TODOS OS DADOS DA APLICAÇÃO                                   #
-- ####################################################################################
-- ATENÇÃO: Este script removerá TODOS os usuários e TODOS os dados associados a eles
-- (perfis, leituras de glicemia, logs de insulina, análises de refeição, lembretes,
-- e logs de atividade física) da sua aplicação GlicemiaAI.
--
-- A exclusão é feita através da tabela `auth.users`. Devido às constraints
-- `ON DELETE CASCADE` configuradas nas outras tabelas (como `profiles`,
-- `glucose_readings`, etc., que referenciam `auth.users`), todos os dados
-- relacionados a um usuário serão automaticamente removidos quando o usuário
-- for deletado da tabela `auth.users`.
--
-- Execute este script com cautela. Não há como desfazer esta operação facilmente
-- a menos que você tenha um backup do seu banco de dados.

-- PARA EXECUTAR, DESCOMENTE A LINHA ABAIXO:
-- DELETE FROM auth.users;

-- Se desejar deletar dados de tabelas específicas sem remover os usuários (menos comum para reset total):
-- DELETE FROM public.glucose_readings;
-- DELETE FROM public.insulin_logs;
-- DELETE FROM public.meal_analyses;
-- DELETE FROM public.reminders;
-- DELETE FROM public.activity_logs;
-- DELETE FROM public.profiles; -- Nota: Deletar de 'profiles' NÃO deletará de 'auth.users' pela configuração atual.


-- ####################################################################################
-- #  SCRIPT 2: POVOAR O BANCO DE DADOS COM DADOS DE EXEMPLO                          #
-- ####################################################################################
-- Este script cria usuários de exemplo e preenche suas informações e registros.
--
-- SENHA PARA TODOS OS USUÁRIOS DE EXEMPLO: password123
-- (O hash bcrypt para 'password123' é: $2a$10$E9p8B/k2sM9j8.F3Y.H1o.J2q9G0W3Q2wzXz7UuK3r4Xz5YvVn0yS)
--
-- PRÉ-REQUISITO: A extensão "uuid-ossp" deve estar habilitada no seu banco Supabase.
-- (CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- já deve estar no seu setup inicial)
-- O trigger `public.handle_new_user` também deve estar criado conforme o SUPABASE_SETUP_GUIDE.md.
--
--------------------------------------------------------------------------------------

DO $$
DECLARE
    user_ana_id uuid;
    user_bruno_id uuid;
    user_charles_id uuid;
    fixed_bcrypt_hash text := '$2a$10$E9p8B/k2sM9j8.F3Y.H1o.J2q9G0W3Q2wzXz7UuK3r4Xz5YvVn0yS'; -- bcrypt hash for 'password123'
BEGIN

    -- --------- USUÁRIO 1: Ana Silva ---------
    user_ana_id := uuid_generate_v4();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_ana_id, 'authenticated', 'authenticated', 'ana.silva@example.com', fixed_bcrypt_hash, now(), NULL, NULL, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Ana Silva', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=AS'),
        now(), now(), NULL, '', NULL, now()
    );
    -- O trigger `handle_new_user` deve ter criado uma entrada em `public.profiles`.
    -- Agora, atualizamos `public.profiles` com informações específicas da Ana.
    UPDATE public.profiles
    SET
        date_of_birth = '1990-05-15',
        diabetes_type = 'tipo1',
        target_glucose_low = 80,
        target_glucose_high = 160,
        hypo_glucose_threshold = 70,
        hyper_glucose_threshold = 200,
        updated_at = now()
    WHERE id = user_ana_id;

    -- Dados de exemplo para Ana Silva
    -- Glicemias
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_ana_id, 95, now() - interval '3 days' - interval '2 hours', 'jejum', 'Acordei bem', 'normal'),
    (user_ana_id, 180, now() - interval '3 days' + interval '10 hours', 'depois_refeicao', 'Almoço com um pouco de macarrão', 'alta'),
    (user_ana_id, 150, now() - interval '2 days' - interval '1 hours', 'antes_refeicao', 'Antes do jantar', 'normal'),
    (user_ana_id, 65, now() - interval '2 days' + interval '5 hours', 'outro', 'Meio da tarde, senti tremedeira', 'baixa'),
    (user_ana_id, 220, now() - interval '1 day' + interval '12 hours', 'depois_refeicao', 'Pizza no jantar', 'muito_alta'),
    (user_ana_id, 110, now() - interval '0 days' - interval '3 hours', 'jejum', 'Glicemia matinal', 'normal');

    -- Insulinas
    INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES
    (user_ana_id, 'Rápida (Lispro)', 8, now() - interval '3 days' + interval '10 hours'),
    (user_ana_id, 'Lenta (Glargina)', 20, now() - interval '3 days' + interval '22 hours'),
    (user_ana_id, 'Rápida (Lispro)', 6, now() - interval '2 days' - interval '1 hours'),
    (user_ana_id, 'Lenta (Glargina)', 20, now() - interval '2 days' + interval '22 hours'),
    (user_ana_id, 'Rápida (Lispro)', 10, now() - interval '1 day' + interval '12 hours');

    -- Análise de Refeição
    INSERT INTO public.meal_analyses (user_id, timestamp, image_url, original_image_file_name, food_identification, macronutrient_estimates, estimated_glucose_impact, suggested_insulin_dose, improvement_tips) VALUES
    (user_ana_id, now() - interval '1 day' + interval '12 hours', 'https://placehold.co/600x400.png?text=PizzaExemplo', 'pizza_example.jpg', 'Fatia de pizza de pepperoni e um copo de refrigerante.', '{"carbohydrates": 75, "protein": 25, "fat": 30}', 'Espera-se um aumento significativo da glicemia nas próximas 2-3 horas.', '8-10 unidades de insulina rápida, ajustar conforme contagem de carboidratos pessoal.', 'Considerar uma porção menor de pizza ou adicionar uma salada para fibras.');

    -- Atividades Físicas
    INSERT INTO public.activity_logs (user_id, timestamp, activity_type, duration_minutes, intensity, notes) VALUES
    (user_ana_id, now() - interval '3 days' + interval '17 hours', 'caminhada', 45, 'moderada', 'Caminhada no parque após o trabalho.'),
    (user_ana_id, now() - interval '1 day' + interval '8 hours', 'corrida', 30, 'intensa', 'Corrida leve na esteira.');

    -- Lembretes
    INSERT INTO public.reminders (user_id, type, name, "time", days, enabled, insulin_type, insulin_dose) VALUES
    (user_ana_id, 'glicemia', 'Glicemia Jejum', '07:00:00', 'todos_os_dias', true, null, null),
    (user_ana_id, 'insulina', 'Insulina Basal Noturna', '22:00:00', 'todos_os_dias', true, 'Lenta (Glargina)', 20);


    -- --------- USUÁRIO 2: Bruno Costa ---------
    user_bruno_id := uuid_generate_v4();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmed_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_bruno_id, 'authenticated', 'authenticated', 'bruno.costa@example.com', fixed_bcrypt_hash, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Bruno Costa', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=BC'),
        now(), now(), now()
    );
    UPDATE public.profiles
    SET
        date_of_birth = '1975-11-20',
        diabetes_type = 'tipo2',
        target_glucose_low = 90,
        target_glucose_high = 150,
        hypo_glucose_threshold = 75,
        hyper_glucose_threshold = 180,
        updated_at = now()
    WHERE id = user_bruno_id;

    -- Dados de exemplo para Bruno Costa
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, level) VALUES
    (user_bruno_id, 130, now() - interval '2 days' - interval '2 hours', 'jejum', 'alta'),
    (user_bruno_id, 160, now() - interval '2 days' + interval '10 hours', 'depois_refeicao', 'alta'),
    (user_bruno_id, 115, now() - interval '1 day' - interval '3 hours', 'jejum', 'normal');

    INSERT INTO public.activity_logs (user_id, timestamp, activity_type, duration_minutes, intensity, notes) VALUES
    (user_bruno_id, now() - interval '2 days' + interval '7 hours', 'ciclismo', 60, 'moderada', 'Pedalada matinal.'),
    (user_bruno_id, now() - interval '1 day' + interval '18 hours', 'musculacao', 50, 'moderada', 'Treino na academia.');

    INSERT INTO public.reminders (user_id, type, name, "time", days, enabled) VALUES
    (user_bruno_id, 'glicemia', 'Verificar Glicemia Manhã', '08:30:00', '["Seg", "Qua", "Sex"]', true);


    -- --------- USUÁRIO 3: Charles Smith (Internacional) ---------
    user_charles_id := uuid_generate_v4();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmed_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_charles_id, 'authenticated', 'authenticated', 'charles.smith@example.com', fixed_bcrypt_hash, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Charles Smith', 'language_preference', 'en-US', 'avatar_url', 'https://placehold.co/150x150.png?text=CS'),
        now(), now(), now()
    );
    UPDATE public.profiles
    SET
        date_of_birth = '1988-02-10',
        diabetes_type = 'tipo1',
        target_glucose_low = 70,   -- Equivalent to 70 mg/dL
        target_glucose_high = 180, -- Equivalent to 180 mg/dL
        hypo_glucose_threshold = 65,
        hyper_glucose_threshold = 250,
        language_preference = 'en-US',
        updated_at = now()
    WHERE id = user_charles_id;

    -- Dados de exemplo para Charles Smith
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_charles_id, 105, now() - interval '1 day' - interval '5 hours', 'jejum', 'Morning check', 'normal'),
    (user_charles_id, 190, now() - interval '1 day' + interval '14 hours', 'depois_refeicao', 'Lunch with friends', 'alta');

    INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES
    (user_charles_id, 'Rápida (Aspart)', 12, now() - interval '1 day' + interval '14 hours');

    INSERT INTO public.meal_analyses (user_id, timestamp, food_identification, macronutrient_estimates, estimated_glucose_impact, suggested_insulin_dose, improvement_tips, original_image_file_name, image_url) VALUES
    (user_charles_id, now() - interval '1 day' + interval '14 hours', 'Chicken salad sandwich and an apple.', '{"carbohydrates": 60, "protein": 35, "fat": 20}', 'Moderate glucose spike expected.', 'Consider 6 units of rapid-acting insulin.', 'Good choice! Adding more non-starchy vegetables could further improve it.', 'salad_sandwich.jpg', 'https://placehold.co/600x400.png?text=MealEN');


    RAISE NOTICE 'Dados de exemplo inseridos com sucesso!';
    RAISE NOTICE '--------------------------------------';
    RAISE NOTICE 'Credenciais de Login para Teste:';
    RAISE NOTICE 'Ana Silva: ana.silva@example.com / password123';
    RAISE NOTICE 'Bruno Costa: bruno.costa@example.com / password123';
    RAISE NOTICE 'Charles Smith: charles.smith@example.com / password123';
    RAISE NOTICE '--------------------------------------';

END $$;
    