import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProviderService } from './notification-provider.service';
import { NotificationConfigService } from './notification-config.service';
import { NotificationProviderRegistry } from './notification-provider.registry';
import { WhatsAppProvider } from '../providers/whatsapp.provider';
import { TelegramProvider } from '../providers/telegram.provider';
import { EmailProvider } from '../providers/email.provider';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SendNotificationDto,
  NotificationType,
  ProviderType,
} from '../dto/notification.dto';

describe('NotificationProviderService', () => {
  let service: NotificationProviderService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notificationLog: {
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    isWhatsAppConfigured: jest.fn().mockReturnValue(false),
    isTelegramConfigured: jest.fn().mockReturnValue(false),
    isEmailConfigured: jest.fn().mockReturnValue(false),
    getWhatsAppConfig: jest.fn().mockReturnValue(null),
    getTelegramConfig: jest.fn().mockReturnValue(null),
    getEmailConfig: jest.fn().mockReturnValue(null),
  };

  const mockRegistry = {
    get: jest.fn(),
    getDefault: jest.fn(),
    isProviderAvailable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProviderService,
        NotificationConfigService,
        NotificationProviderRegistry,
        WhatsAppProvider,
        TelegramProvider,
        EmailProvider,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationConfigService,
          useValue: mockConfigService,
        },
        {
          provide: NotificationProviderRegistry,
          useValue: mockRegistry,
        },
      ],
    }).compile();

    service = module.get<NotificationProviderService>(
      NotificationProviderService,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should send notification successfully using default provider', async () => {
      const dto: SendNotificationDto = {
        userId: 'user-1',
        type: NotificationType.APPOINTMENT_REMINDER,
        recipient: 'test@example.com',
        content: 'Test message',
      };

      mockPrismaService.notificationLog.create.mockResolvedValue({
        id: 'notif-1',
        ...dto,
        status: 'PENDING',
      });

      const mockEmailProvider = {
        type: ProviderType.EMAIL,
        isConfigured: jest.fn().mockReturnValue(true),
        send: jest
          .fn()
          .mockResolvedValue({ success: true, messageId: 'msg-1' }),
      };

      mockRegistry.get.mockReturnValue(mockEmailProvider);
      mockPrismaService.notificationLog.update.mockResolvedValue({
        id: 'notif-1',
        status: 'SENT',
      });

      const result = await service.sendNotification(dto);

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

      const mockEmailProvider = {
        type: ProviderType.EMAIL,
        isConfigured: jest.fn().mockReturnValue(true),
        send: jest
          .fn()
          .mockResolvedValue({ success: false, error: 'Send failed' }),
      };

      mockRegistry.get.mockReturnValue(mockEmailProvider);
      mockPrismaService.notificationLog.update.mockResolvedValue({
        id: 'notif-1',
        status: 'FAILED',
        errorMessage: 'Send failed',
      });

      const result = await service.sendNotification(dto);

      expect(result.status).toBe('FAILED');
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

      const mockProvider = {
        type: ProviderType.WHATSAPP,
        isConfigured: jest.fn().mockReturnValue(false),
        send: jest.fn().mockResolvedValue({ success: true }),
      };

      mockRegistry.get.mockReturnValue(mockProvider);
      mockPrismaService.notificationLog.update.mockResolvedValue({
        id: 'notif-1',
        status: 'SENT',
      });

      const result = await service.sendAppointmentReminder(appointment);

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

      const mockProvider = {
        type: ProviderType.EMAIL,
        isConfigured: jest.fn().mockReturnValue(false),
        send: jest.fn().mockResolvedValue({ success: true }),
      };

      mockRegistry.get.mockReturnValue(mockProvider);
      mockPrismaService.notificationLog.update.mockResolvedValue({
        id: 'notif-1',
        status: 'SENT',
      });

      const result = await service.sendConfirmation(appointment);

      expect(result).toBeDefined();
    });
  });
});
