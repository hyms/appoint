import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHoursDto {
  @IsString()
  dayOfWeek!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsBoolean()
  isActive!: boolean;
}

export class ProfessionalConfigDto {
  @IsString()
  professionalId!: string;

  @IsNumber()
  slotDurationMinutes!: number;

  @IsNumber()
  breakBetweenSlotsMinutes!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours!: WorkingHoursDto[];

  @IsOptional()
  @IsString()
  locationId?: string;
}

export class GenerateSlotsDto {
  @IsString()
  professionalId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}

export class BlockSlotDto {
  @IsString()
  slotId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateSlotDto {
  @IsOptional()
  @IsBoolean()
  isBooked?: boolean;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @IsString()
  blockReason?: string;
}
