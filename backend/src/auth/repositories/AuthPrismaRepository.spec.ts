import { Test, TestingModule } from '@nestjs/testing';
import { AuthPrismaRepository } from './AuthPrismaRepository';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('AuthPrismaRepository', () => {
  let repository: AuthPrismaRepository;
  let prismaService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    phone: '+1234567890',
    role: UserRole.PATIENT,
    passwordHash: 'hash123',
    magicToken: null,
    magicExpiresAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'profile-1',
      firstName: 'John',
      lastName: 'Doe',
      userId: 'user-1',
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthPrismaRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<AuthPrismaRepository>(AuthPrismaRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findUnique', () => {
    it('should find user by args', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUnique({ where: { id: 'user-1' } });

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUnique({ where: { id: 'nonexistent' } });

      expect(result).toBeNull();
    });
  });

  describe('findUserForLogin', () => {
    it('should find user by email with profile', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserForLogin('test@test.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        include: { profile: true },
      });
    });
  });

  describe('validateMagicLinkToken', () => {
    it('should validate token and clear it', async () => {
      const token = 'valid-token';
      const futureDate = new Date(Date.now() + 3600000);
      
      prismaService.user.findFirst.mockResolvedValue({ ...mockUser, magicToken: token, magicExpiresAt: futureDate });
      prismaService.user.update.mockResolvedValue(mockUser);

      const result = await repository.validateMagicLinkToken(token);

      expect(result).toBeDefined();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { magicToken: null, magicExpiresAt: null },
      });
    });

    it('should return null for invalid token', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await repository.validateMagicLinkToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token (not found in query)', async () => {
      // When token is expired, findFirst returns null because the query filters by magicExpiresAt >= now
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await repository.validateMagicLinkToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserById('user-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('user-1');
    });

    it('should return null for nonexistent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findUsers', () => {
    it('should find all users', async () => {
      prismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await repository.findUsers();

      expect(result).toHaveLength(1);
      expect(result[0].passwordHash).toBeUndefined();
    });

    it('should filter users by role', async () => {
      prismaService.user.findMany.mockResolvedValue([mockUser]);

      await repository.findUsers(UserRole.ADMIN);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: UserRole.ADMIN },
        }),
      );
    });
  });

  describe('findProfessionals', () => {
    it('should find all professionals', async () => {
      const professionalUser = {
        ...mockUser,
        role: UserRole.PROFESSIONAL,
        profile: { firstName: 'Dr', lastName: 'Smith' },
      };
      prismaService.user.findMany.mockResolvedValue([professionalUser]);

      const result = await repository.findProfessionals();

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Dr');
      expect(result[0].lastName).toBe('Smith');
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updatedUser = { ...mockUser, email: 'new@test.com' };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.updateUser('user-1', { email: 'new@test.com' }, {});

      expect(result).toBeDefined();
    });

    it('should return null if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.updateUser('nonexistent', {}, {});

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.delete.mockResolvedValue(mockUser);

      const result = await repository.deleteUser('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.deleteUser('nonexistent');

      expect(result).toBeNull();
    });
  });
});
