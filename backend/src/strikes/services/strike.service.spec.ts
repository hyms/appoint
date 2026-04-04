import { Test, TestingModule } from '@nestjs/testing';
import { StrikeService } from './strike.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('StrikeService', () => {
  let strikeService: StrikeService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    strike: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    slot: {
      updateMany: jest.fn(),
    },
  };

  const mockUser = (role: UserRole, id: string, isActive = true) => ({
    id,
    email: `${id}@example.com`,
    role: role,
    isActive,
    profile: { firstName: 'Test', lastName: 'User' },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrikeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strikeService = module.get<StrikeService>(StrikeService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
    // Explicitly reset individual mocks here for every test
    mockPrismaService.user.findUnique.mockReset();
    mockPrismaService.strike.findFirst.mockReset();
    mockPrismaService.strike.findMany.mockReset();
    mockPrismaService.strike.findUnique.mockReset();
    mockPrismaService.strike.create.mockReset();
    mockPrismaService.strike.update.mockReset();
    mockPrismaService.strike.count.mockReset();
    mockPrismaService.strike.updateMany.mockReset();
    mockPrismaService.appointment.findMany.mockReset();
    mockPrismaService.appointment.updateMany.mockReset();
    mockPrismaService.slot.updateMany.mockReset();
  });

  describe('createStrike', () => {
    it('should create a strike for a patient', async () => {
      const mockPatient = mockUser(UserRole.PATIENT, 'patient-1');
      const mockProfessional = mockUser(UserRole.PROFESSIONAL, 'prof-1');

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockProfessional)
        .mockResolvedValueOnce(mockPatient);

      mockPrismaService.strike.findFirst.mockResolvedValue(null);
      mockPrismaService.strike.create.mockResolvedValue({
        id: 'strike-1',
        patientId: 'patient-1',
        professionalId: 'prof-1',
        reason: 'No-show',
        isActive: true,
        blockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: mockPatient,
        professional: mockProfessional,
      });
      mockPrismaService.strike.count.mockResolvedValue(0);

      const result = await strikeService.createStrike('prof-1', {
        patientId: 'patient-1',
        reason: 'No-show',
      });

      expect(result).toHaveProperty('id');
      expect(result.isActive).toBe(true);
      expect(result.message).toContain('Strike recorded successfully');
    });

    it('should throw ForbiddenException if user is not professional', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        role: UserRole.PATIENT,
      });

      await expect(
        strikeService.createStrike('patient-1', {
          patientId: 'patient-2',
          reason: 'No-show',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if professional not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        strikeService.createStrike('non-existent', {
          patientId: 'patient-1',
          reason: 'No-show',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if patient already has active strike', async () => {
      const mockPatient = mockUser(UserRole.PATIENT, 'patient-1');
      const mockProfessional = mockUser(UserRole.PROFESSIONAL, 'prof-1');

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockProfessional)
        .mockResolvedValueOnce(mockPatient);

      mockPrismaService.strike.findFirst.mockResolvedValue({
        id: 'existing-strike',
        isActive: true,
      });
      mockPrismaService.strike.count.mockResolvedValue(0);

      await expect(
        strikeService.createStrike('prof-1', {
          patientId: 'patient-1',
          reason: 'No-show',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if a recent strike exists', async () => {
      const mockPatient = mockUser(UserRole.PATIENT, 'patient-1');
      const mockProfessional = mockUser(UserRole.PROFESSIONAL, 'prof-1');

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockProfessional)
        .mockResolvedValueOnce(mockPatient);

      mockPrismaService.strike.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'recent-strike',
          strikeDate: new Date(Date.now() - 30 * 60 * 1000),
        });
      mockPrismaService.strike.count.mockResolvedValue(0);

      await expect(
        strikeService.createStrike('prof-1', {
          patientId: 'patient-1',
          reason: 'No-show',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should block the patient if they accumulate 3 or more strikes', async () => {
      const mockPatient = mockUser(UserRole.PATIENT, 'patient-1');
      const mockProfessional = mockUser(UserRole.PROFESSIONAL, 'prof-1');

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockProfessional)
        .mockResolvedValueOnce(mockPatient);
      mockPrismaService.strike.findFirst.mockResolvedValue(null);
      mockPrismaService.strike.create.mockResolvedValue({
        id: 'strike-3',
        patientId: 'patient-1',
        professionalId: 'prof-1',
        reason: 'No-show',
        isActive: true,
        blockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: mockPatient,
        professional: mockProfessional,
      });
      // Simulate 3 active strikes (the one just created + 2 existing)
      mockPrismaService.strike.count.mockResolvedValue(3);

      mockPrismaService.strike.findMany.mockResolvedValueOnce([
        // For blockPatientSlotsForProfessional
        { professionalId: 'prof-1' },
      ]);
      mockPrismaService.strike.updateMany.mockResolvedValue({ count: 3 }); // For updating strikes
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.slot.updateMany.mockResolvedValue({ count: 0 });

      const result = await strikeService.createStrike('prof-1', {
        patientId: 'patient-1',
        reason: 'No-show',
      });

      expect(result).toHaveProperty('id');
      expect(result.message).toContain('Strike recorded successfully');
      expect(mockPrismaService.strike.updateMany).toHaveBeenCalledWith({
        where: {
          patientId: 'patient-1',
          isActive: true,
        },
        data: {
          blockedUntil: expect.any(Date),
        },
      });
    });
  });

  describe('getMyStrikes', () => {
    it('should return all strikes for a patient', async () => {
      const mockStrikes = [
        {
          id: 'strike-1',
          patientId: 'patient-1',
          reason: 'No-show',
          isActive: true,
          professional: { profile: { firstName: 'Dr.', lastName: 'Smith' } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'strike-2',
          patientId: 'patient-1',
          reason: 'Late cancellation',
          isActive: false,
          professional: { profile: { firstName: 'Dr.', lastName: 'Who' } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.strike.findMany.mockResolvedValue(mockStrikes);

      const result = await strikeService.getMyStrikes('patient-1');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.strike.findMany).toHaveBeenCalledWith({
        where: { patientId: 'patient-1' },
        include: expect.any(Object),
        orderBy: { strikeDate: 'desc' },
      });
    });
  });

  describe('resolveStrike', () => {
    it('should resolve an active strike', async () => {
      const mockStrike = {
        id: 'strike-1',
        patientId: 'patient-1',
        professionalId: 'prof-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.strike.findUnique.mockResolvedValue(mockStrike);
      mockPrismaService.strike.update.mockResolvedValue({
        ...mockStrike,
        isActive: false,
        blockedUntil: null,
      });
      mockPrismaService.appointment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.slot.updateMany.mockResolvedValue({ count: 0 });

      const result = await strikeService.resolveStrike(
        'strike-1',
        { resolution: 'Patient explained situation' },
        'prof-1',
        UserRole.PROFESSIONAL,
      );

      expect(result.isActive).toBe(false);
      expect(result.message).toContain('resolved');
      expect(mockPrismaService.strike.update).toHaveBeenCalledWith({
        where: { id: 'strike-1' },
        data: {
          isActive: false,
          blockedUntil: null,
          resolution: 'Patient explained situation',
        },
      });
    });

    it('should throw NotFoundException if strike not found', async () => {
      mockPrismaService.strike.findUnique.mockResolvedValue(null);

      await expect(
        strikeService.resolveStrike(
          'non-existent',
          { resolution: 'Test' },
          'prof-1',
          UserRole.PROFESSIONAL,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow ADMIN to resolve any strike', async () => {
      const mockStrike = {
        id: 'strike-1',
        patientId: 'patient-1',
        professionalId: 'other-prof',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.strike.findUnique.mockResolvedValue(mockStrike);
      mockPrismaService.strike.update.mockResolvedValue({
        ...mockStrike,
        isActive: false,
        blockedUntil: null,
      });
      mockPrismaService.appointment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.slot.updateMany.mockResolvedValue({ count: 0 });

      const result = await strikeService.resolveStrike(
        'strike-1',
        { resolution: 'Admin Override' },
        'admin-user-id',
        UserRole.ADMIN,
      );
      expect(result.isActive).toBe(false);
      expect(result.message).toContain('resolved');
    });
  });

  describe('checkPatientBlocked', () => {
    it('should return true if patient has active strike', async () => {
      mockPrismaService.strike.findFirst.mockResolvedValue({
        id: 'strike-1',
        isActive: true,
        blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await strikeService.checkPatientBlocked(
        'patient-1',
        'prof-1',
      );

      expect(result).toBe(true);
    });

    it('should return false if no active strike', async () => {
      mockPrismaService.strike.findFirst.mockResolvedValue(null);

      const result = await strikeService.checkPatientBlocked(
        'patient-1',
        'prof-1',
      );

      expect(result).toBe(false);
    });
  });

  describe('getPatientBlockStatus', () => {
    it('should return blocked status and active strikes count', async () => {
      mockPrismaService.strike.count.mockResolvedValue(1);
      mockPrismaService.strike.findFirst.mockResolvedValue({
        id: 'strike-1',
        isActive: true,
        blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await strikeService.getPatientBlockStatus('patient-1');

      expect(result.blocked).toBe(true);
      expect(result.activeStrikes).toBe(1);
      expect(result.blockedUntil).toBeInstanceOf(Date);
    });

    it('should return not blocked if no active strike', async () => {
      mockPrismaService.strike.count.mockResolvedValue(0);
      mockPrismaService.strike.findFirst.mockResolvedValue(null);

      const result = await strikeService.getPatientBlockStatus('patient-1');

      expect(result.blocked).toBe(false);
      expect(result.activeStrikes).toBe(0);
      expect(result.blockedUntil).toBeNull();
    });
  });

  describe('cancelUpcomingAppointmentsForBlockedPatient', () => {
    it('should cancel appointments for blocked patient', async () => {
      mockPrismaService.strike.findFirst.mockResolvedValue({
        id: 'strike-1',
        blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        patientId: 'patient-1',
        professionalId: 'prof-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { id: 'apt-1', slotId: 'slot-1' },
        { id: 'apt-2', slotId: 'slot-2' },
      ]);
      mockPrismaService.appointment.updateMany.mockResolvedValue({ count: 3 });
      mockPrismaService.slot.updateMany.mockResolvedValue({ count: 2 });

      const result =
        await strikeService.cancelUpcomingAppointmentsForBlockedPatient(
          'patient-1',
          'prof-1',
        );

      expect(result.cancelled).toBe(3);
      expect(result.message).toContain('3 appointments cancelled');
    });

    it('should return 0 cancelled appointments if patient not blocked', async () => {
      mockPrismaService.strike.findFirst.mockResolvedValue(null);

      const result =
        await strikeService.cancelUpcomingAppointmentsForBlockedPatient(
          'patient-1',
          'prof-1',
        );

      expect(result.cancelled).toBe(0);
      expect(result.message).toContain('not blocked');
    });

    it('should cancel appointments correctly', async () => {
      mockPrismaService.strike.findFirst.mockResolvedValue({
        id: 'strike-1',
        isActive: true,
        blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      mockPrismaService.appointment.updateMany.mockResolvedValue({ count: 5 });

      const result =
        await strikeService.cancelUpcomingAppointmentsForBlockedPatient(
          'patient-1',
          'prof-1',
        );

      expect(result.cancelled).toBe(5);
    });
  });

  describe('getStrikeStats', () => {
    it('should return statistics for a professional', async () => {
      mockPrismaService.strike.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3);

      const result = await strikeService.getStrikeStats('prof-1');

      expect(result).toEqual({
        totalStrikes: 10,
        activeStrikes: 3,
        resolvedStrikes: 7,
        resolutionRate: '70.0%',
      });
    });

    it('should handle zero strikes', async () => {
      mockPrismaService.strike.count.mockResolvedValue(0);

      const result = await strikeService.getStrikeStats('prof-1');

      expect(result.resolutionRate).toBe('0%');
    });
  });
});
