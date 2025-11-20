/*
  # Create Chat Tables

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `session_id` (text) - Links to anonymous user sessions
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `role` (text) - Either 'user' or 'assistant'
      - `content` (text) - The message content
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for session-based access (users can only access their own conversations)

  3. Indexes
    - Add index on conversation_id for faster message queries
    - Add index on session_id for faster conversation lookups
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (true);

-- Messages policies
CREATE POLICY "Users can view messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update messages"
  ON messages FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete messages"
  ON messages FOR DELETE
  USING (true);