import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from './config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppConfigService],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('frontendUrl', () => {
    it('should return env value when set', () => {
      process.env.FRONTEND_URL = 'https://example.com';
      expect(service.frontendUrl).toBe('https://example.com');
    });

    it('should return default when not set', () => {
      delete process.env.FRONTEND_URL;
      expect(service.frontendUrl).toBe('http://localhost:5173');
    });
  });

  describe('apiUrl', () => {
    it('should return env value when set', () => {
      process.env.API_URL = 'https://api.example.com';
      expect(service.apiUrl).toBe('https://api.example.com');
    });

    it('should return default when not set', () => {
      delete process.env.API_URL;
      expect(service.apiUrl).toBe('http://localhost:3000');
    });
  });

  describe('magicLinkExpiryMinutes', () => {
    it('should return env value when set', () => {
      process.env.MAGIC_LINK_EXPIRY_MINUTES = '30';
      expect(service.magicLinkExpiryMinutes).toBe(30);
    });

    it('should return default when not set', () => {
      delete process.env.MAGIC_LINK_EXPIRY_MINUTES;
      expect(service.magicLinkExpiryMinutes).toBe(15);
    });
  });

  describe('nodeEnv', () => {
    it('should return env value when set', () => {
      process.env.NODE_ENV = 'production';
      expect(service.nodeEnv).toBe('production');
    });

    it('should return development when not set', () => {
      delete process.env.NODE_ENV;
      expect(service.nodeEnv).toBe('development');
    });
  });

  describe('isProduction', () => {
    it('should return true when nodeEnv is production', () => {
      process.env.NODE_ENV = 'production';
      expect(service.isProduction).toBe(true);
    });

    it('should return false when nodeEnv is development', () => {
      process.env.NODE_ENV = 'development';
      expect(service.isProduction).toBe(false);
    });
  });

  describe('corsOrigin', () => {
    it('should return env value when set', () => {
      process.env.CORS_ORIGIN = 'https://example.com';
      expect(service.corsOrigin).toBe('https://example.com');
    });

    it('should return default when not set', () => {
      delete process.env.CORS_ORIGIN;
      expect(service.corsOrigin).toBe('http://localhost:5173');
    });
  });

  describe('whatsappToken', () => {
    it('should return env value when set', () => {
      process.env.WHATSAPP_TOKEN = 'test-token';
      expect(service.whatsappToken).toBe('test-token');
    });

    it('should return undefined when not set', () => {
      delete process.env.WHATSAPP_TOKEN;
      expect(service.whatsappToken).toBeUndefined();
    });
  });

  describe('whatsappPhoneId', () => {
    it('should return env value when set', () => {
      process.env.WHATSAPP_PHONE_ID = 'test-phone-id';
      expect(service.whatsappPhoneId).toBe('test-phone-id');
    });

    it('should return undefined when not set', () => {
      delete process.env.WHATSAPP_PHONE_ID;
      expect(service.whatsappPhoneId).toBeUndefined();
    });
  });

  describe('telegramBotToken', () => {
    it('should return env value when set', () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
      expect(service.telegramBotToken).toBe('test-bot-token');
    });

    it('should return undefined when not set', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      expect(service.telegramBotToken).toBeUndefined();
    });
  });

  describe('smtpHost', () => {
    it('should return env value when set', () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      expect(service.smtpHost).toBe('smtp.example.com');
    });

    it('should return undefined when not set', () => {
      delete process.env.SMTP_HOST;
      expect(service.smtpHost).toBeUndefined();
    });
  });

  describe('smtpPort', () => {
    it('should return env value when set', () => {
      process.env.SMTP_PORT = '587';
      expect(service.smtpPort).toBe(587);
    });

    it('should return default when not set', () => {
      delete process.env.SMTP_PORT;
      expect(service.smtpPort).toBe(587);
    });
  });

  describe('smtpUser', () => {
    it('should return env value when set', () => {
      process.env.SMTP_USER = 'test-user';
      expect(service.smtpUser).toBe('test-user');
    });

    it('should return undefined when not set', () => {
      delete process.env.SMTP_USER;
      expect(service.smtpUser).toBeUndefined();
    });
  });

  describe('smtpPass', () => {
    it('should return env value when set', () => {
      process.env.SMTP_PASS = 'test-pass';
      expect(service.smtpPass).toBe('test-pass');
    });

    it('should return undefined when not set', () => {
      delete process.env.SMTP_PASS;
      expect(service.smtpPass).toBeUndefined();
    });
  });

  describe('getDatabaseUrl', () => {
    it('should return env value when set', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      expect(service.getDatabaseUrl()).toBe('postgresql://localhost:5432/db');
    });

    it('should return undefined when not set', () => {
      delete process.env.DATABASE_URL;
      expect(service.getDatabaseUrl()).toBeUndefined();
    });
  });

  describe('getJwtSecret', () => {
    it('should return env value when set', () => {
      process.env.JWT_SECRET = 'my-secret';
      expect(service.getJwtSecret()).toBe('my-secret');
    });

    it('should return default when not set', () => {
      delete process.env.JWT_SECRET;
      expect(service.getJwtSecret()).toBe(
        'default-secret-change-in-production',
      );
    });
  });

  describe('getJwtExpiresIn', () => {
    it('should return env value when set', () => {
      process.env.JWT_EXPIRES_IN = '7d';
      expect(service.getJwtExpiresIn()).toBe('7d');
    });

    it('should return default when not set', () => {
      delete process.env.JWT_EXPIRES_IN;
      expect(service.getJwtExpiresIn()).toBe('1d');
    });
  });
});
