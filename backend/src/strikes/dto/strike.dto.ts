import {
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateStrikeDto {
  @IsUUID()
  patientId: string;

  @IsString()
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  @MaxLength(500, { message: 'Reason must be at most 500 characters' })
  reason: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;
}

export class ResolveStrikeDto {
  @IsString()
  @MinLength(10, { message: 'Resolution must be at least 10 characters' })
  @MaxLength(500, { message: 'Resolution must be at most 500 characters' })
  resolution: string;
}
