import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyService } from './emergency.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('EmergencyService', () => {
  let emergencyService: EmergencyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    emergencyButton: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    slot: {
      updateMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notificationLog: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    emergencyService = module.get<EmergencyService>(EmergencyService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('activateEmergency', () => {
    it('should activate emergency mode successfully', async () => {
      const mockEmergency = {
        id: 'emergency-1',
        isActive: false,
        affectedDays: 2,
        message: null,
      };

      mockPrismaService.emergencyButton.findFirst.mockResolvedValue(mockEmergency);
      mockPrismaService.emergencyButton.update.mockResolvedValue({
        ...mockEmergency,
        isActive: true,
        message: 'Emergency situation',
      });
      mockPrismaService.slot.updateMany.mockResolvedValue({ count: 10 });
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      const result = await emergencyService.activateEmergency({
        message: 'Emergency situation',
        affectedDays: 3,
      });

      expect(result.isActive).toBe(true);
      expect(result.message).toBe('Emergency situation');
      expect(mockPrismaService.slot.updateMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException if emergency button not configured', async () => {
      mockPrismaService.emergencyButton.findFirst.mockResolvedValue(null);

      await expect(
        emergencyService.activateEmergency({ message: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already active', async () => {
      mockPrismaService.emergencyButton.findFirst.mockResolvedValue({
        id: 'emergency-1',
        isActive: true,
      });

      await expect(
        emergencyService.activateEmergency({ message: 'Test' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deactivateEmergency', () => {
    it('should deactivate emergency mode', async () => {
      mockPrismaService.emergencyButton.findFirst.mockResolvedValue({
        id: 'emergency-1',
        isActive: true,
      });
      mockPrismaService.emergencyButton.update.mockResolvedValue({
        id: 'emergency-1',
        isActive: false,
        message: 'Resolved',
      });

      const result = await emergencyService.deactivateEmergency({
        reason: 'Resolved',
      });

      expect(result.isActive).toBe(false);
      expect(result.message).toBe('Resolved');
    });

    it('should throw BadRequestException if not active', async () => {
      mockPrismaService.emergencyButton.findFirst.mockResolvedValue({
        id: 'emergency-1',
        isActive: false,
      });

      await expect(
        emergencyService.deactivateEmergency({ reason: 'Test' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEmergencyStatus', () => {
    it('should return emergency status with affected appointments', async () => {
      mockPrismaService.emergencyButton.findFirst.mockResolvedValue({
        id: 'emergency-1',
        isActive: true,
        message: 'Emergency active',
      });
      mockPrismaService.appointment.count.mockResolvedValue(5);

      const result = await emergencyService.getEmergencyStatus();

      expect(result.isActive).toBe(true);
      expect(result.message).toBe('Emergency active');
      expect(result.affectedAppointments).toBe(5);
    });
  });

  describe('getAffectedPatients', () => {
    it('should return affected patients when emergency is active', async () => {
      const mockAppointments = [
        {
          id: 'apt-1',
          patient: { profile: { firstName: 'John', lastName: 'Doe' } },
          professional: { profile: { firstName: 'Dr.', lastName: 'Smith' } },
        },
      ];

      mockPrismaService.emergencyButton.findFirst.mockResolvedValue({
        id: 'emergency-1',
        isActive: true,
        message: 'Emergency message',
        affectedDays: 2,
      });
      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

      const result = await emergencyService.getAffectedPatients();

      expect(result.emergencyMessage).toBe('Emergency message');
      expect(result.affectedAppointments).toBe(1);
      expect(result.appointments).toHaveLength(1);
    });

    it('should return empty if no emergency', async () => {
      mockPrismaService.emergencyButton.findFirst.mockResolvedValue({
        isActive: false,
      });

      const result = await emergencyService.getAffectedPatients();

      expect(result.affectedPatients).toEqual([]);
      expect(result.message).toContain('No active emergency');
    });
  });
});
