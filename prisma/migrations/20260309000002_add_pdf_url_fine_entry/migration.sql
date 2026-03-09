-- Add pdfUrl fields to existing models
ALTER TABLE "Warrant" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Verdict" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Charge" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "CaseFile" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "DeathCertificate" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "MedicalRecord" ADD COLUMN "pdfUrl" TEXT;

-- Create FineEntry table
CREATE TABLE "FineEntry" (
    "id" TEXT NOT NULL,
    "offense" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "legalSection" TEXT NOT NULL,
    "fineMin" INTEGER NOT NULL DEFAULT 0,
    "fineMax" INTEGER NOT NULL DEFAULT 0,
    "jailMin" INTEGER NOT NULL DEFAULT 0,
    "jailMax" INTEGER NOT NULL DEFAULT 0,
    "seizure" TEXT,
    "additionalInfo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FineEntry_pkey" PRIMARY KEY ("id")
);
