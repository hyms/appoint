import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import { AppConfigService } from '../config/config.service';
import { UserRole } from '@prisma/client';
import { AuthPrismaRepository, SanitizedUser } from './repositories/AuthPrismaRepository';
import { AuthorizationService } from '../common/services/authorization.service';
import { NotificationProviderService } from '../notifications/services/notification-provider.service';
import { NotificationType } from '@prisma/client';
import { ProviderType } from '../notifications/dto/notification.dto';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let authService: AuthService;
  let authPrismaRepository: AuthPrismaRepository; // Use the new repository
  let jwtService: JwtService;

  // Mock the AuthPrismaRepository
  const mockAuthPrismaRepository = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findUserForLogin: jest.fn(),
    validateMagicLinkToken: jest.fn(),
    updateUser: jest.fn(), // Needed for magic link updates
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockBruteForceProtectionService = {
    recordFailedAttempt: jest.fn(),
    clearAttempts: jest.fn(), // Needed for successful login
    isBlocked: jest.fn().mockReturnValue(false),
    getBlockTimeRemaining: jest.fn().mockReturnValue(0),
    getRemainingAttempts: jest.fn().mockReturnValue(3), // For invalid credentials
  };

    const mockConfigService = {
      frontendUrl: 'http://localhost:5173',
      magicLinkExpiryMinutes: 15,
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        if (key === 'JWT_EXPIRES_IN') return '1d';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return null; // Default
      }),
    };

    const mockAuthorizationService = {
      canViewOwnData: jest.fn().mockReturnValue(true),
      canViewAllUsers: jest.fn().mockReturnValue(true),
      canManageUsers: jest.fn().mockReturnValue(true),
      canManageUser: jest.fn().mockReturnValue(true),
    };

    const mockNotificationProviderService = {
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
    };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthPrismaRepository,
          useValue: mockAuthPrismaRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: BruteForceProtectionService,
          useValue: mockBruteForceProtectionService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuthorizationService,
          useValue: mockAuthorizationService,
        },
        {
          provide: NotificationProviderService,
          useValue: mockNotificationProviderService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authPrismaRepository = module.get<AuthPrismaRepository>(AuthPrismaRepository); // Get the repository
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      };

      const createdUser: SanitizedUser = {
        id: 'user-id',
        email: registerDto.email,
        phone: registerDto.phone,
        role: UserRole.PATIENT,
        isActive: true,
        oneSignalPlayerId: null,
        telegramChatId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          id: 'profile-id',
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          dni: null,
          dateOfBirth: null,
          address: null,
          emergencyContact: null,
          medicalNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockAuthPrismaRepository.findUnique.mockResolvedValue(null);
      mockAuthPrismaRepository.create.mockResolvedValue({
        ...createdUser,
        passwordHash: 'hashed-password', // Add passwordHash as the repository expects it for internal use
        magicToken: null,
        magicExpiresAt: null,
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockAuthPrismaRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthPrismaRepository.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'user-id',
        email: loginDto.email,
        phone: null,
        passwordHash: '$2b$10$hashedpassword',
        role: UserRole.PATIENT,
        isActive: true,
        oneSignalPlayerId: null,
        telegramChatId: null,
        profile: {
          id: 'profile-id',
          firstName: 'John',
          lastName: 'Doe',
          dni: null,
          dateOfBirth: null,
          address: null,
          emergencyContact: null,
          medicalNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthPrismaRepository.findUserForLogin.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await authService.login(loginDto, '127.0.0.1');

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(mockBruteForceProtectionService.clearAttempts).toHaveBeenCalledWith('127.0.0.1');
      expect(mockNotificationProviderService.sendNotification).not.toHaveBeenCalled(); // No login notification yet
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockAuthPrismaRepository.findUserForLogin.mockResolvedValue(null);

      await expect(authService.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockBruteForceProtectionService.recordFailedAttempt).toHaveBeenCalledWith('127.0.0.1');
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthPrismaRepository.findUserForLogin.mockResolvedValue({
        id: 'user-id',
        email: loginDto.email,
        isActive: false,
        oneSignalPlayerId: null,
        telegramChatId: null,
        profile: {
          id: 'profile-id',
          firstName: 'John',
          lastName: 'Doe',
          dni: null,
          dateOfBirth: null,
          address: null,
          emergencyContact: null,
          medicalNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        passwordHash: 'hashed',
        role: UserRole.PATIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        mockAuthPrismaRepository.findUserForLogin.mockResolvedValue({
            id: 'user-id',
            email: loginDto.email,
            passwordHash: '$2b$10$hashedpassword',
            role: UserRole.PATIENT,
        isActive: true,
        oneSignalPlayerId: null,
        telegramChatId: null,
        profile: {
          id: 'profile-id',
          firstName: 'John',
          lastName: 'Doe',
          dni: null,
          dateOfBirth: null,
          address: null,
          emergencyContact: null,
          medicalNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

        const bcrypt = require('bcrypt');
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        await expect(authService.login(loginDto, '127.0.0.1')).rejects.toThrow(
            UnauthorizedException,
        );
        expect(mockBruteForceProtectionService.recordFailedAttempt).toHaveBeenCalledWith('127.0.0.1');
    });
  });

  describe('sendMagicLink', () => {
    it('should send magic link for existing phone', async () => {
      const magicLinkDto = { phone: '+1234567890' };

      mockAuthPrismaRepository.findUnique.mockResolvedValue({
        id: 'user-id',
        phone: magicLinkDto.phone,
        email: 'test@example.com',
        role: UserRole.PATIENT,
        isActive: true,
        oneSignalPlayerId: null,
        telegramChatId: null,
        passwordHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockAuthPrismaRepository.updateUser.mockResolvedValue({}); // Magic link updates user

      const result = await authService.sendMagicLink(magicLinkDto, '127.0.0.1');

      expect(result).toHaveProperty('message', 'Magic link sent successfully.');
      expect(mockAuthPrismaRepository.updateUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-existent phone', async () => {
      const magicLinkDto = { phone: '+9999999999' };

      mockAuthPrismaRepository.findUnique.mockResolvedValue(null);
      mockBruteForceProtectionService.isBlocked.mockReturnValue(false);

      await expect(authService.sendMagicLink(magicLinkDto, '127.0.0.1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockBruteForceProtectionService.recordFailedAttempt).toHaveBeenCalledWith('127.0.0.1');
    });
  });

  describe('validateMagicLink', () => {
    it('should validate magic link and return tokens', async () => {
      const userWithMagicLink = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.PATIENT,
        isActive: true,
        oneSignalPlayerId: null,
        telegramChatId: null,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          id: 'profile-id',
          dni: null,
          dateOfBirth: null,
          address: null,
          emergencyContact: null,
          medicalNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        magicToken: 'valid-magic-token',
        magicExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
        passwordHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthPrismaRepository.validateMagicLinkToken.mockResolvedValue(userWithMagicLink);
      mockJwtService.sign.mockReturnValueOnce('mock-jwt-token').mockReturnValueOnce('mock-refresh-token'); // For access and refresh tokens

      const result = await authService.validateMagicLink('valid-magic-token');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(mockAuthPrismaRepository.validateMagicLinkToken).toHaveBeenCalledWith('valid-magic-token');
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockAuthPrismaRepository.validateMagicLinkToken.mockResolvedValue(null);

      await expect(
        authService.validateMagicLink('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});