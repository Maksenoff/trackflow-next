-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_app_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" TEXT NOT NULL DEFAULT '[]',
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME,
    "linkedAthleteId" TEXT,
    CONSTRAINT "app_user_linkedAthleteId_fkey" FOREIGN KEY ("linkedAthleteId") REFERENCES "athlete" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_app_user" ("createdAt", "email", "firstName", "id", "lastName", "linkedAthleteId", "password", "roles") SELECT "createdAt", "email", "firstName", "id", "lastName", "linkedAthleteId", "password", "roles" FROM "app_user";
DROP TABLE "app_user";
ALTER TABLE "new_app_user" RENAME TO "app_user";
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");
CREATE UNIQUE INDEX "app_user_linkedAthleteId_key" ON "app_user"("linkedAthleteId");
CREATE TABLE "new_athlete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATETIME,
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
    "lastSyncedAt" DATETIME,
    "videosEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_athlete" ("bannerConfig", "bannerUrl", "birthDate", "createdAt", "disciplineColors", "disciplines", "ffaProfileUrl", "firstName", "gender", "id", "lastName", "lastSyncedAt", "licenseNumber", "notes", "photoConfig", "photoUrl") SELECT "bannerConfig", "bannerUrl", "birthDate", "createdAt", "disciplineColors", "disciplines", "ffaProfileUrl", "firstName", "gender", "id", "lastName", "lastSyncedAt", "licenseNumber", "notes", "photoConfig", "photoUrl" FROM "athlete";
DROP TABLE "athlete";
ALTER TABLE "new_athlete" RENAME TO "athlete";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
