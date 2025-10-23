/*
  # Adicionar coluna tempodeentrega na tabela whatsapp_numbers

  1. Alterações na Tabela
    - Adicionar coluna `tempodeentrega` à tabela `whatsapp_numbers`
    - Tipo: text, permite armazenar tempo estimado de entrega (ex: "2-3 dias", "24 horas", etc.)
    - Valor padrão: null (opcional)

  2. Descrição
    - Permite que usuários definam uma estimativa de entrega para cada agente
    - O valor pode ser editado a qualquer momento através da interface
    - Campo utilizado para informar clientes sobre prazos estimados
*/

-- Adicionar coluna tempodeentrega à tabela whatsapp_numbers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_numbers' AND column_name = 'tempodeentrega'
  ) THEN
    ALTER TABLE whatsapp_numbers ADD COLUMN tempodeentrega text;

    -- Adicionar comentário para documentar o propósito da coluna
    COMMENT ON COLUMN whatsapp_numbers.tempodeentrega IS 'Estimativa de tempo de entrega configurada pelo usuário (ex: "2-3 dias", "24 horas", "7 dias úteis")';

    RAISE NOTICE 'Coluna tempodeentrega adicionada com sucesso à tabela whatsapp_numbers';
  ELSE
    RAISE NOTICE 'Coluna tempodeentrega já existe na tabela whatsapp_numbers';
  END IF;
END $$;
