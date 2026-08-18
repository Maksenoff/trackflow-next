-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "sourceFeedbackId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "poll_sourceFeedbackId_fkey" FOREIGN KEY ("sourceFeedbackId") REFERENCES "feedback" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "app_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_poll" ("createdAt", "createdById", "expiresAt", "id", "question", "sourceFeedbackId") SELECT "createdAt", "createdById", "expiresAt", "id", "question", "sourceFeedbackId" FROM "poll";
DROP TABLE "poll";
ALTER TABLE "new_poll" RENAME TO "poll";
CREATE UNIQUE INDEX "poll_sourceFeedbackId_key" ON "poll"("sourceFeedbackId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
