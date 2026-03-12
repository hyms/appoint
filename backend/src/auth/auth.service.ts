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
import { AuthPrismaRepository, SanitizedUser } from './repositories/AuthPrismaRepository';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import {
  RegisterDto,
  LoginDto,
  MagicLinkDto,
  UpdateUserDto,
  GetUsersQueryDto,
  UserIdParamDto,
  ValidateMagicLinkDto,
} from './dto/auth.dto';
import { UserRole } from '@prisma/client';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authPrismaRepository: AuthPrismaRepository,
    private jwtService: JwtService,
    private bruteForceProtection: BruteForceProtectionService,
    private configService: AppConfigService,
  ) {}

  // --- 1. Registration (New User Sign Up) ---
  async register(registerDto: RegisterDto): Promise<{ user: SanitizedUser, access_token: string }> {
    const existingUser = await this.authPrismaRepository.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Profile data extraction to satisfy repository signature
    const profileData = {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        dni: registerDto.dni,
    };

    const user = await this.authPrismaRepository.create({
        ...registerDto,
        passwordHash,
        role: registerDto.role || UserRole.PATIENT,
        profile: profileData as any, // Temporary cast until DTOs are perfectly aligned with Prisma input types
    } as any); // Cast needed because DTO doesn't contain passwordHash

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: user, // Repository already sanitizes
      access_token: token,
    };
  }

  // --- 2. Login (Password Based) ---
  async login(loginDto: LoginDto, ipAddress: string): Promise<{ user: SanitizedUser, access_token: string }> {
    // Check if IP is blocked
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

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.bruteForceProtection.recordFailedAttempt(ipAddress);
      const remainingAttempts = this.bruteForceProtection.getRemainingAttempts(ipAddress);
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

  // --- 3. Magic Link Flow ---
  async generateMagicLink(magicLinkDto: MagicLinkDto, ipAddress: string) {
    // Check if IP is blocked
    if (this.bruteForceProtection.isBlocked(ipAddress)) {
      const remainingSeconds = this.bruteForceProtection.getBlockTimeRemaining(ipAddress);
      throw new ForbiddenException(
        `Too many failed attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      );
    }

    const user = await this.authPrismaRepository.findUnique({
      where: { phone: magicLinkDto.phone },
    });

    if (!user) {
      this.bruteForceProtection.recordFailedAttempt(ipAddress);
      throw new BadRequestException('User not found with this phone number');
    }
    
    // NOTE: For security/DRY purposes, this logic should ideally be in the repository
    // However, since generating the token is not a CRUD operation, we keep it here
    // and update the DB directly via repository or service method if needed.
    // For now, we delegate token storage to the repository's update logic.
    
    const magicToken = this.generateRandomToken();
    const magicExpiresAt = new Date(
      Date.now() + this.configService.magicLinkExpiryMinutes * 60 * 1000,
    );
    
    await this.authPrismaRepository.updateUser(user.id, {
        magicToken,
        magicExpiresAt,
    }, {}); // Profile data update is empty

    const magicLink = `${this.configService.frontendUrl}/auth/magic?token=${magicToken}`;

    return {
      magicToken,
      magicLink,
      expiresIn: `${this.configService.magicLinkExpiryMinutes} minutes`,
      message: 'Magic link generated (simulated - integrate WhatsApp API here)',
    };
  }

  async validateMagicLink(token: string): Promise<{ user: SanitizedUser, access_token: string }> {
    const user = await this.authPrismaRepository.validateMagicLinkToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired magic link');
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      user: user,
      access_token: accessToken,
    };
  }

  // --- 4. Admin/Read Access (Delegated to Repository) ---

  async getUsers(role?: string) {
    const users = await this.authPrismaRepository.findUsers(role as UserRole | undefined);
    // The repository already sanitizes users
    return users;
  }

  async getProfessionals() {
    return this.authPrismaRepository.findProfessionals();
  }

  async getUserById(id: string) {
    const user = await this.authPrismaRepository.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(createUserDto: RegisterDto) {
    // Delegate creation, relying on repository logic to handle email conflict check and hashing prep (if needed)
    // NOTE: Registration DTO is used here for simplicity, but ideally Admin should use a dedicated DTO
    
    const existingUser = await this.authPrismaRepository.findUnique({
        where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const profileData = {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        dni: createUserDto.dni,
    };

    const user = await this.authPrismaRepository.create({
        ...createUserDto,
        passwordHash,
        role: createUserDto.role || UserRole.PATIENT,
        profile: profileData as any,
    } as any);

    return user; // Repository sanitizes
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.authPrismaRepository.findUserById(id);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    
    // Email uniqueness check (must be performed before repository call if repository doesn't handle it explicitly)
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.authPrismaRepository.findUnique({
        where: { email: updateUserDto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }
    
    // Data transformation for repository update
    const updateData: any = {};
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
    if (updateUserDto.role) updateData.role = updateUserDto.role;
    if (updateUserDto.isActive !== undefined)
      updateData.isActive = updateUserDto.isActive;
    if (updateUserDto.oneSignalPlayerId)
      updateData.oneSignalPlayerId = updateUserDto.oneSignalPlayerId;

    const profileData: any = {};
    if (updateUserDto.firstName)
      profileData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) profileData.lastName = updateUserDto.lastName;
    if (updateUserDto.dni) profileData.dni = updateUserDto.dni;

    const user = await this.authPrismaRepository.updateUser(id, updateData, profileData);
    
    return user; // Repository returns sanitized user
  }

  async deleteUser(id: string) {
    const result = await this.authPrismaRepository.deleteUser(id);

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  async updatePlayerId(userId: string, playerId: string) {
    await this.authPrismaRepository.updateUser(userId, { oneSignalPlayerId: playerId }, {});
    return { success: true };
  }


  // --- Utilities (Kept in Service as they are authentication flow logic) ---

  private generateToken(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private sanitizeUser(user: any): SanitizedUser {
    // Keep this method as it defines the shape returned to the client
    const { passwordHash, magicToken, magicExpiresAt, ...sanitized } = user;
    return sanitized;
  }
}
