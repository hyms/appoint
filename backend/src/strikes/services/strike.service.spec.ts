import { Test, TestingModule } from '@nestjs/testing';
import { StrikeService } from './strike.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

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
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    slot: {
      updateMany: jest.fn(),
    },
  };

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
  });

  describe('createStrike', () => {
    it('should create a strike for a patient', async () => {
      const mockPatient = {
        id: 'patient-1',
        role: 'PATIENT',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const mockProfessional = {
        id: 'prof-1',
        profile: {
          firstName: 'Dr.',
          lastName: 'Smith',
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.strike.findFirst.mockResolvedValue(null);
      mockPrismaService.strike.create.mockResolvedValue({
        id: 'strike-1',
        patientId: 'patient-1',
        professionalId: 'prof-1',
        reason: 'No-show',
        isActive: true,
        blockedUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        patient: mockPatient,
        professional: mockProfessional,
      });

      const result = await strikeService.createStrike('prof-1', {
        patientId: 'patient-1',
        reason: 'No-show',
      });

      expect(result).toHaveProperty('id');
      expect(result.isActive).toBe(true);
      expect(result.message).toContain('blocked for 2 days');
    });

    it('should throw NotFoundException if patient not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        strikeService.createStrike('prof-1', {
          patientId: 'non-existent',
          reason: 'No-show',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if patient already has active strike', async () => {
      const mockPatient = {
        id: 'patient-1',
        role: 'PATIENT',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.strike.findFirst.mockResolvedValue({
        id: 'existing-strike',
        isActive: true,
      });

      await expect(
        strikeService.createStrike('prof-1', {
          patientId: 'patient-1',
          reason: 'No-show',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPatientStrikes', () => {
    it('should return all strikes for a patient', async () => {
      const mockStrikes = [
        {
          id: 'strike-1',
          patientId: 'patient-1',
          reason: 'No-show',
          isActive: true,
        },
        {
          id: 'strike-2',
          patientId: 'patient-1',
          reason: 'Late cancellation',
          isActive: false,
        },
      ];

      mockPrismaService.strike.findMany.mockResolvedValue(mockStrikes);

      const result = await strikeService.getPatientStrikes('patient-1');

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
      };

      mockPrismaService.strike.findUnique.mockResolvedValue(mockStrike);
      mockPrismaService.strike.update.mockResolvedValue({
        ...mockStrike,
        isActive: false,
        blockedUntil: null,
      });

      const result = await strikeService.resolveStrike(
        'strike-1',
        { resolution: 'Patient explained situation' },
        'prof-1'
      );

      expect(result.isActive).toBe(false);
      expect(result.message).toContain('resolved');
    });

    it('should throw ForbiddenException if trying to resolve another professional strike', async () => {
      const mockStrike = {
        id: 'strike-1',
        professionalId: 'other-prof',
      };

      mockPrismaService.strike.findUnique.mockResolvedValue(mockStrike);

      await expect(
        strikeService.resolveStrike(
          'strike-1',
          { resolution: 'Test' },
          'prof-1'
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkPatientBlocked', () => {
    it('should return true if patient has active strike', async () => {
      mockPrismaService.strike.findFirst.mockResolvedValue({
        id: 'strike-1',
        isActive: true,
        blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const result = await strikeService.checkPatientBlocked('patient-1', 'prof-1');

      expect(result).toBe(true);
    });

    it('should return false if no active strike', async () => {
      mockPrismaService.strike.findFirst.mockResolvedValue(null);

      const result = await strikeService.checkPatientBlocked('patient-1', 'prof-1');

      expect(result).toBe(false);
    });
  });

  describe('isPatientBlockedForAny', () => {
    it('should return blocked status and strikes list', async () => {
      const mockStrikes = [
        {
          id: 'strike-1',
          isActive: true,
          professional: { profile: { firstName: 'Dr.', lastName: 'Smith' } },
        },
      ];

      mockPrismaService.strike.findMany.mockResolvedValue(mockStrikes);

      const result = await strikeService.isPatientBlockedForAny('patient-1');

      expect(result.blocked).toBe(true);
      expect(result.strikes).toHaveLength(1);
    });
  });

  describe('cancelUpcomingAppointmentsForBlockedPatient', () => {
    it('should cancel appointments for blocked patient', async () => {
      mockPrismaService.strike.findMany.mockResolvedValue([{ id: 'strike-1' }]);
      mockPrismaService.appointment.updateMany.mockResolvedValue({ count: 3 });

      const result = await strikeService.cancelUpcomingAppointmentsForBlockedPatient('patient-1');

      expect(result.cancelled).toBe(3);
      expect(result.message).toContain('3 appointments cancelled');
    });

    it('should return zero if patient not blocked', async () => {
      mockPrismaService.strike.findMany.mockResolvedValue([]);

      const result = await strikeService.cancelUpcomingAppointmentsForBlockedPatient('patient-1');

      expect(result.cancelled).toBe(0);
      expect(result.message).toContain('not blocked');
    });
  });

  describe('getStrikeStats', () => {
    it('should return statistics for a professional', async () => {
      mockPrismaService.strike.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);

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
