-- AlterTable
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteIncidents" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteWarrants" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteReports" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteCitizens" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteLaws" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteVerdicts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteCharges" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteCaseFiles" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteDeathCerts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteMedicalRecords" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteNews" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteWarnings" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteTrainingRecords" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgPermission" ADD COLUMN     "canDeleteDispatchLog" BOOLEAN NOT NULL DEFAULT false;
