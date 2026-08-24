-- Objectifs : auto-validation "via FFA" (voir lib/goals.ts)
ALTER TABLE "goal" ADD COLUMN "autoValidateFfa" BOOLEAN NOT NULL DEFAULT false;
