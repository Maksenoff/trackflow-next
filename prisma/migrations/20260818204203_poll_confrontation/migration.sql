/*
  Warnings:

  - You are about to drop the column `question` on the `poll` table. All the data in the column will be lost.
  - You are about to drop the column `sourceFeedbackId` on the `poll` table. All the data in the column will be lost.
  - You are about to drop the column `choice` on the `poll_vote` table. All the data in the column will be lost.
  - Added the required column `optionId` to the `poll_vote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "poll_option" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "poll_option_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "poll_option_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "app_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_poll" ("createdAt", "createdById", "expiresAt", "id", "startsAt") SELECT "createdAt", "createdById", "expiresAt", "id", "startsAt" FROM "poll";
DROP TABLE "poll";
ALTER TABLE "new_poll" RENAME TO "poll";
CREATE TABLE "new_poll_vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "poll_vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "poll_vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_option" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "poll_vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_poll_vote" ("id", "pollId", "userId", "votedAt") SELECT "id", "pollId", "userId", "votedAt" FROM "poll_vote";
DROP TABLE "poll_vote";
ALTER TABLE "new_poll_vote" RENAME TO "poll_vote";
CREATE UNIQUE INDEX "poll_vote_pollId_userId_key" ON "poll_vote"("pollId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "poll_option_feedbackId_key" ON "poll_option"("feedbackId");
