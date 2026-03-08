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

-- AlterTable
ALTER TABLE "User" ADD COLUMN "rankId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OrgPermission_organizationId_key" ON "OrgPermission"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgRank_organizationId_name_key" ON "OrgRank"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "OrgRank_organizationId_level_key" ON "OrgRank"("organizationId", "level");

-- AddForeignKey
ALTER TABLE "OrgPermission" ADD CONSTRAINT "OrgPermission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgRank" ADD CONSTRAINT "OrgRank_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "OrgRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
