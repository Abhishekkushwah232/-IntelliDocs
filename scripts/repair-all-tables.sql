-- IntelliDocs demo — align public schema with Drizzle (src/db/schema.ts).
-- Run in Supabase → SQL Editor. Idempotent: safe to run multiple times.
--
-- Fixes common drift: messages (user_id, meta, created_at, …), documents (mime_type, content, created_at), etc.

-- ---------------------------------------------------------------------------
-- 1) Enum for messages.role
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'message_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.message_role AS ENUM ('user', 'assistant');
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2) Tables (full shape; no-op if names already exist)
-- ---------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  filename text NOT NULL,
  mime_type text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3) profiles — add any missing columns (older manual schemas)
-- ---------------------------------------------------------------------------
-- user_id must exist before any UPDATE references it (some old tables only had email).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- If profiles.email was missing on an old table, backfill then enforce NOT NULL.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
UPDATE public.profiles
SET email = coalesce(user_id::text, gen_random_uuid()::text) || '@placeholder.invalid'
WHERE email IS NULL OR btrim(coalesce(email, '')) = '';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email IS NULL) THEN
    ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
  END IF;
END
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id IS NULL) THEN
    ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
  END IF;
END
$$;
-- If user_id stayed nullable, set each row to the matching auth user id (Supabase auth.users.id) before enforcing NOT NULL / PK.

-- ---------------------------------------------------------------------------
-- 4) conversations
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
UPDATE public.conversations SET title = '' WHERE title IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.conversations WHERE user_id IS NULL) THEN
    ALTER TABLE public.conversations ALTER COLUMN user_id SET NOT NULL;
  END IF;
END
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.conversations WHERE title IS NULL) THEN
    ALTER TABLE public.conversations ALTER COLUMN title SET NOT NULL;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 5) messages — columns often missing on drifted DBs
-- ---------------------------------------------------------------------------
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;
UPDATE public.messages SET meta = '{}'::jsonb WHERE meta IS NULL;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
UPDATE public.messages SET content = '' WHERE content IS NULL;
ALTER TABLE public.messages ALTER COLUMN content DROP DEFAULT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.messages WHERE content IS NULL) THEN
    ALTER TABLE public.messages ALTER COLUMN content SET NOT NULL;
  END IF;
END
$$;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- role: only applied when column is missing (IF NOT EXISTS skips otherwise).
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS role public.message_role NOT NULL DEFAULT 'user'::message_role;
ALTER TABLE public.messages ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id uuid;
UPDATE public.messages AS m
SET user_id = c.user_id
FROM public.conversations AS c
WHERE m.conversation_id = c.id AND m.user_id IS NULL;
DELETE FROM public.messages WHERE user_id IS NULL;

-- NOT NULL only when no NULLs remain (avoids failing on empty tables or broken rows).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.messages WHERE conversation_id IS NULL) THEN
    ALTER TABLE public.messages ALTER COLUMN conversation_id SET NOT NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.messages WHERE user_id IS NULL) THEN
    ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;
  END IF;
END
$$;

-- If messages.role is still text from an old DB, uncomment and run once (values must be user|assistant):
-- ALTER TABLE public.messages
--   ALTER COLUMN role TYPE public.message_role USING role::text::public.message_role;

-- ---------------------------------------------------------------------------
-- 6) documents — mime_type, extracted text, timestamps
-- ---------------------------------------------------------------------------
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type text;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
UPDATE public.documents SET content = '' WHERE content IS NULL;
ALTER TABLE public.documents ALTER COLUMN content DROP DEFAULT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.documents WHERE content IS NULL) THEN
    ALTER TABLE public.documents ALTER COLUMN content SET NOT NULL;
  END IF;
END
$$;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
