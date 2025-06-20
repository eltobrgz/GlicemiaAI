-- supabase_data_management.sql

-- #####################################################################
-- # ATENÇÃO: LEIA ANTES DE EXECUTAR
-- #####################################################################
--
-- ESTE ARQUIVO CONTÉM SCRIPTS SQL PARA:
-- 1. DELETAR TODOS OS DADOS DA APLICAÇÃO (USUÁRIOS, LEITURAS, ETC.)
-- 2. POVOAR O BANCO DE DADOS COM DADOS DE EXEMPLO (USUÁRIOS E REGISTROS FICTÍCIOS)
--
-- USE COM EXTREMO CUIDADO, ESPECIALMENTE O SCRIPT DE DELEÇÃO.
-- RECOMENDA-SE FAZER UM BACKUP DO SEU BANCO ANTES DE EXECUTAR QUALQUER SCRIPT DE DELEÇÃO.
--
-- Para executar:
-- 1. Copie a seção do script desejado.
-- 2. Cole no SQL Editor do seu projeto Supabase.
-- 3. Execute o script.
--
-- =====================================================================
-- SCRIPT 1: DELETAR TODOS OS DADOS DA APLICAÇÃO (INCLUINDO USUÁRIOS)
-- =====================================================================
--
-- AVISO: Este script apagará TODOS os usuários e TODOS os dados
-- relacionados nas tabelas: profiles, glucose_readings, insulin_logs,
-- meal_analyses, reminders, activity_logs.
-- As políticas ON DELETE CASCADE cuidarão da deleção em cascata.
--
-- PARA EXECUTAR, DESCOMENTE A LINHA `DELETE FROM auth.users;` ABAIXO.
-- SE VOCÊ NÃO TEM CERTEZA, NÃO EXECUTE.
--
/*
BEGIN;
  -- Descomente a linha abaixo para deletar todos os usuários e dados associados.
  -- DELETE FROM auth.users;
  RAISE NOTICE 'Todos os usuários e dados da aplicação foram (ou seriam, se descomentado) deletados.';
COMMIT;
*/

-- =====================================================================
-- SCRIPT 2: POVOAR O BANCO DE DADOS COM DADOS DE EXEMPLO
-- =====================================================================
--
-- NOTAS ANTES DE EXECUTAR O SCRIPT 2:
-- 1. Certifique-se de que sua tabela `profiles` possui as colunas:
--    `target_glucose_low`, `target_glucose_high`,
--    `hypo_glucose_threshold`, `hyper_glucose_threshold`.
--    Se você encontrar erros como "column ... does not exist" para a tabela 'profiles',
--    significa que o esquema da sua tabela pode estar desatualizado.
--    Execute os seguintes comandos `ALTER TABLE` ANTES de rodar este script de povoamento,
--    se essas colunas estiverem faltando:
/*
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_glucose_low integer;
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_glucose_high integer;
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hypo_glucose_threshold integer;
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hyper_glucose_threshold integer;
*/
--
-- 2. Este script assume que o trigger `handle_new_user` está ativo e criará
--    uma entrada básica em `public.profiles` quando um usuário for inserido em `auth.users`.
--    O script então ATUALIZARÁ essas entradas em `public.profiles`.
--
-- 3. As senhas para os usuários de exemplo são 'password123'.
--

DO $$
DECLARE
    user_ana_id uuid := uuid_generate_v4();
    user_bruno_id uuid := uuid_generate_v4();
    user_charles_id uuid := uuid_generate_v4();
    fixed_bcrypt_hash text := '$2a$10$AbstractRandomSaltForTestinggAcz5NAnDB5dQDcpcVz5g3jFv0iV2u'; -- Hash para 'password123' (exemplo)
BEGIN
    RAISE NOTICE 'Iniciando o povoamento do banco de dados...';

    -- Usuário 1: Ana Silva
    RAISE NOTICE 'Criando usuário Ana Silva (ana.silva@example.com)...';
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_ana_id, 'authenticated', 'authenticated', 'ana.silva@example.com', fixed_bcrypt_hash, now(), NULL, NULL, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Ana Silva', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=AS'),
        now(), now(), NULL, '', NULL
    );
    -- Atualizar perfil da Ana (o trigger handle_new_user já deve ter criado a entrada básica)
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

    -- Usuário 2: Bruno Costa
    RAISE NOTICE 'Criando usuário Bruno Costa (bruno.costa@example.com)...';
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_bruno_id, 'authenticated', 'authenticated', 'bruno.costa@example.com', fixed_bcrypt_hash, now(), NULL, NULL, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Bruno Costa', 'language_preference', 'pt-BR', 'avatar_url', 'https://placehold.co/150x150.png?text=BC'),
        now(), now(), NULL, '', NULL
    );
    UPDATE public.profiles SET
        name = 'Bruno Costa',
        email = 'bruno.costa@example.com',
        avatar_url = 'https://placehold.co/150x150.png?text=BC',
        date_of_birth = '1992-11-20',
        diabetes_type = 'tipo2',
        language_preference = 'pt-BR',
        target_glucose_low = 90,
        target_glucose_high = 180,
        hypo_glucose_threshold = 75,
        hyper_glucose_threshold = 220,
        updated_at = now()
    WHERE id = user_bruno_id;

    -- Usuário 3: Charles Smith (Exemplo Internacional)
    RAISE NOTICE 'Criando usuário Charles Smith (charles.smith@example.com)...';
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', user_charles_id, 'authenticated', 'authenticated', 'charles.smith@example.com', fixed_bcrypt_hash, now(), NULL, NULL, now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Charles Smith', 'language_preference', 'en-US', 'avatar_url', 'https://placehold.co/150x150.png?text=CS'),
        now(), now(), NULL, '', NULL
    );
    UPDATE public.profiles SET
        name = 'Charles Smith',
        email = 'charles.smith@example.com',
        avatar_url = 'https://placehold.co/150x150.png?text=CS',
        date_of_birth = '1978-03-10',
        diabetes_type = 'outro',
        language_preference = 'en-US',
        target_glucose_low = 70,
        target_glucose_high = 150,
        hypo_glucose_threshold = 65,
        hyper_glucose_threshold = 180,
        updated_at = now()
    WHERE id = user_charles_id;


    RAISE NOTICE 'Inserindo dados de exemplo para Ana Silva...';
    -- Leituras de Glicemia para Ana Silva
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_ana_id, 95, now() - interval '3 days' - interval '8 hours', 'jejum', 'Acordei bem', 'normal'),
    (user_ana_id, 150, now() - interval '3 days' - interval '6 hours', 'depois_refeicao', 'Café da manhã reforçado', 'alta'),
    (user_ana_id, 110, now() - interval '2 days' - interval '12 hours', 'antes_refeicao', 'Antes do almoço', 'normal'),
    (user_ana_id, 180, now() - interval '2 days' - interval '10 hours', 'depois_refeicao', 'Almoço com sobremesa', 'muito_alta'),
    (user_ana_id, 65, now() - interval '1 day' - interval '5 hours', 'outro', 'Após exercício intenso', 'baixa');

    -- Registros de Insulina para Ana Silva
    INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES
    (user_ana_id, 'Rápida (Lispro)', 8, now() - interval '3 days' - interval '6 hours'),
    (user_ana_id, 'Lenta (Glargina)', 20, now() - interval '3 days' - interval '22 hours'),
    (user_ana_id, 'Rápida (Lispro)', 10, now() - interval '2 days' - interval '10 hours');

    -- Análises de Refeição para Ana Silva
    INSERT INTO public.meal_analyses (user_id, timestamp, image_url, food_identification, macronutrient_estimates, estimated_glucose_impact, suggested_insulin_dose, improvement_tips) VALUES
    (user_ana_id, now() - interval '2 days' - interval '10 hours', 'https://placehold.co/300x200.png?text=Prato+Saboroso',
     'Frango grelhado, arroz integral, brócolis e uma pequena porção de mousse de chocolate.',
     '{"carbohydrates": 60, "protein": 40, "fat": 25}',
     'Elevação moderada a alta da glicemia devido aos carboidratos do arroz e da sobremesa.',
     '10 unidades de insulina rápida.',
     'Considerar uma porção menor de sobremesa ou optar por frutas. Aumentar a quantidade de vegetais no prato.');

    -- Atividades Físicas para Ana Silva
    INSERT INTO public.activity_logs (user_id, timestamp, activity_type, duration_minutes, intensity, notes) VALUES
    (user_ana_id, now() - interval '1 day' - interval '6 hours', 'corrida', 45, 'moderada', 'Corrida leve no parque.');

    -- Lembretes para Ana Silva
    INSERT INTO public.reminders (user_id, type, name, time, days, enabled, insulin_type, insulin_dose) VALUES
    (user_ana_id, 'glicemia', 'Glicemia em Jejum', '07:00:00', 'todos_os_dias', true, null, null),
    (user_ana_id, 'insulina', 'Insulina Basal Noturna', '22:00:00', 'todos_os_dias', true, 'Lenta (Glargina)', 20);

    RAISE NOTICE 'Inserindo dados de exemplo para Bruno Costa...';
    -- Leituras de Glicemia para Bruno Costa
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (user_bruno_id, 120, now() - interval '3 days' - interval '7 hours', 'jejum', NULL, 'alta'),
    (user_bruno_id, 190, now() - interval '2 days' - interval '11 hours', 'depois_refeicao', 'Pizza no jantar', 'muito_alta'),
    (user_bruno_id, 105, now() - interval '1 day' - interval '9 hours', 'antes_refeicao', 'Antes do café', 'normal');

    -- Registros de Insulina para Bruno Costa (Pode não usar insulina dependendo do Tipo 2)
    -- INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES ...

    -- Atividades Físicas para Bruno Costa
    INSERT INTO public.activity_logs (user_id, timestamp, activity_type, duration_minutes, intensity, notes) VALUES
    (user_bruno_id, now() - interval '2 days' - interval '18 hours', 'caminhada', 60, 'leve', 'Caminhada pós trabalho.');

    -- Lembretes para Bruno Costa
    INSERT INTO public.reminders (user_id, type, name, time, days, enabled) VALUES
    (user_bruno_id, 'glicemia', 'Medir Glicemia (Manhã)', '08:30:00', '["Seg", "Qua", "Sex"]', true),
    (user_bruno_id, 'glicemia', 'Medir Glicemia (Noite)', '20:00:00', '["Seg", "Qua", "Sex"]', true);


    RAISE NOTICE 'Povoamento concluído com sucesso!';
    RAISE NOTICE 'Credenciais de login (senha: password123):';
    RAISE NOTICE 'Ana Silva: ana.silva@example.com';
    RAISE NOTICE 'Bruno Costa: bruno.costa@example.com';
    RAISE NOTICE 'Charles Smith: charles.smith@example.com';

END $$;

