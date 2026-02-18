import { IsString, IsOptional, IsInt, IsBoolean, IsJSON } from 'class-validator';

export class WorkingHoursDto {
  @IsString()
  dayOfWeek: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsBoolean()
  isActive: boolean;
}

export class UpdateProfessionalConfigDto {
  @IsOptional()
  @IsInt()
  slotDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  breakBetweenSlotsMinutes?: number;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  workingHours?: WorkingHoursDto[];
}
