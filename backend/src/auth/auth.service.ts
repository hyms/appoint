import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, MagicLinkDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        phone: registerDto.phone,
        role: registerDto.role || UserRole.PATIENT,
        profile: {
          create: {
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            dni: registerDto.dni,
          },
        },
      },
      include: { profile: true },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Use magic link authentication');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      access_token: token,
    };
  }

  async generateMagicLink(magicLinkDto: MagicLinkDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: magicLinkDto.phone },
    });

    if (!user) {
      throw new BadRequestException('User not found with this phone number');
    }

    const magicToken = this.generateRandomToken();
    const magicExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        magicToken,
        magicExpiresAt,
      },
    });

    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/magic?token=${magicToken}`;

    return {
      magicToken,
      magicLink,
      expiresIn: '15 minutes',
      message: 'Magic link generated (simulated - integrate WhatsApp API here)',
    };
  }

  async validateMagicLink(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        magicToken: token,
        magicExpiresAt: { gte: new Date() },
      },
      include: { profile: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired magic link');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        magicToken: null,
        magicExpiresAt: null,
      },
    });

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      access_token: accessToken,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  }

  private generateToken(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  private generateRandomToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, magicToken, magicExpiresAt, ...sanitized } = user;
    return sanitized;
  }
}
