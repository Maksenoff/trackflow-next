-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_podium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "label" TEXT,
    "level" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "performance" TEXT,
    "recordedAt" DATETIME NOT NULL,
    "venue" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ffa',
    CONSTRAINT "podium_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_podium" ("athleteId", "discipline", "id", "label", "level", "performance", "rank", "recordedAt", "venue", "year") SELECT "athleteId", "discipline", "id", "label", "level", "performance", "rank", "recordedAt", "venue", "year" FROM "podium";
DROP TABLE "podium";
ALTER TABLE "new_podium" RENAME TO "podium";
CREATE UNIQUE INDEX "podium_athleteId_year_rank_discipline_recordedAt_key" ON "podium"("athleteId", "year", "rank", "discipline", "recordedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
