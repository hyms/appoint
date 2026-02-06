-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "notificationSent24h" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationSent6h" BOOLEAN NOT NULL DEFAULT false;
