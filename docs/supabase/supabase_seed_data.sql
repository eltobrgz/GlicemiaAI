--------------------------------------------------------------------------------
-- GlicemiaAI - SCRIPT DE POVOAMENTO DE DADOS (SEED)
--
-- Este script irá:
-- 1.  Criar dois usuários de exemplo (`usuario.teste@example.com` e `medico.teste@example.com`).
-- 2.  Povoar as tabelas com dados de exemplo para o `usuario.teste@example.com`, incluindo glicemia, insulina, medicamentos, atividades, etc.
--
-- INSTRUÇÕES DE USO:
-- 1.  Certifique-se de que as tabelas já foram criadas (execute `supabase_schema_create.sql` primeiro).
-- 2.  Para facilitar o teste, você pode desabilitar a confirmação de email no painel do Supabase em "Authentication" -> "Settings".
-- 3.  Navegue até o SQL Editor no seu painel Supabase.
-- 4.  Copie e cole TODO o conteúdo deste arquivo.
-- 5.  Clique em "RUN".
-- 6.  Verifique a saída "Messages" para as credenciais de login dos usuários de exemplo.
--------------------------------------------------------------------------------

-- Desabilita a segurança a nível de linha temporariamente para inserir dados
-- como se fôssemos o sistema, não um usuário específico.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_readings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.insulin_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    -- Variáveis para armazenar os IDs dos usuários criados
    test_user_id UUID;
    doctor_user_id UUID;
BEGIN

    -- 1. Criar usuários de exemplo
    -- Senha para ambos é "password123"
    
    -- Cria o primeiro usuário e obtém seu ID
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'usuario.teste@example.com', crypt('password123', gen_salt('bf')), NOW(), NULL, NULL, NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Usuário de Teste"}',
        NOW(), NOW(), NULL, '', NULL, NOW()
    ) RETURNING id INTO test_user_id;

    -- Cria o segundo usuário (médico) e obtém seu ID
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'medico.teste@example.com', crypt('password123', gen_salt('bf')), NOW(), NULL, NULL, NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Dr. House"}',
        NOW(), NOW(), NULL, '', NULL, NOW()
    ) RETURNING id INTO doctor_user_id;

    -- O trigger `on_auth_user_created` cuidará da criação dos perfis básicos.
    -- Agora, vamos atualizar o perfil do usuário de teste com mais detalhes.
    UPDATE public.profiles
    SET 
        date_of_birth = '1990-05-15',
        diabetes_type = 'tipo1',
        hypo_glucose_threshold = 70,
        target_glucose_low = 80,
        target_glucose_high = 180,
        hyper_glucose_threshold = 250,
        updated_at = NOW()
    WHERE id = test_user_id;
    
    -- 2. Inserir dados de exemplo para `usuario.teste@example.com`

    -- Registros de Glicemia
    INSERT INTO public.glucose_readings (user_id, value, timestamp, meal_context, notes, level) VALUES
    (test_user_id, 95, NOW() - INTERVAL '3 days', 'jejum', 'Acordei bem', 'normal'),
    (test_user_id, 150, NOW() - INTERVAL '3 days' + INTERVAL '4 hours', 'depois_refeicao', 'Após o almoço', 'alta'),
    (test_user_id, 65, NOW() - INTERVAL '2 days' + INTERVAL '8 hours', 'outro', 'Senti tremedeira', 'baixa'),
    (test_user_id, 190, NOW() - INTERVAL '2 days' + INTERVAL '12 hours', 'depois_refeicao', 'Jantar com pizza', 'muito_alta'),
    (test_user_id, 110, NOW() - INTERVAL '1 day', 'antes_refeicao', 'Antes do café da manhã', 'normal');

    -- Registros de Insulina
    INSERT INTO public.insulin_logs (user_id, type, dose, timestamp) VALUES
    (test_user_id, 'Rápida (Lispro)', 5, NOW() - INTERVAL '3 days' + INTERVAL '4 hours'),
    (test_user_id, 'Lenta (Glargina)', 20, NOW() - INTERVAL '3 days' + INTERVAL '22 hours'),
    (test_user_id, 'Rápida (Lispro)', 8, NOW() - INTERVAL '2 days' + INTERVAL '12 hours'),
    (test_user_id, 'Lenta (Glargina)', 20, NOW() - INTERVAL '2 days' + INTERVAL '22 hours');

    -- Registros de Atividades
    INSERT INTO public.activity_logs (user_id, activity_type, duration_minutes, intensity, timestamp, notes) VALUES
    (test_user_id, 'caminhada', 30, 'moderada', NOW() - INTERVAL '3 days' + INTERVAL '18 hours', 'Caminhada no parque'),
    (test_user_id, 'musculacao', 60, 'intensa', NOW() - INTERVAL '1 day' + INTERVAL '19 hours', 'Treino de pernas');

    -- Registros de Medicamentos
    INSERT INTO public.medication_logs (user_id, medication_name, dosage, timestamp) VALUES
    (test_user_id, 'Metformina', '500mg', NOW() - INTERVAL '3 days' + INTERVAL '8 hours'),
    (test_user_id, 'Vitamina D', '2000UI', NOW() - INTERVAL '2 days' + INTERVAL '8 hours');

    -- Lembretes
    INSERT INTO public.reminders (user_id, type, name, time, days, enabled, insulin_type, insulin_dose) VALUES
    (test_user_id, 'glicemia', 'Glicemia em Jejum', '07:00:00', '["Seg", "Qua", "Sex"]'::jsonb, true, NULL, NULL),
    (test_user_id, 'insulina', 'Insulina Lenta Noturna', '22:00:00', '"todos_os_dias"'::jsonb, true, 'Lenta (Glargina)', 20);

    -- Mensagem de sucesso com credenciais
    RAISE NOTICE 'Usuários de exemplo criados com sucesso!';
    RAISE NOTICE '-----------------------------------------';
    RAISE NOTICE 'Usuário 1: usuario.teste@example.com';
    RAISE NOTICE 'Usuário 2: medico.teste@example.com';
    RAISE NOTICE 'Senha para ambos: password123';
    RAISE NOTICE '-----------------------------------------';

END $$;

-- Reabilita a segurança a nível de linha
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insulin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- FIM DO SCRIPT
--------------------------------------------------------------------------------
