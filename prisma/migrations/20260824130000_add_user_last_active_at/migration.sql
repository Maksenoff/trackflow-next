-- Nouveau signal "dernière activité" (voir components/activity-ping.tsx) —
-- distinct de lastLoginAt qui ne bouge qu'à la connexion et ne reflète rien
-- tant que la session reste ouverte sur l'appareil.
ALTER TABLE "app_user" ADD COLUMN "lastActiveAt" TIMESTAMP(3);
