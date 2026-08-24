-- AlterEnum
ALTER TYPE "TournamentStatus" ADD VALUE 'QUALIFIED';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "finalPosition" INTEGER,
ADD COLUMN     "totalPoints" INTEGER;

-- CreateTable
CREATE TABLE "TournamentRound" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "slotNumber" TEXT,
    "pointSystem" TEXT,
    "roomId" TEXT,
    "roomPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentRound_tournamentId_idx" ON "TournamentRound"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRound_tournamentId_roundNumber_key" ON "TournamentRound"("tournamentId", "roundNumber");

-- AddForeignKey
ALTER TABLE "TournamentRound" ADD CONSTRAINT "TournamentRound_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
