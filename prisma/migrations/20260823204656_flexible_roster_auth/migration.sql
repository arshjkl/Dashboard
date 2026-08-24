/*
  Flexible roster authentication migration.

  Existing users are preserved.

  Existing username is derived from the
  portion of the existing email before "@".

  Example:
    manager@test.com
    -> manager
*/

-- Drop old email indexes.
DROP INDEX IF EXISTS "User_email_idx";
DROP INDEX IF EXISTS "User_email_key";

-- Add username as nullable first so existing
-- users can be migrated safely.
ALTER TABLE "User"
ADD COLUMN "username" TEXT;

-- Populate usernames for existing users.
UPDATE "User"
SET "username" = split_part("email", '@', 1)
WHERE "username" IS NULL;

-- Username is mandatory after existing rows
-- have been populated.
ALTER TABLE "User"
ALTER COLUMN "username" SET NOT NULL;

-- Email is now optional because players
-- authenticate using IGN + password.
ALTER TABLE "User"
ALTER COLUMN "email" DROP NOT NULL;

-- New indexes.
CREATE INDEX "TeamMember_teamId_rosterOrder_idx"
ON "TeamMember"("teamId", "rosterOrder");

CREATE INDEX "User_teamId_role_idx"
ON "User"("teamId", "role");

CREATE INDEX "User_teamId_username_idx"
ON "User"("teamId", "username");

CREATE UNIQUE INDEX "User_teamId_username_key"
ON "User"("teamId", "username");