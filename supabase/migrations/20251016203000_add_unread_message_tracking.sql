/*
  # Add Unread Message Tracking System

  ## Overview
  This migration enhances the messaging system to properly track unread messages for both WhatsApp and Instagram platforms.

  ## Changes

  1. Instagram Messages Table
    - Add `is_read` boolean column to track read status
    - Add `read_at` timestamp to track when message was read
    - Add index for efficient unread message queries
    - Set default values based on message direction (sent = read, received = unread)

  2. WhatsApp Messages Table
    - Ensure `status_entrega` is properly used for read tracking
    - Add additional indexes for performance

  3. Functions
    - Create function to mark Instagram messages as read
    - Update function to get unread counts per conversation

  4. Security
    - RLS policies already in place, no changes needed
*/

-- ========================================
-- INSTAGRAM MESSAGES: Add Read Tracking
-- ========================================

-- Add is_read column to conversas_instagram
DO $$
BEGIN
  -- Add is_read column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversas_instagram' AND column_name = 'is_read'
  ) THEN
    -- Add column as nullable first
    ALTER TABLE conversas_instagram ADD COLUMN is_read boolean;

    -- Set default values based on direction
    -- Sent messages are automatically read (we sent them)
    -- Received messages are unread by default
    UPDATE conversas_instagram
    SET is_read = CASE
      WHEN LOWER(direcao) = 'sent' THEN true
      WHEN LOWER(direcao) = 'received' THEN false
      ELSE false  -- Default to unread if direction is unclear
    END
    WHERE is_read IS NULL;

    -- Make column NOT NULL with default
    ALTER TABLE conversas_instagram
      ALTER COLUMN is_read SET DEFAULT false,
      ALTER COLUMN is_read SET NOT NULL;

    RAISE NOTICE 'Added is_read column to conversas_instagram';
  ELSE
    RAISE NOTICE 'Column is_read already exists in conversas_instagram';
  END IF;

  -- Add read_at timestamp column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversas_instagram' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE conversas_instagram ADD COLUMN read_at timestamptz;

    -- For existing messages marked as read, set read_at to created_at
    UPDATE conversas_instagram
    SET read_at = created_at
    WHERE is_read = true AND read_at IS NULL;

    RAISE NOTICE 'Added read_at column to conversas_instagram';
  ELSE
    RAISE NOTICE 'Column read_at already exists in conversas_instagram';
  END IF;
END $$;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Instagram: Index for unread messages queries
CREATE INDEX IF NOT EXISTS idx_conversas_instagram_is_read
ON conversas_instagram(is_read)
WHERE is_read = false;

-- Instagram: Index for user's unread messages
CREATE INDEX IF NOT EXISTS idx_conversas_instagram_user_unread
ON conversas_instagram(user_id, is_read, data_hora DESC)
WHERE is_read = false;

-- Instagram: Index for sender unread messages
CREATE INDEX IF NOT EXISTS idx_conversas_instagram_sender_unread
ON conversas_instagram(sender_id, user_id, is_read)
WHERE is_read = false;

-- WhatsApp: Additional index for unread messages
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_user_unread
ON mensagens_whatsapp(user_id, status_entrega, data_hora DESC)
WHERE status_entrega != 'read';

-- WhatsApp: Index for conversation unread count
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_conversa_unread
ON mensagens_whatsapp(conversa_id, user_id, status_entrega, direcao)
WHERE status_entrega != 'read' AND direcao = 'received';

-- ========================================
-- FUNCTIONS FOR READ TRACKING
-- ========================================

-- Function to mark Instagram messages as read by sender_id
CREATE OR REPLACE FUNCTION mark_instagram_messages_as_read(
  p_sender_id text,
  p_user_id uuid DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  affected_count integer;
  user_id_final uuid;
BEGIN
  -- Use provided user_id or current authenticated user
  user_id_final := COALESCE(p_user_id, auth.uid());

  -- Validate parameters
  IF p_sender_id IS NULL OR user_id_final IS NULL THEN
    RAISE EXCEPTION 'sender_id and user_id are required';
  END IF;

  -- Update all unread received messages from this sender
  UPDATE conversas_instagram
  SET
    is_read = true,
    read_at = now(),
    updated_at = now()
  WHERE
    sender_id = p_sender_id
    AND user_id = user_id_final
    AND LOWER(direcao) = 'received'
    AND is_read = false;

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  RAISE NOTICE 'Marked % messages as read for sender %', affected_count, p_sender_id;

  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark WhatsApp messages as read by conversa_id
CREATE OR REPLACE FUNCTION mark_whatsapp_messages_as_read(
  p_conversa_id text,
  p_user_id uuid DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  affected_count integer;
  user_id_final uuid;
BEGIN
  -- Use provided user_id or current authenticated user
  user_id_final := COALESCE(p_user_id, auth.uid());

  -- Validate parameters
  IF p_conversa_id IS NULL OR user_id_final IS NULL THEN
    RAISE EXCEPTION 'conversa_id and user_id are required';
  END IF;

  -- Update all unread received messages from this conversation
  UPDATE mensagens_whatsapp
  SET
    status_entrega = 'read',
    updated_at = now()
  WHERE
    conversa_id = p_conversa_id
    AND user_id = user_id_final
    AND direcao = 'received'
    AND status_entrega != 'read';

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  -- Also update the conversation's unread counter
  UPDATE conversas_whatsapp
  SET
    nao_lidas = 0,
    updated_at = now()
  WHERE
    conversa_id = p_conversa_id
    AND user_id = user_id_final;

  RAISE NOTICE 'Marked % messages as read for conversation %', affected_count, p_conversa_id;

  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count for Instagram by sender
CREATE OR REPLACE FUNCTION get_instagram_unread_count(
  p_sender_id text,
  p_user_id uuid DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  unread_count integer;
  user_id_final uuid;
BEGIN
  user_id_final := COALESCE(p_user_id, auth.uid());

  SELECT COUNT(*)::integer INTO unread_count
  FROM conversas_instagram
  WHERE
    sender_id = p_sender_id
    AND user_id = user_id_final
    AND LOWER(direcao) = 'received'
    AND is_read = false;

  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count for WhatsApp by conversation
CREATE OR REPLACE FUNCTION get_whatsapp_unread_count(
  p_conversa_id text,
  p_user_id uuid DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  unread_count integer;
  user_id_final uuid;
BEGIN
  user_id_final := COALESCE(p_user_id, auth.uid());

  SELECT COUNT(*)::integer INTO unread_count
  FROM mensagens_whatsapp
  WHERE
    conversa_id = p_conversa_id
    AND user_id = user_id_final
    AND direcao = 'received'
    AND status_entrega != 'read';

  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total unread count for a user (all platforms)
CREATE OR REPLACE FUNCTION get_total_unread_count(
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  user_id_final uuid;
  whatsapp_unread integer;
  instagram_unread integer;
  total_unread integer;
BEGIN
  user_id_final := COALESCE(p_user_id, auth.uid());

  -- Count unread WhatsApp messages
  SELECT COUNT(*)::integer INTO whatsapp_unread
  FROM mensagens_whatsapp
  WHERE
    user_id = user_id_final
    AND direcao = 'received'
    AND status_entrega != 'read';

  -- Count unread Instagram messages
  SELECT COUNT(*)::integer INTO instagram_unread
  FROM conversas_instagram
  WHERE
    user_id = user_id_final
    AND LOWER(direcao) = 'received'
    AND is_read = false;

  total_unread := COALESCE(whatsapp_unread, 0) + COALESCE(instagram_unread, 0);

  RETURN jsonb_build_object(
    'total', total_unread,
    'whatsapp', COALESCE(whatsapp_unread, 0),
    'instagram', COALESCE(instagram_unread, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGER TO AUTO-SET is_read ON INSERT
-- ========================================

-- Trigger function to automatically set is_read for new Instagram messages
CREATE OR REPLACE FUNCTION set_instagram_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If direction is sent, mark as read automatically (we sent it)
  -- If direction is received, mark as unread
  IF NEW.is_read IS NULL THEN
    NEW.is_read := CASE
      WHEN LOWER(NEW.direcao) = 'sent' THEN true
      ELSE false
    END;

    -- If marking as read, set read_at timestamp
    IF NEW.is_read = true THEN
      NEW.read_at := COALESCE(NEW.read_at, now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Instagram messages
DROP TRIGGER IF EXISTS trigger_set_instagram_read_status ON conversas_instagram;
CREATE TRIGGER trigger_set_instagram_read_status
  BEFORE INSERT ON conversas_instagram
  FOR EACH ROW
  EXECUTE FUNCTION set_instagram_message_read_status();

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT EXECUTE ON FUNCTION mark_instagram_messages_as_read(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_whatsapp_messages_as_read(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_instagram_unread_count(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_whatsapp_unread_count(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_unread_count(uuid) TO authenticated;

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON COLUMN conversas_instagram.is_read IS 'Indicates if the message has been read by the user. Sent messages are automatically marked as read.';
COMMENT ON COLUMN conversas_instagram.read_at IS 'Timestamp when the message was marked as read';
COMMENT ON FUNCTION mark_instagram_messages_as_read IS 'Marks all unread received messages from a specific sender as read';
COMMENT ON FUNCTION mark_whatsapp_messages_as_read IS 'Marks all unread received messages in a conversation as read';
COMMENT ON FUNCTION get_instagram_unread_count IS 'Returns the count of unread messages from a specific Instagram sender';
COMMENT ON FUNCTION get_whatsapp_unread_count IS 'Returns the count of unread messages in a WhatsApp conversation';
COMMENT ON FUNCTION get_total_unread_count IS 'Returns total unread message counts across all platforms for a user';

-- ========================================
-- VERIFICATION
-- ========================================

DO $$
DECLARE
  instagram_total integer;
  instagram_unread integer;
  whatsapp_total integer;
  whatsapp_unread integer;
BEGIN
  -- Count Instagram messages
  SELECT COUNT(*)::integer INTO instagram_total FROM conversas_instagram;
  SELECT COUNT(*)::integer INTO instagram_unread
  FROM conversas_instagram
  WHERE is_read = false AND LOWER(direcao) = 'received';

  -- Count WhatsApp messages
  SELECT COUNT(*)::integer INTO whatsapp_total FROM mensagens_whatsapp;
  SELECT COUNT(*)::integer INTO whatsapp_unread
  FROM mensagens_whatsapp
  WHERE status_entrega != 'read' AND direcao = 'received';

  RAISE NOTICE '✅ Unread tracking migration completed successfully';
  RAISE NOTICE 'Instagram: % total messages, % unread', instagram_total, instagram_unread;
  RAISE NOTICE 'WhatsApp: % total messages, % unread', whatsapp_total, whatsapp_unread;
END $$;
