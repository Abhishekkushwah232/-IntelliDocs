-- Fix DBs where documents was created without extracted text column.
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "content" text NOT NULL DEFAULT '';
ALTER TABLE "documents" ALTER COLUMN "content" DROP DEFAULT;
