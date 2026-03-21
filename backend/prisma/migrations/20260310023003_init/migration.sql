-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'VOICE_VERIFIED';

-- AlterTable
ALTER TABLE "Strike" ADD COLUMN     "resolution" TEXT;

-- CreateTable
CREATE TABLE "AppointmentAudit" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailFrom" TEXT,
    "emailFromName" TEXT,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twilioAccountSid" TEXT,
    "twilioAuthToken" TEXT,
    "twilioPhoneNumber" TEXT,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappPhoneId" TEXT,
    "whatsappToken" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "notifyAppointmentReminder" BOOLEAN NOT NULL DEFAULT true,
    "notifyAppointmentConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "notifyAppointmentCancellation" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmergency" BOOLEAN NOT NULL DEFAULT true,
    "reminderHoursBefore" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalConfig" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "breakBetweenSlotsMinutes" INTEGER NOT NULL DEFAULT 5,
    "locationId" TEXT,
    "workingHours" JSONB NOT NULL DEFAULT '[{"dayOfWeek":"MONDAY","startTime":"09:00","endTime":"17:00","isActive":true},{"dayOfWeek":"TUESDAY","startTime":"09:00","endTime":"17:00","isActive":true},{"dayOfWeek":"WEDNESDAY","startTime":"09:00","endTime":"17:00","isActive":true},{"dayOfWeek":"THURSDAY","startTime":"09:00","endTime":"17:00","isActive":true},{"dayOfWeek":"FRIDAY","startTime":"09:00","endTime":"17:00","isActive":true}]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentAudit_appointmentId_idx" ON "AppointmentAudit"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentAudit_userId_idx" ON "AppointmentAudit"("userId");

-- CreateIndex
CREATE INDEX "AppointmentAudit_createdAt_idx" ON "AppointmentAudit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalConfig_professionalId_key" ON "ProfessionalConfig"("professionalId");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Appointment_patientId_date_idx" ON "Appointment"("patientId", "date");

-- CreateIndex
CREATE INDEX "Appointment_professionalId_date_idx" ON "Appointment"("professionalId", "date");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Slot_date_idx" ON "Slot"("date");

-- CreateIndex
CREATE INDEX "Slot_professionalId_date_idx" ON "Slot"("professionalId", "date");

-- CreateIndex
CREATE INDEX "Slot_isBooked_isBlocked_idx" ON "Slot"("isBooked", "isBlocked");

-- CreateIndex
CREATE INDEX "Strike_patientId_idx" ON "Strike"("patientId");

-- CreateIndex
CREATE INDEX "Strike_professionalId_idx" ON "Strike"("professionalId");

-- CreateIndex
CREATE INDEX "Strike_patientId_professionalId_idx" ON "Strike"("patientId", "professionalId");

-- CreateIndex
CREATE INDEX "Strike_isActive_blockedUntil_idx" ON "Strike"("isActive", "blockedUntil");

-- AddForeignKey
ALTER TABLE "AppointmentAudit" ADD CONSTRAINT "AppointmentAudit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalConfig" ADD CONSTRAINT "ProfessionalConfig_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalConfig" ADD CONSTRAINT "ProfessionalConfig_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
