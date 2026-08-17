-- CreateTable
CREATE TABLE "podium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "performance" TEXT,
    "recordedAt" DATETIME NOT NULL,
    "venue" TEXT,
    CONSTRAINT "podium_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "podium_athleteId_year_rank_discipline_recordedAt_key" ON "podium"("athleteId", "year", "rank", "discipline", "recordedAt");
