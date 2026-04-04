import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { BruteForceProtectionService } from './services/brute-force-protection.service';
import { AppConfigService } from '../config/config.service';
import { UserRole } from '@prisma/client';
import {
  AuthPrismaRepository,
  SanitizedUser,
} from './repositories/AuthPrismaRepository';
import { AuthorizationService } from '../common/services/authorization.service';
import { NotificationProviderService } from '../notifications/services/notification-provider.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../common/services/audit.service';
import { RegisterDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

const mockAuthPrismaRepository = {
  findUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  findUnique: jest.fn(),
  findUsers: jest.fn(),
  create: jest.fn(),
  validateMagicLinkToken: jest.fn(),
};
jest.mock('./repositories/AuthPrismaRepository', () => ({
  AuthPrismaRepository: jest
    .fn()
    .mockImplementation(() => mockAuthPrismaRepository),
}));

const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  appointmentAudit: {
    create: jest.fn(),
  },
};
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => mockPrismaClient),
}));

describe('AuthService - User Management & Auditing', () => {
  let authService: AuthService;
  let authPrismaRepository: AuthPrismaRepository;

  const mockAuthorizationService = {
    canManageUsers: jest.fn(),
    canViewAllUsers: jest.fn(),
  };
  const mockAuditService = {
    logUserChange: jest.fn().mockResolvedValue(undefined),
  };
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };
  const mockAppConfigService = {
    frontendUrl: 'http://localhost:5173',
    magicLinkExpiryMinutes: 15,
  };
  const mockBruteForceProtectionService = {
    isBlocked: jest.fn().mockReturnValue(false),
    recordFailedAttempt: jest.fn(),
    getBlockTimeRemaining: jest.fn().mockReturnValue(0),
    getRemainingAttempts: jest.fn().mockReturnValue(5),
  };
  const mockNotificationService = {
    sendNotification: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthPrismaRepository, useValue: mockAuthPrismaRepository },
        { provide: AuthorizationService, useValue: mockAuthorizationService },
        { provide: AuditService, useValue: mockAuditService },
        {
          provide: NotificationProviderService,
          useValue: mockNotificationService,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: BruteForceProtectionService,
          useValue: mockBruteForceProtectionService,
        },
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authPrismaRepository =
      module.get<AuthPrismaRepository>(AuthPrismaRepository);

    jest.clearAllMocks();
  });

  describe('createUser (Admin)', () => {
    const createDto: RegisterDto = {
      email: 'newadmin@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      phone: '+1234567890',
    };

    const createdUser: SanitizedUser = {
      id: 'new-user-id',
      email: createDto.email,
      phone: createDto.phone,
      role: UserRole.ADMIN,
      isActive: true,
      oneSignalPlayerId: null,
      telegramChatId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        id: 'new-profile-id',
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        dni: null,
        dateOfBirth: null,
        address: null,
        emergencyContact: null,
        medicalNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    beforeEach(() => {
      mockAuthPrismaRepository.findUnique.mockResolvedValue(null);
      mockAuthPrismaRepository.create.mockResolvedValue({
        ...createdUser,
        passwordHash: 'hashedpassword',
      });
      jest
        .spyOn(authService as any, 'sendWelcomeEmail')
        .mockResolvedValue(undefined);
    });

    it('should create a new user with specified role and send welcome email', async () => {
      const result = await authService.createUser(createDto);

      expect(mockAuthPrismaRepository.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(mockAuthPrismaRepository.create).toHaveBeenCalled();
      expect(result.email).toBe(createDto.email);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockAuthPrismaRepository.findUnique.mockResolvedValue(createdUser);

      await expect(authService.createUser(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAuthPrismaRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUsers', () => {
    const mockUsers: SanitizedUser[] = [
      {
        id: 'u1',
        email: 'u1@ex.com',
        role: UserRole.PATIENT,
        isActive: true,
        profile: {
          firstName: '1',
          lastName: 'U',
          dni: null,
          dateOfBirth: null,
          address: null,
          emergencyContact: null,
          medicalNotes: null,
          id: 'p1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as SanitizedUser,
      {
        id: 'u2',
        email: 'u2@ex.com',
        role: UserRole.PROFESSIONAL,
        isActive: true,
        profile: {
          firstName: '2',
          lastName: 'U',
          dni: null,
          dateOfBirth: null,
          address: null,
          emergencyContact: null,
          medicalNotes: null,
          id: 'p2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as SanitizedUser,
    ];

    beforeEach(() => {
      mockAuthPrismaRepository.findUsers.mockResolvedValue(mockUsers);
    });

    it('should return all users if no role filter is provided', async () => {
      const result = await authService.getUsers();

      expect(mockAuthPrismaRepository.findUsers).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toEqual(mockUsers);
    });

    it('should return users filtered by role if provided', async () => {
      const filteredUsers = [mockUsers[0]];
      mockAuthPrismaRepository.findUsers.mockResolvedValue(filteredUsers);

      const result = await authService.getUsers(UserRole.PATIENT);

      expect(mockAuthPrismaRepository.findUsers).toHaveBeenCalledWith(
        UserRole.PATIENT,
      );
      expect(result).toEqual(filteredUsers);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.PATIENT,
      phone: '+1234567890',
    };

    it('should register a new user successfully', async () => {
      mockAuthPrismaRepository.findUnique.mockResolvedValue(null);
      mockAuthPrismaRepository.create.mockResolvedValue({
        id: 'user-id',
        ...registerDto,
        isActive: true,
      });

      const result = await authService.register(registerDto);

      expect(mockAuthPrismaRepository.create).toHaveBeenCalled();
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email exists', async () => {
      mockAuthPrismaRepository.findUnique.mockResolvedValue({ id: 'exists' });

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };
    const ipAddress = '127.0.0.1';

    it('should throw ForbiddenException if IP is blocked', async () => {
      mockBruteForceProtectionService.isBlocked.mockReturnValue(true);
      await expect(authService.login(loginDto, ipAddress)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockBruteForceProtectionService.isBlocked.mockReturnValue(false);
      mockAuthPrismaRepository.findUserForLogin = jest.fn().mockResolvedValue(null);
      await expect(authService.login(loginDto, ipAddress)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-id' });
      mockAuthPrismaRepository.findUserById.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.PATIENT,
        isActive: true,
      });
      mockJwtService.sign.mockReturnValue('new-token');

      const result = await authService.refreshToken('old-token');

      expect(result.token).toBe('new-token');
    });

    it('should throw UnauthorizedException if token invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });
      await expect(authService.refreshToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = 'user-id';
      const updateUserDto = { firstName: 'Updated' };
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        role: UserRole.PATIENT,
        isActive: true,
      };

      mockAuthPrismaRepository.findUserById.mockResolvedValue(existingUser);
      mockAuthPrismaRepository.updateUser.mockResolvedValue({
        ...existingUser,
        profile: { firstName: 'Updated' },
      });

      const result = await authService.updateUser(userId, updateUserDto);

      expect(mockAuthPrismaRepository.updateUser).toHaveBeenCalled();
      expect(result.profile.firstName).toBe('Updated');
    });
  });

  describe('requestTelegramAuth', () => {
    const magicLinkDto = { phone: '+1234567890' };
    const ipAddress = '127.0.0.1';
    const mockUser = {
      id: 'user-id-tg',
      phone: magicLinkDto.phone,
      email: 'test@example.com',
      role: UserRole.PATIENT,
      isActive: true,
      passwordHash: null,
      telegramChatId: 'some-chat-id',
    };

    beforeEach(() => {
      mockAuthPrismaRepository.findUnique.mockResolvedValue(mockUser);
      mockAuthPrismaRepository.updateUser.mockResolvedValue({});
      jest
        .spyOn(authService as any, 'generateRandomToken')
        .mockReturnValue('mock-telegram-token');
      jest
        .spyOn(authService as any, 'sendTelegramAuthNotification')
        .mockResolvedValue(undefined);
    });

    it('should request Telegram authentication for an existing patient without password', async () => {
      // Ensure not blocked
      mockBruteForceProtectionService.isBlocked.mockReturnValue(false);

      const result = await authService.requestTelegramAuth(
        magicLinkDto,
        ipAddress,
      );

      expect(mockAuthPrismaRepository.findUnique).toHaveBeenCalledWith({
        where: { phone: magicLinkDto.phone },
        include: { profile: true },
      });
      expect(mockAuthPrismaRepository.updateUser).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Authentication request processed. Check Telegram.',
      });
    });

    it('should throw BadRequestException if user not found or not a patient', async () => {
      mockBruteForceProtectionService.isBlocked.mockReturnValue(false);
      mockAuthPrismaRepository.findUnique.mockResolvedValue(null);
      await expect(
        authService.requestTelegramAuth(magicLinkDto, ipAddress),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if account is deactivated', async () => {
      mockBruteForceProtectionService.isBlocked.mockReturnValue(false);
      mockAuthPrismaRepository.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      await expect(
        authService.requestTelegramAuth(magicLinkDto, ipAddress),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if account has a password', async () => {
      mockBruteForceProtectionService.isBlocked.mockReturnValue(false);
      mockAuthPrismaRepository.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: 'somehash',
      });
      await expect(
        authService.requestTelegramAuth(magicLinkDto, ipAddress),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateTelegramToken', () => {
    const token = 'valid-telegram-token';
    const mockUser = {
      id: 'user-id-tg-valid',
      email: 'tg@example.com',
      role: UserRole.PATIENT,
      isActive: true,
      telegramChatId: 'some-chat-id',
      profile: { firstName: 'Test' },
    };

    beforeEach(() => {
      mockAuthPrismaRepository.validateMagicLinkToken.mockResolvedValue(
        mockUser,
      );
      mockJwtService.sign
        .mockReturnValueOnce('mock-jwt-token')
        .mockReturnValueOnce('mock-refresh-token');
    });

    it('should validate Telegram token and return authentication details', async () => {
      const result = await authService.validateTelegramToken(token);

      expect(
        mockAuthPrismaRepository.validateMagicLinkToken,
      ).toHaveBeenCalledWith(token);
      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(mockAuditService.logUserChange).toHaveBeenCalledWith(
        mockUser.id,
        'USER_AUTHENTICATED_TELEGRAM',
        { ip: 'unknown' },
        mockUser.id,
        mockUser.role,
      );
    });

    it('should throw UnauthorizedException for invalid or expired token', async () => {
      mockAuthPrismaRepository.validateMagicLinkToken.mockResolvedValue(null);
      await expect(
        authService.validateTelegramToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is deactivated', async () => {
      mockAuthPrismaRepository.validateMagicLinkToken.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      await expect(authService.validateTelegramToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if Telegram Chat ID not linked', async () => {
      mockAuthPrismaRepository.validateMagicLinkToken.mockResolvedValue({
        ...mockUser,
        telegramChatId: null,
      });
      await expect(authService.validateTelegramToken(token)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
