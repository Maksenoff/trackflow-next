-- Un membre d'équipe de relais peut désormais être un "invité" externe à
-- l'appli (pas de compte athlète) — identifié uniquement par prénom/nom.
-- athleteId devient nullable ; guestFirstName/guestLastName portent l'identité
-- de l'invité quand athleteId est null.

ALTER TABLE "team_member" ALTER COLUMN "athleteId" DROP NOT NULL;
ALTER TABLE "team_member" ADD COLUMN "guestFirstName" TEXT;
ALTER TABLE "team_member" ADD COLUMN "guestLastName" TEXT;
