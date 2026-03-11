-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN "licences" JSONB;

-- CreateTable
CREATE TABLE "FivemAuthToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "gradeName" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FivemAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FivemAuthToken_token_key" ON "FivemAuthToken"("token");
