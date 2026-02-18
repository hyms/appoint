import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProvider } from './notification-provider.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SendNotificationDto,
  NotificationType,
  ProviderType,
} from '../dto/notification.dto';

describe('NotificationProvider', () => {
  let notificationProvider: NotificationProvider;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notificationLog: {
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProvider,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    notificationProvider =
      module.get<NotificationProvider>(NotificationProvider);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send WhatsApp notification successfully', async () => {
      const dto: SendNotificationDto = {
        userId: 'user-1',
        type: NotificationType.APPOINTMENT_REMINDER,
        recipient: '+1234567890',
        content: 'Test message',
        provider: ProviderType.WHATSAPP,
      };

      mockPrismaService.notificationLog.create.mockResolvedValue({
        id: 'notif-1',
        ...dto,
        status: 'PENDING',
      });
      mockPrismaService.notificationLog.update.mockResolvedValue({
        id: 'notif-1',
        status: 'SENT',
      });

      const result = await notificationProvider.sendNotification(dto);

      expect(result.status).toBe('SENT');
    });

    it('should handle failed notification', async () => {
      const dto: SendNotificationDto = {
        userId: 'user-1',
        type: NotificationType.MAGIC_LINK,
        recipient: 'test@example.com',
        content: 'Magic link',
      };

      mockPrismaService.notificationLog.create.mockResolvedValue({
        id: 'notif-1',
        status: 'PENDING',
      });
      mockPrismaService.notificationLog.update.mockResolvedValue({
        id: 'notif-1',
        status: 'FAILED',
        errorMessage: 'Sending failed',
      });

      jest
        .spyOn(notificationProvider, 'sendEmail')
        .mockResolvedValue({ success: false });

      const result = await notificationProvider.sendNotification(dto);

      expect(result.status).toBe('FAILED');
    });
  });

  describe('sendWhatsApp', () => {
    it('should simulate WhatsApp when credentials not configured', async () => {
      delete process.env.WHATSAPP_TOKEN;
      delete process.env.WHATSAPP_PHONE_ID;

      const result = await notificationProvider.sendWhatsApp(
        '+1234567890',
        'Test message',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendTelegram', () => {
    it('should simulate Telegram when token not configured', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;

      const result = await notificationProvider.sendTelegram(
        '123456',
        'Test message',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendEmail', () => {
    it('should simulate email when SMTP not configured', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;

      const result = await notificationProvider.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test body',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendAppointmentReminder', () => {
    it('should format and send reminder', async () => {
      const appointment = {
        id: 'apt-1',
        date: new Date('2024-01-01'),
        startTime: new Date('2024-01-01T10:00:00'),
        patient: {
          id: 'patient-1',
          email: 'patient@example.com',
          phone: '+1234567890',
          profile: { firstName: 'John' },
        },
        professional: {
          profile: { lastName: 'Smith' },
        },
        location: { name: 'Main Clinic' },
      };

      mockPrismaService.notificationLog.create.mockResolvedValue({
        id: 'notif-1',
        status: 'PENDING',
      });
      mockPrismaService.notificationLog.update.mockResolvedValue({
        id: 'notif-1',
        status: 'SENT',
      });

      const result =
        await notificationProvider.sendAppointmentReminder(appointment);

      expect(result).toBeDefined();
    });
  });

  describe('sendConfirmation', () => {
    it('should send confirmation email', async () => {
      const appointment = {
        id: 'apt-1',
        date: new Date('2024-01-01'),
        startTime: new Date('2024-01-01T10:00:00'),
        patientId: 'patient-1',
        patient: {
          email: 'patient@example.com',
          profile: { firstName: 'John' },
        },
        professional: {
          profile: { lastName: 'Smith' },
        },
      };

      mockPrismaService.notificationLog.create.mockResolvedValue({
        id: 'notif-1',
        status: 'PENDING',
      });
      mockPrismaService.notificationLog.update.mockResolvedValue({
        id: 'notif-1',
        status: 'SENT',
      });

      const result = await notificationProvider.sendConfirmation(appointment);

      expect(result).toBeDefined();
    });
  });

  describe('sendEmergencyNotification', () => {
    it('should send notifications to all affected patients', async () => {
      const affectedPatients = [
        { id: 'patient-1', email: 'patient1@example.com' },
        { id: 'patient-2', email: 'patient2@example.com' },
      ];

      mockPrismaService.notificationLog.createMany.mockResolvedValue({
        count: 2,
      });

      const result = await notificationProvider.sendEmergencyNotification(
        'Emergency message',
        affectedPatients,
      );

      expect(result).toHaveLength(2);
    });
  });
});
