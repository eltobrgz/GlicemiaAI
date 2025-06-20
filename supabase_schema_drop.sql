-- #####################################################################
-- # SCRIPT PARA APAGAR COMPLETAMENTE TODAS AS TABELAS DA APLICAÇÃO   #
-- #####################################################################
-- ATENÇÃO: ESTE SCRIPT APAGARÁ TODOS OS DADOS DAS TABELAS DA APLICAÇÃO.
-- USE COM EXTREMA CAUTELA. FAÇA BACKUP ANTES SE NECESSÁRIO.
-- Descomente as linhas abaixo para executar.

-- DROP TABLE IF EXISTS public.activity_logs CASCADE;
-- DROP TABLE IF EXISTS public.reminders CASCADE;
-- DROP TABLE IF EXISTS public.meal_analyses CASCADE;
-- DROP TABLE IF EXISTS public.insulin_logs CASCADE;
-- DROP TABLE IF EXISTS public.glucose_readings CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE; -- Deve ser a última tabela relacionada a dados do usuário, ou deletar auth.users primeiro

-- Para apagar os usuários e todos os dados relacionados por cascade:
-- Descomente a linha abaixo COM MUITO CUIDADO. Isso apagará os usuários do sistema e, por CASCADE,
-- os registros nas tabelas que têm user_id como foreign key.
-- DELETE FROM auth.users;

-- SELECT 'Script de deleção de tabelas concluído (se linhas foram descomentadas).';
