import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

export enum ProviderType {
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
  ONESIGNAL = 'ONESIGNAL',
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

  @IsOptional()
  data?: Record<string, any>;
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
