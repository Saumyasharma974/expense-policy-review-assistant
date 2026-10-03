/*
  Warnings:

  - Added the required column `classification` to the `AiFinding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `complianceStatus` to the `AiFinding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidence` to the `AiFinding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiFinding" ADD COLUMN     "clarificationQuestion" TEXT,
ADD COLUMN     "classification" TEXT NOT NULL,
ADD COLUMN     "complianceStatus" TEXT NOT NULL,
ADD COLUMN     "confidence" INTEGER NOT NULL,
ADD COLUMN     "missingInformation" TEXT[],
ADD COLUMN     "uncertainty" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "policySectionId" DROP NOT NULL,
ALTER COLUMN "policyEvidence" DROP NOT NULL;
