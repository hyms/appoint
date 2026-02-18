import { Module, UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import { PrismaService } from '../prisma/prisma.service';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new UnauthorizedException('JWT_SECRET environment variable is not set');
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: jwtExpiresIn as any },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    BruteForceProtectionService,
    PrismaService,
  ],
  exports: [AuthService, JwtModule, BruteForceProtectionService],
})
export class AuthModule {}
