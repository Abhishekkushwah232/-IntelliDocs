-- IntelliDocs demo — create app tables in Supabase Postgres.
-- Run in: Supabase Dashboard → SQL Editor → New query → Paste → Run.
-- Safe to run more than once (skips objects that already exist).

-- gen_random_uuid() is available on Supabase Postgres without extra extensions.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
    CREATE TYPE public.message_role AS ENUM ('user', 'assistant');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY NOT NULL,
  email text NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role public.message_role NOT NULL,
  content text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Older DBs: messages without user_id (app requires it for isolation).
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id uuid;
UPDATE public.messages AS m
SET user_id = c.user_id
FROM public.conversations AS c
WHERE m.conversation_id = c.id AND m.user_id IS NULL;
DELETE FROM public.messages WHERE user_id IS NULL;
ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  filename text NOT NULL,
  mime_type text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- If documents existed without mime_type (older manual runs), add the column.
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type text;

-- Extracted text for RAG/chat (required by the app).
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
ALTER TABLE public.documents ALTER COLUMN content DROP DEFAULT;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
