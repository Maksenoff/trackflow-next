-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_member_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "sourceFeedbackId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "poll_sourceFeedbackId_fkey" FOREIGN KEY ("sourceFeedbackId") REFERENCES "feedback" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "app_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "poll_vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "votedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "poll_vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "poll_vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "team_member_teamId_athleteId_key" ON "team_member"("teamId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_sourceFeedbackId_key" ON "poll"("sourceFeedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_vote_pollId_userId_key" ON "poll_vote"("pollId", "userId");
