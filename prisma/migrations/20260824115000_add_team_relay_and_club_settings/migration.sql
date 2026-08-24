-- Restructuration équipes (relais) + réglages club + coach de séance —
-- jamais capturée en migration jusqu'ici (schéma modifié directement, sans
-- passer par `prisma migrate dev`). Placée avant 20260824120000_add_missing_fk_indexes
-- car cette dernière crée un index sur "team_performance", qui doit donc déjà exister.

-- Team : couleur/photo d'équipe (même éditeur de cadrage que les athlètes)
ALTER TABLE "team" ADD COLUMN "color" TEXT;
ALTER TABLE "team" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "team" ADD COLUMN "photoConfig" TEXT NOT NULL DEFAULT '{}';

-- TeamMember : position dans le relais + marque de transmission
ALTER TABLE "team_member" ADD COLUMN "relayOrder" INTEGER;
ALTER TABLE "team_member" ADD COLUMN "handoffMark" TEXT;

-- Historique des performances de l'équipe (temps de relais en compétition)
CREATE TABLE "team_performance" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "place" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_performance_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "team_performance" ADD CONSTRAINT "team_performance_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Réglages club (singleton, id fixe "main")
CREATE TABLE "club_settings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "clubCode" TEXT,

    CONSTRAINT "club_settings_pkey" PRIMARY KEY ("id")
);

-- Session : coach assigné + présence
ALTER TABLE "session" ADD COLUMN "coachId" TEXT;
ALTER TABLE "session" ADD COLUMN "coachPresent" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "session" ADD CONSTRAINT "session_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
