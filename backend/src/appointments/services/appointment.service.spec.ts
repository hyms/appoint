import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentsService } from './appointment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StrikeService } from '../../strikes/services/strike.service';
import { AuthorizationService } from '../../common/services/authorization.service';
import { AppointmentAuditService } from './appointment-audit.service';
import { OneSignalService } from '../../notifications/onesignal.service';

describe('AppointmentsService', () => {
  let appointmentsService: AppointmentsService;
  let prismaService: PrismaService;
  let strikeService: StrikeService;
  let oneSignalService: OneSignalService;

  const mockPrismaService = {
    appointment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    slot: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockStrikeService = {
    checkPatientBlocked: jest.fn().mockResolvedValue(false),
  };

  const mockOneSignalService = {
    sendNotification: jest.fn().mockResolvedValue({}),
  };

  const mockAuthorizationService = {
    canBookForOthers: jest.fn().mockReturnValue(true),
    canAccessAppointment: jest
      .fn()
      .mockImplementation((role, userId, patientId, professionalId) => {
        // Return false for unauthorized access test
        if (userId === 'other-user') return false;
        return true;
      }),
    canUpdateAppointmentStatus: jest.fn().mockReturnValue(true),
    canCancelAppointment: jest.fn().mockReturnValue(true),
    isAdminOrSecretary: jest.fn().mockReturnValue(false),
  };

  const mockAuditService = {
    logChange: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StrikeService,
          useValue: mockStrikeService,
        },
        {
          provide: AuthorizationService,
          useValue: mockAuthorizationService,
        },
        {
          provide: AppointmentAuditService,
          useValue: mockAuditService,
        },
        {
          provide: OneSignalService,
          useValue: mockOneSignalService,
        },
      ],
    }).compile();

    appointmentsService = module.get<AppointmentsService>(AppointmentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    strikeService = module.get<StrikeService>(StrikeService);
    oneSignalService = module.get<OneSignalService>(OneSignalService);

    jest.clearAllMocks();
  });

  describe('getAppointmentById', () => {
    it('should return appointment for authorized user', async () => {
      const mockAppointment = {
        id: 'apt-1',
        patientId: 'user-1',
        professionalId: 'doc-1',
        status: 'PENDING',
        patient: { profile: { firstName: 'John' } },
        professional: { profile: { firstName: 'Dr. Smith' } },
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(
        mockAppointment,
      );

      const result = await appointmentsService.getAppointmentById(
        'apt-1',
        'user-1',
        'PATIENT',
      );

      expect(result).toEqual(mockAppointment);
    });

    it('should throw NotFoundException if appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(
        appointmentsService.getAppointmentById(
          'invalid-id',
          'user-1',
          'PATIENT',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        patientId: 'user-1',
        professionalId: 'doc-1',
      });

      await expect(
        appointmentsService.getAppointmentById(
          'apt-1',
          'other-user',
          'PATIENT',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUpcomingAppointments', () => {
    it('should return upcoming appointments for patient', async () => {
      const mockAppointments = [
        { id: 'apt-1', date: new Date(), status: 'PENDING' },
        { id: 'apt-2', date: new Date(), status: 'CONFIRMED' },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(
        mockAppointments,
      );

      const result = await appointmentsService.getUpcomingAppointments(
        'user-1',
        'PATIENT',
      );

      expect(result).toEqual(mockAppointments);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: 'user-1',
          }),
        }),
      );
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      const mockAppointment = {
        id: 'apt-1',
        patientId: 'user-1',
        status: 'PENDING',
        slotId: 'slot-1',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(
        mockAppointment,
      );
      mockPrismaService.$transaction.mockResolvedValue([
        { ...mockAppointment, status: 'CANCELLED' },
        { id: 'slot-1', isBooked: false },
      ]);

      const result = await appointmentsService.cancelAppointment(
        'apt-1',
        { reason: 'Personal reasons' },
        'user-1',
        'PATIENT',
      );

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException for already cancelled appointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: 'apt-1',
        status: 'CANCELLED',
        patientId: 'user-1',
      });

      await expect(
        appointmentsService.cancelAppointment(
          'apt-1',
          { reason: 'Personal reasons' },
          'user-1',
          'PATIENT',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPatientAppointments', () => {
    it('should return all appointments for a patient', async () => {
      const mockAppointments = [
        { id: 'apt-1', patientId: 'user-1' },
        { id: 'apt-2', patientId: 'user-1' },
      ];

      mockPrismaService.appointment.findMany.mockResolvedValue(
        mockAppointments,
      );

      const result = await appointmentsService.getPatientAppointments('user-1');

      expect(result).toEqual(mockAppointments);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { patientId: 'user-1' },
        include: expect.any(Object),
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('getProfessionalAppointments', () => {
    it('should return appointments filtered by date range', async () => {
      const mockAppointments = [{ id: 'apt-1', professionalId: 'doc-1' }];

      mockPrismaService.appointment.findMany.mockResolvedValue(
        mockAppointments,
      );

      const result = await appointmentsService.getProfessionalAppointments(
        'doc-1',
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual(mockAppointments);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            professionalId: 'doc-1',
            date: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            },
          }),
        }),
      );
    });
  });
});
