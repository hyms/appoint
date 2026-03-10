import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import { AppConfigService } from '../config/config.service';
import { UserRole } from '@prisma/client';
import { AuthPrismaRepository, SanitizedUser } from './repositories/AuthPrismaRepository'; // Import repository and SanitizedUser

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
      if (key === 'JWT_EXPIRES_IN') return '1d';
      return null; // Default
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthPrismaRepository, // Provide the new repository
          useValue: mockAuthPrismaRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: BruteForceProtectionService,
          useValue: mockBruteForceProtectionService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
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
        role: UserRole.PATIENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          id: 'profile-id',
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
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

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-jwt-token');
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
        passwordHash: '$2b$10$hashedpassword',
        role: UserRole.PATIENT,
        isActive: true,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthPrismaRepository.findUserForLogin.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await authService.login(loginDto, '127.0.0.1'); // Provide IP address

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(mockBruteForceProtectionService.clearAttempts).toHaveBeenCalledWith('127.0.0.1');
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
        profile: {},
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
            profile: {},
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

  describe('generateMagicLink', () => {
    it('should generate magic link for existing phone', async () => {
      const magicLinkDto = { phone: '+1234567890' };

      mockAuthPrismaRepository.findUnique.mockResolvedValue({
        id: 'user-id',
        phone: magicLinkDto.phone,
        email: 'test@example.com',
        role: UserRole.PATIENT,
        isActive: true,
        passwordHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockAuthPrismaRepository.updateUser.mockResolvedValue({}); // Magic link updates user

      const result = await authService.generateMagicLink(magicLinkDto, '127.0.0.1');

      expect(result).toHaveProperty('magicToken');
      expect(result).toHaveProperty('magicLink');
      expect(result).toHaveProperty('expiresIn', '15 minutes');
      expect(mockAuthPrismaRepository.updateUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-existent phone', async () => {
      const magicLinkDto = { phone: '+9999999999' };

      mockAuthPrismaRepository.findUnique.mockResolvedValue(null);
      mockBruteForceProtectionService.isBlocked.mockReturnValue(false);

      await expect(authService.generateMagicLink(magicLinkDto, '127.0.0.1')).rejects.toThrow(
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
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        magicToken: 'valid-magic-token',
        magicExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
        passwordHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthPrismaRepository.validateMagicLinkToken.mockResolvedValue(userWithMagicLink);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.validateMagicLink('valid-magic-token');

      expect(result).toHaveProperty('access_token');
      expect(mockAuthPrismaRepository.validateMagicLinkToken).toHaveBeenCalledWith('valid-magic-token');
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockAuthPrismaRepository.validateMagicLinkToken.mockResolvedValue(null);

      await expect(
        authService.validateMagicLink('invalid-token'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});