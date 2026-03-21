-- Prefer scripts/repair-all-tables.sql — one idempotent script for every app table/column.
--
-- Run in Supabase SQL Editor if chat fails with:
-- column "user_id" of relation "messages" does not exist
--
-- Backfills user_id from the parent conversation, removes orphan rows, then enforces NOT NULL.

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.messages AS m
SET user_id = c.user_id
FROM public.conversations AS c
WHERE m.conversation_id = c.id AND m.user_id IS NULL;

DELETE FROM public.messages WHERE user_id IS NULL;

ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;
