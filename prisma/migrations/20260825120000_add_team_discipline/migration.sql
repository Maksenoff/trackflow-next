-- Discipline de relais choisie à la création de l'équipe (4x60m, 4x100m...) —
-- nullable en base pour ne pas casser les équipes déjà créées sans ce champ,
-- mais requis côté formulaire de création.
ALTER TABLE "team" ADD COLUMN "discipline" TEXT;
