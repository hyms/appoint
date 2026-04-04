import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ActivateEmergencyDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsNumber()
  affectedDays?: number;
}

export class DeactivateEmergencyDto {
  @IsString()
  reason!: string;
}
