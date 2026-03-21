import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateAppointmentDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsString()
  professionalId: string;

  @IsString()
  slotId: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelAppointmentDto {
  @IsString()
  reason: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @IsString()
  slotId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
