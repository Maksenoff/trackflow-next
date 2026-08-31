-- Séance personnelle athlète : passe d'un simple journal ("performedAt" fixe,
-- toujours déjà passée) à une vraie séance plaçable sur le calendrier (date +
-- heure optionnelle + durée), avec le même cycle de debrief que les séances
-- coach ("skipped" ajouté pour "non effectuée").

-- Nouvelle colonne "date" : reprend la valeur de l'ancienne "performedAt" pour
-- ne pas perdre l'historique des séances déjà enregistrées.
ALTER TABLE "athlete_custom_session" ADD COLUMN "date" TIMESTAMP(3);
UPDATE "athlete_custom_session" SET "date" = "performedAt";
ALTER TABLE "athlete_custom_session" ALTER COLUMN "date" SET NOT NULL;

ALTER TABLE "athlete_custom_session" ADD COLUMN "startTime" TIMESTAMP(3);
ALTER TABLE "athlete_custom_session" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "athlete_custom_session" ADD COLUMN "skipped" BOOLEAN NOT NULL DEFAULT false;
-- Contenu prévu de la séance (équivalent du "Programme" des séances coach) —
-- distinct de "comment", le ressenti saisi après-coup au debrief.
ALTER TABLE "athlete_custom_session" ADD COLUMN "description" TEXT;

ALTER TABLE "athlete_custom_session" DROP COLUMN "performedAt";

CREATE INDEX "athlete_custom_session_date_idx" ON "athlete_custom_session"("date");
