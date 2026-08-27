-- DropIndex
DROP INDEX "performance_athleteId_idx";

-- DropTable
DROP TABLE "playing_with_neon";

-- CreateIndex
CREATE INDEX "performance_athleteId_recordedAt_idx" ON "performance"("athleteId", "recordedAt");

-- CreateIndex
CREATE INDEX "performance_recordedAt_idx" ON "performance"("recordedAt");

