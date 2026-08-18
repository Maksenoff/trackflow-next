-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" TEXT NOT NULL DEFAULT '[]',
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "linkedAthleteId" TEXT,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "disciplines" TEXT NOT NULL DEFAULT '[]',
    "disciplineColors" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "photoUrl" TEXT,
    "photoConfig" TEXT NOT NULL DEFAULT '{}',
    "bannerUrl" TEXT,
    "bannerConfig" TEXT NOT NULL DEFAULT '{}',
    "licenseNumber" TEXT,
    "ffaProfileUrl" TEXT,
    "ffaSyncSinceYear" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "videosEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_note" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_session" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "comment" TEXT,
    "difficulty" INTEGER,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_custom_session" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT,
    "difficulty" INTEGER,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_custom_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_video" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "sessionId" TEXT,
    "discipline" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPersonalBest" BOOLEAN NOT NULL DEFAULT false,
    "isCompetition" BOOLEAN NOT NULL DEFAULT false,
    "isIndoor" BOOLEAN,
    "venue" TEXT,
    "level" TEXT,
    "levelPoints" INTEGER,
    "wind" TEXT,

    CONSTRAINT "performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podium" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "label" TEXT,
    "level" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "performance" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ffa',

    CONSTRAINT "podium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" TEXT,
    "targetValue" DOUBLE PRECISION,
    "unit" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',

    CONSTRAINT "training_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingTypeId" TEXT,
    "description" TEXT,
    "durationMinutes" INTEGER,
    "startTime" TIMESTAMP(3),

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#f59e0b',

    CONSTRAINT "competition_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "competitionTypeId" TEXT,
    "documentUrl" TEXT,
    "schedulesUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "availableDisciplines" TEXT NOT NULL DEFAULT '[]',
    "requestExpectedPerf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_registration" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "disciplines" TEXT NOT NULL DEFAULT '[]',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ffaRegistered" BOOLEAN NOT NULL DEFAULT false,
    "expectedPerformances" TEXT,

    CONSTRAINT "competition_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_debrief" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "feeling" INTEGER,
    "notes" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_debrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dismissed_reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dismissed_reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'bug',
    "description" TEXT NOT NULL,
    "page" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "authorId" TEXT,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll" (
    "id" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_option" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "poll_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_vote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_linkedAthleteId_key" ON "app_user"("linkedAthleteId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_session_athleteId_sessionId_key" ON "athlete_session"("athleteId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_teamId_athleteId_key" ON "team_member"("teamId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "podium_athleteId_year_rank_discipline_recordedAt_key" ON "podium"("athleteId", "year", "rank", "discipline", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "competition_registration_athleteId_competitionId_key" ON "competition_registration"("athleteId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_debrief_registrationId_key" ON "competition_debrief"("registrationId");

-- CreateIndex
CREATE INDEX "notification_userId_isRead_createdAt_idx" ON "notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "dismissed_reminder_userId_key_key" ON "dismissed_reminder"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscription_endpoint_key" ON "push_subscription"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "poll_option_feedbackId_key" ON "poll_option"("feedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_vote_pollId_userId_key" ON "poll_vote"("pollId", "userId");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_linkedAthleteId_fkey" FOREIGN KEY ("linkedAthleteId") REFERENCES "athlete"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_note" ADD CONSTRAINT "athlete_note_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_session" ADD CONSTRAINT "athlete_session_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_session" ADD CONSTRAINT "athlete_session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_custom_session" ADD CONSTRAINT "athlete_custom_session_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_video" ADD CONSTRAINT "athlete_video_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance" ADD CONSTRAINT "performance_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance" ADD CONSTRAINT "performance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podium" ADD CONSTRAINT "podium_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "training_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition" ADD CONSTRAINT "competition_competitionTypeId_fkey" FOREIGN KEY ("competitionTypeId") REFERENCES "competition_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_registration" ADD CONSTRAINT "competition_registration_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_registration" ADD CONSTRAINT "competition_registration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_debrief" ADD CONSTRAINT "competition_debrief_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "competition_registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dismissed_reminder" ADD CONSTRAINT "dismissed_reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll" ADD CONSTRAINT "poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_option" ADD CONSTRAINT "poll_option_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_option" ADD CONSTRAINT "poll_option_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
