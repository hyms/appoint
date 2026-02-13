import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let paymentsService: PaymentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    appointment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('generatePaymentQR', () => {
    it('should generate QR code for appointment', async () => {
      const mockAppointment = {
        id: 'apt-1',
        patient: {
          profile: { firstName: 'John', lastName: 'Doe' },
        },
        professional: {
          profile: { firstName: 'Dr.', lastName: 'Smith' },
        },
        date: new Date('2024-01-01'),
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await paymentsService.generatePaymentQR('apt-1');

      expect(result).toContain('http');
      expect(result).toContain('.png');
    });

    it('should throw NotFoundException if appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(
        paymentsService.generatePaymentQR('non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadPayment', () => {
    it('should upload payment screenshot', async () => {
      const mockAppointment = { id: 'apt-1' };
      const mockFile = {
        filename: 'payment-123.png',
      } as Express.Multer.File;

      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaService.payment.upsert.mockResolvedValue({
        id: 'payment-1',
        appointmentId: 'apt-1',
        status: 'UPLOADED',
      });

      const result = await paymentsService.uploadPayment('apt-1', mockFile);

      expect(result.status).toBe('UPLOADED');
      expect(mockPrismaService.payment.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException if appointment not found', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(
        paymentsService.uploadPayment('non-existent', {} as Express.Multer.File)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const mockPayment = {
        id: 'payment-1',
        appointmentId: 'apt-1',
        status: 'UPLOADED',
        qrImageUrl: 'http://example.com/payment.png',
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await paymentsService.getPaymentStatus('apt-1');

      expect(result).toEqual(mockPayment);
    });

    it('should return null if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      const result = await paymentsService.getPaymentStatus('apt-1');

      expect(result).toBeNull();
    });
  });

  describe('getPaymentsList', () => {
    it('should return list of payments', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          status: 'UPLOADED',
          appointment: {
            patient: { profile: { firstName: 'John' } },
            professional: { profile: { firstName: 'Dr. Smith' } },
          },
        },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

      const result = await paymentsService.getPaymentsList();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('UPLOADED');
    });

    it('should filter by status', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([]);

      await paymentsService.getPaymentsList({ status: 'VERIFIED' });

      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith({
        where: { status: 'VERIFIED' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const mockPayment = {
        id: 'payment-1',
        appointmentId: 'apt-1',
        status: 'UPLOADED',
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: 'user-1',
      });

      const result = await paymentsService.verifyPayment(
        'payment-1',
        { status: 'VERIFIED' },
        'user-1'
      );

      expect(result.status).toBe('VERIFIED');
      expect(mockPrismaService.appointment.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(
        paymentsService.verifyPayment('non-existent', { status: 'VERIFIED' }, 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
