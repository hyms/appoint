import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsString()
  emailFrom?: string;

  @IsOptional()
  @IsString()
  emailFromName?: string;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsString()
  twilioAccountSid?: string;

  @IsOptional()
  @IsString()
  twilioAuthToken?: string;

  @IsOptional()
  @IsString()
  twilioPhoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsString()
  whatsappPhoneId?: string;

  @IsOptional()
  @IsString()
  whatsappToken?: string;

  @IsOptional()
  @IsBoolean()
  telegramEnabled?: boolean;

  @IsOptional()
  @IsString()
  telegramBotToken?: string;

  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @IsOptional()
  @IsBoolean()
  notifyAppointmentReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyAppointmentConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyAppointmentCancellation?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyEmergency?: boolean;

  @IsOptional()
  @IsNumber()
  reminderHoursBefore?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
