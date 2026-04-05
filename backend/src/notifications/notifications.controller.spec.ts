import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationProviderService } from './services/notification-provider.service';
import { NotificationProviderRegistry } from './services/notification-provider.registry';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationProviderService;
  let registry: NotificationProviderRegistry;
  let prisma: PrismaService;

  const mockNotificationService = {
    sendNotification: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockRegistry = {
    get: jest.fn(),
  };

  const mockPrisma = {
    notificationLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationProviderService, useValue: mockNotificationService },
        { provide: NotificationProviderRegistry, useValue: mockRegistry },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationProviderService>(NotificationProviderService);
    registry = module.get<NotificationProviderRegistry>(NotificationProviderRegistry);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('sendNotification should call service', async () => {
    const dto = { userId: '1', message: 'test' } as any;
    expect(await controller.sendNotification(dto)).toEqual({ success: true });
    expect(service.sendNotification).toHaveBeenCalledWith(dto);
  });

  it('sendBulkNotification should return queue message', async () => {
    expect(await controller.sendBulkNotification({} as any)).toEqual({ message: 'Bulk notifications queued' });
  });

  it('getLogs should return logs', async () => {
    expect(await controller.getLogs()).toEqual([]);
    expect(prisma.notificationLog.findMany).toHaveBeenCalled();
  });

  it('testWhatsApp should return success', async () => {
    const mockProvider = { send: jest.fn().mockResolvedValue({ success: true }) };
    registry.get.mockReturnValue(mockProvider);
    expect(await controller.testWhatsApp({ phone: '1', message: 'hi' })).toEqual({ success: true });
  });

  it('testTelegram should return success', async () => {
    const mockProvider = { send: jest.fn().mockResolvedValue({ success: true }) };
    registry.get.mockReturnValue(mockProvider);
    expect(await controller.testTelegram({ chatId: '1', message: 'hi' })).toEqual({ success: true });
  });

  it('testEmail should return success', async () => {
    const mockProvider = { send: jest.fn().mockResolvedValue({ success: true }) };
    registry.get.mockReturnValue(mockProvider);
    expect(await controller.testEmail({ to: 'a@b.com', subject: 'hi', message: 'hi' })).toEqual({ success: true });
  });
});
