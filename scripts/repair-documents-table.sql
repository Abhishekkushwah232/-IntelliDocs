-- Prefer scripts/repair-all-tables.sql — one idempotent script for every app table/column.
--
-- Run once in Supabase SQL Editor if uploads fail with missing columns on public.documents.
-- Matches Drizzle schema: mime_type, content, created_at (+ id, user_id, filename from original CREATE).

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type text;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
ALTER TABLE public.documents ALTER COLUMN content DROP DEFAULT;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
