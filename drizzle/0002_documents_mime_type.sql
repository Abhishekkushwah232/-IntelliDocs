-- Fix DBs created before mime_type was added (e.g. manual SQL or older schema).
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "mime_type" text;
