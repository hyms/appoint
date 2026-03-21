import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class MagicLinkDto {
  @IsString()
  phone: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  oneSignalPlayerId?: string;
}

export class UpdateTelegramChatIdDto {
  @IsString()
  telegramChatId: string;
}

export class ValidateMagicLinkDto {
  @IsString()
  token: string;
}

export class GetUsersQueryDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}

export class UserIdParamDto {
  @IsUUID('4')
  id: string;
}
