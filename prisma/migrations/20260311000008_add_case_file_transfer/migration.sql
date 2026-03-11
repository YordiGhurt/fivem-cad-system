-- AlterTable
ALTER TABLE "CaseFile" ADD COLUMN     "transferredAt" TIMESTAMP(3),
ADD COLUMN     "transferredToOrgId" TEXT;
