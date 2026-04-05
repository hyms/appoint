import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSettingsController } from './notification-settings.controller';
import { NotificationSettingsService } from './notification-settings.service';

describe('NotificationSettingsController', () => {
  let controller: NotificationSettingsController;
  let service: NotificationSettingsService;

  const mockService = {
    getOrCreateSettings: jest.fn().mockResolvedValue({}),
    updateSettings: jest.fn().mockResolvedValue({}),
    testTelegram: jest.fn().mockResolvedValue({ success: true }),
    testWhatsapp: jest.fn().mockResolvedValue({ success: true }),
    testSms: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationSettingsController],
      providers: [
        { provide: NotificationSettingsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<NotificationSettingsController>(NotificationSettingsController);
    service = module.get<NotificationSettingsService>(NotificationSettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getSettings should call service', async () => {
    await controller.getSettings();
    expect(service.getOrCreateSettings).toHaveBeenCalled();
  });

  it('updateSettings should call service', async () => {
    await controller.updateSettings({} as any);
    expect(service.updateSettings).toHaveBeenCalled();
  });

  it('testTelegram should call service', async () => {
    await controller.testTelegram();
    expect(service.testTelegram).toHaveBeenCalled();
  });

  it('testWhatsApp should call service', async () => {
    await controller.testWhatsApp();
    expect(service.testWhatsapp).toHaveBeenCalled();
  });

  it('testSms should call service', async () => {
    await controller.testSms();
    expect(service.testSms).toHaveBeenCalled();
  });
});
