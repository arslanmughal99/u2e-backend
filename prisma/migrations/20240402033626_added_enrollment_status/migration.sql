-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('Active', 'Archived', 'Completed');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'Active';
