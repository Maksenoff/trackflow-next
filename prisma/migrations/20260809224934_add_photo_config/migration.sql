-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_athlete" ("bannerConfig", "bannerUrl", "birthDate", "createdAt", "disciplineColors", "disciplines", "ffaProfileUrl", "firstName", "gender", "id", "lastName", "lastSyncedAt", "licenseNumber", "notes", "photoUrl") SELECT "bannerConfig", "bannerUrl", "birthDate", "createdAt", "disciplineColors", "disciplines", "ffaProfileUrl", "firstName", "gender", "id", "lastName", "lastSyncedAt", "licenseNumber", "notes", "photoUrl" FROM "athlete";
DROP TABLE "athlete";
ALTER TABLE "new_athlete" RENAME TO "athlete";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
