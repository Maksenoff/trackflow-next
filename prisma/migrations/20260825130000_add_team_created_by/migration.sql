-- Auteur de la création de l'équipe — un athlète non-staff qui a créé son
-- équipe peut la supprimer, mais lui seul (les coachs/admins gardent le droit
-- de suppression quoi qu'il arrive).
ALTER TABLE "team" ADD COLUMN "createdByUserId" TEXT;

ALTER TABLE "team" ADD CONSTRAINT "team_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
