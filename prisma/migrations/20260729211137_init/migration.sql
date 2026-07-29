-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedAthleteId" TEXT,
    CONSTRAINT "app_user_linkedAthleteId_fkey" FOREIGN KEY ("linkedAthleteId") REFERENCES "athlete" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "athlete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATETIME,
    "gender" TEXT,
    "disciplines" TEXT NOT NULL DEFAULT '[]',
    "disciplineColors" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "photoUrl" TEXT,
    "bannerUrl" TEXT,
    "bannerConfig" TEXT NOT NULL DEFAULT '{}',
    "licenseNumber" TEXT,
    "ffaProfileUrl" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "athlete_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "athlete_note_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "athlete_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "comment" TEXT,
    "difficulty" INTEGER,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "athlete_session_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "athlete_session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "athlete_custom_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT,
    "difficulty" INTEGER,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "athlete_custom_session_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "athlete_video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "athlete_video_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "sessionId" TEXT,
    "discipline" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPersonalBest" BOOLEAN NOT NULL DEFAULT false,
    "isCompetition" BOOLEAN NOT NULL DEFAULT false,
    "isIndoor" BOOLEAN,
    "venue" TEXT,
    "level" TEXT,
    "levelPoints" INTEGER,
    "wind" TEXT,
    CONSTRAINT "performance_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" TEXT,
    "targetValue" REAL,
    "unit" TEXT,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "goal_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "training_type" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1'
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingTypeId" TEXT,
    "description" TEXT,
    "durationMinutes" INTEGER,
    "startTime" DATETIME,
    CONSTRAINT "session_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "training_type" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competition_type" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#f59e0b'
);

-- CreateTable
CREATE TABLE "competition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "competitionTypeId" TEXT,
    "documentUrl" TEXT,
    "schedulesUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "availableDisciplines" TEXT NOT NULL DEFAULT '[]',
    "requestExpectedPerf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "competition_competitionTypeId_fkey" FOREIGN KEY ("competitionTypeId") REFERENCES "competition_type" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competition_registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "disciplines" TEXT NOT NULL DEFAULT '[]',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ffaRegistered" BOOLEAN NOT NULL DEFAULT false,
    "expectedPerformances" TEXT,
    CONSTRAINT "competition_registration_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "competition_registration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competition_debrief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
    "feeling" INTEGER,
    "notes" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "competition_debrief_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "competition_registration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "push_subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'bug',
    "description" TEXT NOT NULL,
    "page" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "authorId" TEXT,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "app_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_linkedAthleteId_key" ON "app_user"("linkedAthleteId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_session_athleteId_sessionId_key" ON "athlete_session"("athleteId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_registration_athleteId_competitionId_key" ON "competition_registration"("athleteId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_debrief_registrationId_key" ON "competition_debrief"("registrationId");

-- CreateIndex
CREATE INDEX "notification_userId_isRead_createdAt_idx" ON "notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscription_endpoint_key" ON "push_subscription"("endpoint");
