-- CreateTable
CREATE TABLE "pace_reference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "timeSeconds" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pace_reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pace_reference_userId_idx" ON "pace_reference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pace_reference_userId_distance_key" ON "pace_reference"("userId", "distance");

-- AddForeignKey
ALTER TABLE "pace_reference" ADD CONSTRAINT "pace_reference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
