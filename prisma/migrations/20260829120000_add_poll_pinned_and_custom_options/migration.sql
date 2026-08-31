-- AlterTable
ALTER TABLE "poll" ADD COLUMN     "pinnedOrder" INTEGER;

-- AlterTable
ALTER TABLE "poll_option" ALTER COLUMN "feedbackId" DROP NOT NULL;
