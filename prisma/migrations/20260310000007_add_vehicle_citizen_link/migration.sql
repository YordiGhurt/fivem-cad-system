-- AlterTable: add citizenId column to Vehicle (nullable, for direct citizen link)
ALTER TABLE "Vehicle" ADD COLUMN "citizenId" TEXT;
