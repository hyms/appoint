import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum NotificationType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_CANCELLATION = 'APPOINTMENT_CANCELLATION',
  MAGIC_LINK = 'MAGIC_LINK',
  EMERGENCY_NOTIFICATION = 'EMERGENCY_NOTIFICATION',
}

export enum ProviderType {
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
}

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  recipient: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(ProviderType)
  provider?: ProviderType;
}

export class SendBulkNotificationDto {
  @IsString()
  type: NotificationType;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  subject?: string;
}
