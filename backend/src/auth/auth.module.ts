import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule and ConfigService
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/config.service';
import { AuthPrismaRepository } from './repositories/AuthPrismaRepository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule, // Import ConfigModule for use in registerAsync
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-fallback-if-not-set', // Fallback for dev
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '7d') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    BruteForceProtectionService,
    AppConfigService,
    PrismaService,
    AuthPrismaRepository,
  ],
  exports: [AuthService, JwtModule, BruteForceProtectionService],
})
export class AuthModule {}