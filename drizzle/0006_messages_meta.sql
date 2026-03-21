ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "meta" jsonb DEFAULT '{}'::jsonb;
UPDATE "messages" SET "meta" = '{}'::jsonb WHERE "meta" IS NULL;
