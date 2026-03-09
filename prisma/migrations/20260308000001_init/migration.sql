-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR', 'OFFICER', 'DISPATCHER', 'USER');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('POLICE', 'FIRE', 'AMBULANCE', 'DOJ', 'CUSTOM');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFDUTY', 'ONSCENE', 'ENROUTE', 'BREAK');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'PENDING', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('INCIDENT', 'ARREST', 'WARRANT', 'MEDICAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WarrantStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SERVED');

-- CreateEnum
CREATE TYPE "LawCategory" AS ENUM ('CRIMINAL', 'CIVIL', 'TRAFFIC', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "VerdictType" AS ENUM ('GUILTY', 'NOT_GUILTY', 'PLEA_DEAL', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISMISSED', 'SERVED');

-- CreateEnum
CREATE TYPE "DeathCause" AS ENUM ('NATURAL', 'ACCIDENT', 'HOMICIDE', 'SUICIDE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AdminLogAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_BANNED', 'ORG_CREATED', 'ORG_UPDATED', 'PERMISSION_CHANGED', 'RANK_CREATED', 'RANK_UPDATED', 'DATA_DELETED', 'SYSTEM_CONFIG');

-- CreateEnum
CREATE TYPE "CaseFileStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CLOSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "callsign" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgPermission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "canViewIncidents" BOOLEAN NOT NULL DEFAULT true,
    "canCreateIncidents" BOOLEAN NOT NULL DEFAULT false,
    "canViewWarrants" BOOLEAN NOT NULL DEFAULT false,
    "canCreateWarrants" BOOLEAN NOT NULL DEFAULT false,
    "canViewReports" BOOLEAN NOT NULL DEFAULT true,
    "canCreateReports" BOOLEAN NOT NULL DEFAULT false,
    "canViewCitizens" BOOLEAN NOT NULL DEFAULT false,
    "canViewVehicles" BOOLEAN NOT NULL DEFAULT false,
    "canManageUnits" BOOLEAN NOT NULL DEFAULT false,
    "canViewLaws" BOOLEAN NOT NULL DEFAULT false,
    "canCreateLaws" BOOLEAN NOT NULL DEFAULT false,
    "canViewVerdicts" BOOLEAN NOT NULL DEFAULT false,
    "canCreateVerdicts" BOOLEAN NOT NULL DEFAULT false,
    "canViewCharges" BOOLEAN NOT NULL DEFAULT false,
    "canCreateCharges" BOOLEAN NOT NULL DEFAULT false,
    "canViewCaseFiles" BOOLEAN NOT NULL DEFAULT false,
    "canCreateCaseFiles" BOOLEAN NOT NULL DEFAULT false,
    "canViewDeathCerts" BOOLEAN NOT NULL DEFAULT false,
    "canCreateDeathCerts" BOOLEAN NOT NULL DEFAULT false,
    "canViewMedicalRecords" BOOLEAN NOT NULL DEFAULT false,
    "canCreateMedicalRecords" BOOLEAN NOT NULL DEFAULT false,
    "canViewAdminLog" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgRank" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#94a3b8',
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "citizenId" TEXT,
    "steamId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "rankId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'OFFDUTY',
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "position" JSONB,
    "activeCallId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "status" "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUnit" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentNote" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "incidentId" TEXT,
    "type" "ReportType" NOT NULL DEFAULT 'INCIDENT',
    "authorId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "citizenId" TEXT NOT NULL,
    "gender" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "nationality" TEXT,
    "image" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "stolen" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "registrationExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warrant" (
    "id" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenId" TEXT,
    "reason" TEXT NOT NULL,
    "charges" TEXT NOT NULL,
    "status" "WarrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weapon" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "licensed" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Weapon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Law" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "LawCategory" NOT NULL,
    "penalty" TEXT,
    "fineAmount" DOUBLE PRECISION,
    "jailTime" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Law_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFile" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CaseFileStatus" NOT NULL DEFAULT 'OPEN',
    "citizenName" TEXT,
    "citizenId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "CaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verdict" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenId" TEXT,
    "type" "VerdictType" NOT NULL,
    "sentence" TEXT,
    "jailTime" INTEGER,
    "fineAmount" DOUBLE PRECISION,
    "judgeId" TEXT NOT NULL,
    "caseFileId" TEXT,
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verdict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenId" TEXT,
    "lawId" TEXT,
    "description" TEXT NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "issuedById" TEXT NOT NULL,
    "verdictId" TEXT,
    "caseFileId" TEXT,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDocument" (
    "id" TEXT NOT NULL,
    "caseFileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeathCertificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "deceasedName" TEXT NOT NULL,
    "citizenId" TEXT,
    "dateOfDeath" TIMESTAMP(3) NOT NULL,
    "timeOfDeath" TIMESTAMP(3),
    "locationOfDeath" TEXT NOT NULL,
    "cause" "DeathCause" NOT NULL,
    "causeDescription" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeathCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "action" "AdminLogAction" NOT NULL,
    "description" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "performedById" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "recordNumber" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenId" TEXT,
    "diagnosis" TEXT NOT NULL,
    "treatment" TEXT,
    "medications" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT,
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "incidentId" TEXT,
    "confidential" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrgPermission_organizationId_key" ON "OrgPermission"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgRank_organizationId_name_key" ON "OrgRank"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "OrgRank_organizationId_level_key" ON "OrgRank"("organizationId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_caseNumber_key" ON "Incident"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentUnit_incidentId_unitId_key" ON "IncidentUnit"("incidentId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_citizenId_key" ON "Citizen"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Weapon_serialNumber_key" ON "Weapon"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Law_code_key" ON "Law"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CaseFile_caseNumber_key" ON "CaseFile"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Verdict_caseNumber_key" ON "Verdict"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DeathCertificate_certificateNumber_key" ON "DeathCertificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_recordNumber_key" ON "MedicalRecord"("recordNumber");

-- AddForeignKey
ALTER TABLE "OrgPermission" ADD CONSTRAINT "OrgPermission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgRank" ADD CONSTRAINT "OrgRank_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "OrgRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentUnit" ADD CONSTRAINT "IncidentUnit_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentUnit" ADD CONSTRAINT "IncidentUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentNote" ADD CONSTRAINT "IncidentNote_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentNote" ADD CONSTRAINT "IncidentNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Citizen"("citizenId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weapon" ADD CONSTRAINT "Weapon_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Citizen"("citizenId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Law" ADD CONSTRAINT "Law_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("citizenId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verdict" ADD CONSTRAINT "Verdict_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("citizenId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verdict" ADD CONSTRAINT "Verdict_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verdict" ADD CONSTRAINT "Verdict_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("citizenId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "Law"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_verdictId_fkey" FOREIGN KEY ("verdictId") REFERENCES "Verdict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathCertificate" ADD CONSTRAINT "DeathCertificate_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("citizenId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathCertificate" ADD CONSTRAINT "DeathCertificate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathCertificate" ADD CONSTRAINT "DeathCertificate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("citizenId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
