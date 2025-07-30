-- supabase_delete_test_users.sql
-- Este script apaga os usuários de teste criados pelos scripts de povoamento anteriores.
-- É seguro executar este script mesmo que os usuários não existam.

-- ATENÇÃO: Use este script com cuidado. Ele é projetado para apagar APENAS
-- os usuários de teste específicos listados abaixo.

-- A função 'get_user_id' é usada para encontrar o ID do usuário pelo email.
CREATE OR REPLACE FUNCTION get_user_id(user_email TEXT)
RETURNS UUID AS $$
DECLARE
    user_id_result UUID;
BEGIN
    SELECT id INTO user_id_result FROM auth.users WHERE email = user_email;
    RETURN user_id_result;
END;
$$ LANGUAGE plpgsql;

-- Apaga os usuários de teste.
-- A exclusão em 'auth.users' irá apagar em cascata os dados associados
-- em 'profiles', 'glucose_readings', etc., devido às configurações de chave estrangeira.
DELETE FROM auth.users WHERE id IN (
  get_user_id('ana.silva@example.com'),
  get_user_id('bruno.costa@example.com'),
  get_user_id('carla.dias@example.com')
);

-- Mensagem de confirmação
SELECT 'Usuários de teste (Ana, Bruno, Carla), se existirem, foram apagados com sucesso.' AS "status";
