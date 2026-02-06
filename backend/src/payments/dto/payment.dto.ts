import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UploadPaymentDto {
  @IsString()
  appointmentId: string;
}

export class VerifyPaymentDto {
  @IsEnum(['VERIFIED', 'REJECTED'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
