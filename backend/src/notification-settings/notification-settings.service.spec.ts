import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSettingsService } from './notification-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/config.service';
import { ConfigService } from '@nestjs/config';

describe('NotificationSettingsService', () => {
  let service: NotificationSettingsService;
  let prismaService: any;
  let appConfigService: AppConfigService;

  const mockAppConfigService = {
    telegramBotToken: 'test-telegram-token',
    telegramTestChatId: 'test-chat-id',
    whatsappToken: 'test-whatsapp-token',
    whatsappPhoneId: 'test-whatsapp-phone-id',
    twilioAccountSid: 'test-twilio-sid',
    twilioAuthToken: 'test-twilio-token',
    twilioFromNumber: 'test-from-number',
    twilioTestToNumber: 'test-to-number',
  };

  beforeEach(async () => {
    const mockPrisma = {
      notificationSettings: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSettingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    }).compile();

    service = module.get<NotificationSettingsService>(
      NotificationSettingsService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    appConfigService = module.get<AppConfigService>(AppConfigService);
  });

  describe('getOrCreateSettings', () => {
    it('should return existing settings', async () => {
      const settings = { id: '1', emailEnabled: true };
      prismaService.notificationSettings.findFirst.mockResolvedValue(settings);

      const result = await service.getOrCreateSettings();

      expect(result).toEqual(settings);
      expect(prismaService.notificationSettings.findFirst).toHaveBeenCalled();
    });

    it('should create default settings if none exist', async () => {
      prismaService.notificationSettings.findFirst.mockResolvedValue(null);
      prismaService.notificationSettings.create.mockResolvedValue({
        id: '1',
        emailEnabled: false,
      });

      const result = await service.getOrCreateSettings();

      expect(prismaService.notificationSettings.create).toHaveBeenCalledWith({
        data: {},
      });
      expect(result).toBeDefined();
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      const existingSettings = { id: '1' };
      const updateData = { emailEnabled: true };
      const updatedSettings = { id: '1', ...updateData };

      prismaService.notificationSettings.findFirst.mockResolvedValue(
        existingSettings,
      );
      prismaService.notificationSettings.update.mockResolvedValue(
        updatedSettings,
      );

      const result = await service.updateSettings(updateData);

      expect(prismaService.notificationSettings.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
      expect(result).toEqual(updatedSettings);
    });

    it('should create settings if none exist', async () => {
      prismaService.notificationSettings.findFirst.mockResolvedValue(null);
      prismaService.notificationSettings.create.mockResolvedValue({
        id: '1',
        emailEnabled: false,
      });
      prismaService.notificationSettings.update.mockResolvedValue({
        id: '1',
        emailEnabled: true,
      });

      const result = await service.updateSettings({ emailEnabled: true });

      expect(prismaService.notificationSettings.create).toHaveBeenCalled();
      expect(prismaService.notificationSettings.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { emailEnabled: true },
      });
      expect(result).toEqual({ id: '1', emailEnabled: true });
    });
  });

  describe('testTelegram', () => {
    it('should return success when telegram API call succeeds', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: { message_id: 1 } }),
      });

      const result = await service.testTelegram();

      expect(result.success).toBe(true);
    });

    it('should return error when telegram API call fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ description: 'Invalid token' }),
      });

      const result = await service.testTelegram();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('testWhatsApp', () => {
    it('should return error about business verification', async () => {
      const result = await service.testWhatsapp();

      expect(result.success).toBe(false);
      expect(result.error).toContain('business verification');
    });
  });

  describe('testSms', () => {
    it('should return success when SMS API call succeeds', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sid: 'SM123' }),
      });

      const result = await service.testSms();

      expect(result.success).toBe(true);
    });

    it('should return error when SMS API call fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });

      const result = await service.testSms();

      expect(result.success).toBe(false);
    });

    it('should return error on exception', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.testSms();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });
});
