import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import {
  RegisterDto,
  LoginDto,
  MagicLinkDto,
  UpdateUserDto,
} from './dto/auth.dto';
import { UserRole } from '@prisma/client';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private bruteForceProtection: BruteForceProtectionService,
    private configService: AppConfigService,
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

  async login(loginDto: LoginDto, ipAddress: string) {
    // Check if IP is blocked
    if (this.bruteForceProtection.isBlocked(ipAddress)) {
      const remainingSeconds =
        this.bruteForceProtection.getBlockTimeRemaining(ipAddress);
      throw new ForbiddenException(
        `Too many failed attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { profile: true },
    });

    if (!user) {
      this.bruteForceProtection.recordFailedAttempt(ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Use magic link authentication');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.bruteForceProtection.recordFailedAttempt(ipAddress);
      const remainingAttempts =
        this.bruteForceProtection.getRemainingAttempts(ipAddress);
      throw new UnauthorizedException(
        `Invalid credentials. ${remainingAttempts} attempts remaining.`,
      );
    }

    // Clear attempts on successful login
    this.bruteForceProtection.clearAttempts(ipAddress);

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      access_token: token,
    };
  }

  async generateMagicLink(magicLinkDto: MagicLinkDto, ipAddress: string) {
    // Check if IP is blocked
    if (this.bruteForceProtection.isBlocked(ipAddress)) {
      const remainingSeconds =
        this.bruteForceProtection.getBlockTimeRemaining(ipAddress);
      throw new ForbiddenException(
        `Too many failed attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { phone: magicLinkDto.phone },
    });

    if (!user) {
      this.bruteForceProtection.recordFailedAttempt(ipAddress);
      throw new BadRequestException('User not found with this phone number');
    }

    const magicToken = this.generateRandomToken();
    const magicExpiresAt = new Date(
      Date.now() + this.configService.magicLinkExpiryMinutes * 60 * 1000,
    );

    const magicLink = `${this.configService.frontendUrl}/auth/magic?token=${magicToken}`;

    return {
      magicToken,
      magicLink,
      expiresIn: `${this.configService.magicLinkExpiryMinutes} minutes`,
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
    return crypto.randomBytes(32).toString('hex');
  }

  private sanitizeUser(user: any) {
    const { passwordHash, magicToken, magicExpiresAt, ...sanitized } = user;
    return sanitized;
  }

  async getUsers(role?: string) {
    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async getProfessionals() {
    const users = await this.prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
    }));
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async createUser(createUserDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        phone: createUserDto.phone,
        role: createUserDto.role || UserRole.PATIENT,
        profile: {
          create: {
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            dni: createUserDto.dni,
          },
        },
      },
      include: { profile: true },
    });

    return this.sanitizeUser(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: any = {};
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
    if (updateUserDto.role) updateData.role = updateUserDto.role;
    if (updateUserDto.isActive !== undefined)
      updateData.isActive = updateUserDto.isActive;

    const profileData: any = {};
    if (updateUserDto.firstName)
      profileData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) profileData.lastName = updateUserDto.lastName;
    if (updateUserDto.dni) profileData.dni = updateUserDto.dni;

    if (Object.keys(profileData).length > 0) {
      updateData.profile = {
        update: profileData,
      };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { profile: true },
    });

    return this.sanitizeUser(user);
  }

  async deleteUser(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}
