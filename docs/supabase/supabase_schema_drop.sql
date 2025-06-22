--------------------------------------------------------------------------------
-- GlicemiaAI - SCRIPT DE EXCLUSÃO DO ESQUEMA DO BANCO DE DADOS
--
-- ATENÇÃO! ESTE SCRIPT É DESTRUTIVO.
--
-- Ele irá:
-- 1. Apagar TODAS as tabelas da aplicação (`medication_logs`, `activity_logs`, `reminders`, `meal_analyses`, `insulin_logs`, `glucose_readings`, `profiles`).
-- 2. Apagar a função e o trigger que cuidam da criação de novos perfis.
-- 3. (Opcional, descomente para usar) Apagar TODOS os usuários da tabela `auth.users`.
--
-- USE COM EXTREMO CUIDADO. Ideal para resetar completamente o ambiente de desenvolvimento.
--
-- INSTRUÇÕES DE USO:
-- 1. Navegue até o SQL Editor no seu painel Supabase.
-- 2. Copie e cole o conteúdo deste arquivo.
-- 3. **DESCOMENTE** as linhas `DROP TABLE IF EXISTS ...` que você deseja executar.
-- 4. Clique em "RUN".
--------------------------------------------------------------------------------

-- Apaga as tabelas. A ordem é importante devido às Foreign Keys.
DROP TABLE IF EXISTS public.medication_logs;
DROP TABLE IF EXISTS public.activity_logs;
DROP TABLE IF EXISTS public.reminders;
DROP TABLE IF EXISTS public.meal_analyses;
DROP TABLE IF EXISTS public.insulin_logs;
DROP TABLE IF EXISTS public.glucose_readings;
DROP TABLE IF EXISTS public.profiles;

-- Apaga a função e o trigger.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();


-- CUIDADO: O comando abaixo apaga TODOS os usuários da sua aplicação.
-- Descomente apenas se tiver certeza absoluta que quer limpar todos os usuários.
-- DELETE FROM auth.users;

--------------------------------------------------------------------------------
-- FIM DO SCRIPT
--------------------------------------------------------------------------------
