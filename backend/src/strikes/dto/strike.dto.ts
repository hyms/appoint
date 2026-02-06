import { IsString, IsOptional } from 'class-validator';

export class CreateStrikeDto {
  @IsString()
  patientId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;
}

export class ResolveStrikeDto {
  @IsString()
  resolution: string;
}
