-- Colonnes de clé étrangère jamais indexées côté Postgres prod (Prisma n'index
-- pas automatiquement une colonne FK simple — seules les @@unique/@@unique
-- composites en créent une, et uniquement utilisable en préfixe gauche).
-- Ajout de +date sur session/competition (filtrées/triées en permanence sur
-- ce champ dans lib/calendar-data.ts, lib/dashboard.ts).

CREATE INDEX "athlete_note_athleteId_idx" ON "athlete_note"("athleteId");
CREATE INDEX "athlete_session_sessionId_idx" ON "athlete_session"("sessionId");
CREATE INDEX "athlete_custom_session_athleteId_idx" ON "athlete_custom_session"("athleteId");
CREATE INDEX "athlete_video_athleteId_idx" ON "athlete_video"("athleteId");
CREATE INDEX "team_performance_teamId_idx" ON "team_performance"("teamId");
CREATE INDEX "team_member_athleteId_idx" ON "team_member"("athleteId");
CREATE INDEX "performance_athleteId_idx" ON "performance"("athleteId");
CREATE INDEX "performance_sessionId_idx" ON "performance"("sessionId");
CREATE INDEX "goal_athleteId_idx" ON "goal"("athleteId");
CREATE INDEX "session_date_idx" ON "session"("date");
CREATE INDEX "session_trainingTypeId_idx" ON "session"("trainingTypeId");
CREATE INDEX "session_coachId_idx" ON "session"("coachId");
CREATE INDEX "competition_date_idx" ON "competition"("date");
CREATE INDEX "competition_competitionTypeId_idx" ON "competition"("competitionTypeId");
CREATE INDEX "competition_registration_competitionId_idx" ON "competition_registration"("competitionId");
CREATE INDEX "push_subscription_userId_idx" ON "push_subscription"("userId");
