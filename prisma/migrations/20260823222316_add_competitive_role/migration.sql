/*
  Warnings:

  - The values [ONGOING] on the enum `TournamentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `type` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the `TournamentMap` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TournamentStatus_new" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Tournament" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tournament" ALTER COLUMN "status" TYPE "TournamentStatus_new" USING ("status"::text::"TournamentStatus_new");
ALTER TYPE "TournamentStatus" RENAME TO "TournamentStatus_old";
ALTER TYPE "TournamentStatus_new" RENAME TO "TournamentStatus";
DROP TYPE "public"."TournamentStatus_old";
ALTER TABLE "Tournament" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';
COMMIT;

-- DropForeignKey
ALTER TABLE "TournamentMap" DROP CONSTRAINT "TournamentMap_tournamentId_fkey";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "competitiveRole" TEXT;

-- DropTable
DROP TABLE "TournamentMap";

-- DropEnum
DROP TYPE "ChannelType";

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_channelId_createdAt_idx" ON "Message"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
