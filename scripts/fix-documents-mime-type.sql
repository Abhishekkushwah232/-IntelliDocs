-- Run in Supabase SQL Editor if API fails with missing columns on public.documents.

-- column "mime_type" does not exist
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type text;

-- column "content" does not exist (stores extracted file text for chat)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
ALTER TABLE public.documents ALTER COLUMN content DROP DEFAULT;

-- column "created_at" does not exist
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
