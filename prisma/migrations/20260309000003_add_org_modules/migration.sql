-- Add new enums
CREATE TYPE "WarningSeverity" AS ENUM ('MINOR', 'MAJOR', 'FINAL');
CREATE TYPE "TrainingType" AS ENUM ('BASIC', 'ADVANCED', 'SPECIALIST', 'REFRESHER', 'SUPERVISOR', 'CUSTOM');

-- Add new permissions to OrgPermission
ALTER TABLE "OrgPermission" ADD COLUMN "canViewNews" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OrgPermission" ADD COLUMN "canCreateNews" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN "canViewWarnings" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN "canCreateWarnings" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN "canViewTrainingRecords" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN "canCreateTrainingRecords" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN "canViewDispatchLog" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN "canCreateDispatchLog" BOOLEAN NOT NULL DEFAULT false;

-- OrgNews
CREATE TABLE "OrgNews" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrgNews_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "OrgNews" ADD CONSTRAINT "OrgNews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgNews" ADD CONSTRAINT "OrgNews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON UPDATE CASCADE;

-- OrgWarning
CREATE TABLE "OrgWarning" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "WarningSeverity" NOT NULL DEFAULT 'MINOR',
    "targetUserId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrgWarning_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "OrgWarning" ADD CONSTRAINT "OrgWarning_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "OrgWarning" ADD CONSTRAINT "OrgWarning_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "OrgWarning" ADD CONSTRAINT "OrgWarning_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TrainingRecord
CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL,
    "recordNumber" TEXT NOT NULL,
    "traineeName" TEXT NOT NULL,
    "traineeId" TEXT,
    "trainerName" TEXT NOT NULL,
    "trainerId" TEXT,
    "organizationId" TEXT NOT NULL,
    "type" "TrainingType" NOT NULL,
    "modules" JSONB,
    "notes" TEXT,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TrainingRecord_recordNumber_key" ON "TrainingRecord"("recordNumber");
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DispatchLog
CREATE TABLE "DispatchLog" (
    "id" TEXT NOT NULL,
    "logNumber" TEXT NOT NULL,
    "dispatcherId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shiftStart" TIMESTAMP(3) NOT NULL,
    "shiftEnd" TIMESTAMP(3),
    "callsHandled" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DispatchLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DispatchLog_logNumber_key" ON "DispatchLog"("logNumber");
ALTER TABLE "DispatchLog" ADD CONSTRAINT "DispatchLog_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "DispatchLog" ADD CONSTRAINT "DispatchLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
