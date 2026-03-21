ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "user_id" uuid;
UPDATE "messages" AS m
SET "user_id" = c."user_id"
FROM "conversations" AS c
WHERE m."conversation_id" = c."id" AND m."user_id" IS NULL;
DELETE FROM "messages" WHERE "user_id" IS NULL;
ALTER TABLE "messages" ALTER COLUMN "user_id" SET NOT NULL;
