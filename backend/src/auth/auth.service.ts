import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { AuthPrismaRepository, SanitizedUser } from './repositories/AuthPrismaRepository';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import { AuthorizationService } from '../common/services/authorization.service';
import { AppConfigService } from '../config/config.service';
import { NotificationProviderService } from '../notifications/services/notification-provider.service';
import { ProviderType } from '../notifications/dto/notification.dto';
import { RegisterDto, LoginDto, MagicLinkDto, UpdateUserDto } from './dto/auth.dto';
import { UserRole, NotificationType } from '@prisma/client';

type CreateUserData = {
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  profile: {
    create: {
      firstName: string;
      lastName: string;
    };
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authPrismaRepository: AuthPrismaRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly bruteForceProtection: BruteForceProtectionService,
    private readonly authorizationService: AuthorizationService,
    private readonly appConfigService: AppConfigService,
    private readonly notificationService: NotificationProviderService,
  ) {}

  // --- 1. Registration ---
  async register(registerDto: RegisterDto): Promise<{ user: SanitizedUser; token: string; refreshToken: string }> {
    const existingUser = await this.authPrismaRepository.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const data: CreateUserData = {
      email: registerDto.email,
      phone: registerDto.phone,
      passwordHash: hashedPassword,
      role: registerDto.role as UserRole || UserRole.PATIENT,
      isActive: true,
      profile: {
        create: {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      },
    };

    const newUser = await this.authPrismaRepository.create({ data, include: { profile: true } } as any);
    const token = this.generateToken(newUser.id, newUser.email, newUser.role);
    const refreshToken = this.generateRefreshToken(newUser.id);

    await this.sendWelcomeEmail(newUser);

    if (newUser.oneSignalPlayerId) {
      await this.notificationService.sendNotification({
        userId: newUser.id,
        type: NotificationType.OTHER,
        recipient: newUser.oneSignalPlayerId,
        subject: 'Welcome to Appointments 360!',
        content: 'Your account has been successfully created.',
        provider: ProviderType.ONESIGNAL,
        data: { userId: newUser.id, type: 'welcome' },
      });
    }

    return { user: this.sanitizeUser(newUser), token, refreshToken };
  }

  // --- 2. Login ---
  async login(loginDto: LoginDto, ipAddress: string): Promise<{ user: SanitizedUser; access_token: string }> {
    if (this.bruteForceProtection.isBlocked(ipAddress)) {
      const remainingSeconds = this.bruteForceProtection.getBlockTimeRemaining(ipAddress);
      throw new ForbiddenException(
        `Too many failed attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      );
    }

    const user = await this.authPrismaRepository.findUserForLogin(loginDto.email);

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

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      this.bruteForceProtection.recordFailedAttempt(ipAddress);
      const remainingAttempts = this.bruteForceProtection.getRemainingAttempts(ipAddress);
      throw new UnauthorizedException(`Invalid credentials. ${remainingAttempts} attempts remaining.`);
    }

    this.bruteForceProtection.clearAttempts(ipAddress);

    const token = this.generateToken(user.id, user.email, user.role);

    if (user.oneSignalPlayerId) {
      await this.notificationService.sendNotification({
        userId: user.id,
        type: NotificationType.OTHER,
        recipient: user.oneSignalPlayerId,
        subject: 'Successful Login',
        content: 'You have successfully logged into your account.',
        provider: ProviderType.ONESIGNAL,
        data: { userId: user.id, type: 'login' },
      });
    }

    return { user: this.sanitizeUser(user), access_token: token };
  }

  // --- 3. Magic Link Flow ---
  async sendMagicLink(magicLinkDto: MagicLinkDto, ipAddress: string): Promise<{ message: string }> {
    if (this.bruteForceProtection.isBlocked(ipAddress)) {
      const remainingSeconds = this.bruteForceProtection.getBlockTimeRemaining(ipAddress);
      throw new ForbiddenException(
        `Too many failed attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      );
    }

    const user = await this.authPrismaRepository.findUnique({
      where: { phone: magicLinkDto.phone },
      include: { profile: true },
    });

    if (!user || user.role !== UserRole.PATIENT) {
      this.bruteForceProtection.recordFailedAttempt(ipAddress);
      throw new BadRequestException('User not found or not a patient.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.passwordHash) {
      throw new BadRequestException('Account has a password. Use login.');
    }

    const token = this.generateRandomToken();
    const expiry = new Date(Date.now() + this.appConfigService.magicLinkExpiryMinutes * 60 * 1000);

    await this.authPrismaRepository.updateUser(user.id, { magicToken: token, magicExpiresAt: expiry }, {});

    const magicLink = `${this.appConfigService.frontendUrl}/auth/magic?token=${token}`;
    await this.sendMagicLinkNotification(user, magicLink);

    return { message: 'Magic link sent successfully.' };
  }

  async validateMagicLink(token: string): Promise<{ user: SanitizedUser; access_token: string; refreshToken: string }> {
    const user = await this.authPrismaRepository.validateMagicLinkToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired magic link.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const jwtToken = this.generateToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return { user: this.sanitizeUser(user), access_token: jwtToken, refreshToken };
  }

  // --- 4. Refresh Token ---
  async refreshToken(token: string): Promise<{ user: SanitizedUser; token: string; refreshToken: string }> {
    try {
      const { sub } = this.jwtService.verify(token);
      const user = await this.authPrismaRepository.findUserById(sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      const newToken = this.generateToken(user.id, user.email, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return { user: this.sanitizeUser(user), token: newToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  // --- 5. User Management ---
  async getCurrentUser(userId: string): Promise<SanitizedUser> {
    const user = await this.authPrismaRepository.findUserById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (userId !== user.id && !this.authorizationService.canViewAllUsers(user.role)) {
      throw new ForbiddenException('Access denied to user data.');
    }

    return this.sanitizeUser(user);
  }

  async getAllUsers(requesterId: string): Promise<SanitizedUser[]> {
    const requester = await this.authPrismaRepository.findUserById(requesterId);
    if (!requester) throw new NotFoundException('Requester not found');

    if (!this.authorizationService.canViewAllUsers(requester.role)) {
      throw new ForbiddenException('Insufficient permissions to view all users.');
    }

    const users = await this.authPrismaRepository.findUsers();
    return users;
  }

  async createUser(createUserDto: RegisterDto): Promise<SanitizedUser> {
    const existingUser = await this.authPrismaRepository.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const data: CreateUserData = {
      email: createUserDto.email,
      phone: createUserDto.phone,
      passwordHash: hashedPassword,
      role: createUserDto.role as UserRole,
      isActive: true,
      profile: {
        create: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
        },
      },
    };

    const newUser = await this.authPrismaRepository.create({ data, include: { profile: true } } as any);
    await this.sendWelcomeEmail(newUser);

    return this.sanitizeUser(newUser);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<SanitizedUser> {
    const existingUser = await this.authPrismaRepository.findUserById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.authPrismaRepository.findUnique({
        where: { email: updateUserDto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    const profileData: Record<string, any> = {};
    if (updateUserDto.firstName) profileData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) profileData.lastName = updateUserDto.lastName;
    if (updateUserDto.dni) profileData.dni = updateUserDto.dni;

    const updateData: Record<string, any> = {};
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
    if (updateUserDto.role) updateData.role = updateUserDto.role;
    if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;
    if (updateUserDto.oneSignalPlayerId) updateData.oneSignalPlayerId = updateUserDto.oneSignalPlayerId;

    const updatedUser = await this.authPrismaRepository.updateUser(id, updateData, profileData);
    return this.sanitizeUser(updatedUser);
  }

  async deleteUser(id: string, requesterId: string): Promise<{ success: boolean }> {
    const userToDelete = await this.authPrismaRepository.findUserById(id);
    if (!userToDelete) throw new NotFoundException('User not found');

    const requester = await this.authPrismaRepository.findUserById(requesterId);
    if (!requester) throw new NotFoundException('Requester not found');

    if (!this.authorizationService.canManageUsers(requester.role) || (userToDelete.role === UserRole.ADMIN && requester.role !== UserRole.ADMIN)) {
      throw new ForbiddenException('Cannot delete or block this user.');
    }

    await this.authPrismaRepository.deleteUser(id);
    return { success: true };
  }

  async updatePlayerId(userId: string, playerId: string): Promise<{ success: boolean }> {
    await this.authPrismaRepository.updateUser(userId, { oneSignalPlayerId: playerId }, {});
    return { success: true };
  }

  async updateTelegramChatId(userId: string, telegramChatId: string): Promise<{ success: boolean }> {
    await this.authPrismaRepository.updateUser(userId, { telegramChatId }, {});
    return { success: true };
  }

  async getProfessionals(): Promise<Array<{ id: string; email: string; firstName?: string; lastName?: string }>> {
    return this.authPrismaRepository.findProfessionals();
  }

  async getUsers(role?: string): Promise<SanitizedUser[]> {
    return this.authPrismaRepository.findUsers(role as UserRole | undefined);
  }

  async getUserById(id: string): Promise<SanitizedUser> {
    const user = await this.authPrismaRepository.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // --- Utilities ---
  private generateToken(userId: string, email: string, role: UserRole): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(userId: string): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any || '7d',
    });
  }

  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private sanitizeUser(user: any): SanitizedUser {
    const { passwordHash, magicToken, magicExpiresAt, ...sanitized } = user;
    return sanitized;
  }

  // --- Notification Helpers ---
  private async sendWelcomeEmail(user: any): Promise<void> {
    const firstName = user.profile?.firstName || 'User';
    const content = `Welcome to Appointments 360!\n\nHello ${firstName},\n\nYour account has been created successfully.\n\nBest regards,\nAppointments 360`;

    await this.notificationService.sendNotification({
      userId: user.id,
      type: NotificationType.APPOINTMENT_CONFIRMATION,
      recipient: user.email,
      subject: 'Welcome to Appointments 360',
      content,
      provider: ProviderType.EMAIL,
    });
  }

  private async sendMagicLinkNotification(user: any, magicLink: string): Promise<void> {
    const content = `Your Magic Link\n\nClick the link below to sign in:\n${magicLink}\n\nThis link expires in ${this.appConfigService.magicLinkExpiryMinutes} minutes.\n\nIf you didn't request this, please ignore this message.`;

    await this.notificationService.sendNotification({
      userId: user.id,
      type: NotificationType.MAGIC_LINK,
      recipient: user.email,
      subject: 'Your Magic Link',
      content,
      provider: ProviderType.EMAIL,
    });

    if (user.telegramChatId) {
      await this.notificationService.sendNotification({
        userId: user.id,
        type: NotificationType.MAGIC_LINK,
        recipient: user.telegramChatId,
        subject: undefined,
        content,
        provider: ProviderType.TELEGRAM,
      });
    }
  }
}
