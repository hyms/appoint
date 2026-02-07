import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
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

      const createdUser = {
        id: 'user-id',
        email: registerDto.email,
        role: UserRole.PATIENT,
        isActive: true,
        profile: {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
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
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: loginDto.email,
        isActive: false,
        profile: {},
      });

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateMagicLink', () => {
    it('should generate magic link for existing phone', async () => {
      const magicLinkDto = { phone: '+1234567890' };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        phone: magicLinkDto.phone,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await authService.generateMagicLink(magicLinkDto);

      expect(result).toHaveProperty('magicToken');
      expect(result).toHaveProperty('magicLink');
      expect(result).toHaveProperty('expiresIn', '15 minutes');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-existent phone', async () => {
      const magicLinkDto = { phone: '+9999999999' };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.generateMagicLink(magicLinkDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateMagicLink', () => {
    it('should validate magic link and return tokens', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.PATIENT,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.validateMagicLink('valid-magic-token');

      expect(result).toHaveProperty('access_token');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { magicToken: null, magicExpiresAt: null },
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(authService.validateMagicLink('invalid-token')).rejects.toThrow(BadRequestException);
    });
  });
});
