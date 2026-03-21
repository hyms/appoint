import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthPrismaRepository } from './repositories/AuthPrismaRepository';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import { AuthorizationService } from '../common/services/authorization.service';
import { RolesGuard } from './guards/roles.guard';
import { AppConfigService } from '../config/config.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    PassportModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') as any || '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AuthPrismaRepository,
    BruteForceProtectionService,
    AuthorizationService,
    RolesGuard,
    AppConfigService,
    PrismaService,
  ],
  exports: [AuthService, AuthPrismaRepository, AuthorizationService],
})
export class AuthModule {}

