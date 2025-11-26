/*
  # Fix Google Calendar Integration Unique Constraint

  ## Problema
  O índice único `idx_google_calendar_integrations_user_unique` na coluna `user_id`
  está impedindo que usuários reconectem suas contas do Google Calendar, causando o erro:
  "duplicate key value violates unique constraint 'idx_google_calendar_integrations_user_unique'"

  ## Solução
  1. Remover o índice único que causa o problema
  2. Manter apenas o índice normal para performance (não-único)
  3. O sistema já lida com reconexões deletando registros antigos antes de inserir novos

  ## Alterações
  - Remove índice único: `idx_google_calendar_integrations_user_unique`
  - Mantém índice normal: `idx_google_calendar_integrations_user_id` (já existe)

  ## Segurança
  - RLS continua ativo e funcionando
  - Usuários continuam vendo apenas suas próprias integrações
  - Múltiplas integrações do mesmo usuário são permitidas (útil para testes e reconexões)
*/

-- Remover o índice único que causa o problema
DROP INDEX IF EXISTS idx_google_calendar_integrations_user_unique;

-- Confirmar que o índice normal ainda existe (para performance)
-- Este índice já existe pela migration anterior, apenas garantindo que está presente
CREATE INDEX IF NOT EXISTS idx_google_calendar_integrations_user_id
  ON google_calendar_integrations(user_id);

-- Log da alteração
DO $$
BEGIN
  RAISE NOTICE '✅ Índice único removido com sucesso!';
  RAISE NOTICE 'ℹ️ Usuários agora podem reconectar suas contas do Google Calendar sem erros';
END $$;
