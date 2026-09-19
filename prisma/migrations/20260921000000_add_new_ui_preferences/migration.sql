-- AlterTable
ALTER TABLE "app_user" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "calendarView" TEXT,
ADD COLUMN     "newUiEnabled" BOOLEAN NOT NULL DEFAULT true;
