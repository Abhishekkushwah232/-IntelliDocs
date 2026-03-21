-- Run in Supabase SQL Editor if upload fails with:
-- column "content" of relation "documents" does not exist
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
ALTER TABLE public.documents ALTER COLUMN content DROP DEFAULT;
