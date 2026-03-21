import { Test, TestingModule } from '@nestjs/testing';
import { OneSignalProvider } from './onesignal.provider';
import { OneSignalService } from '../onesignal.service';
import { SendResult } from '../interfaces/notification-provider.interface';

// Mock OneSignalService
const mockOneSignalService = {
  isConfigured: jest.fn(),
  sendNotification: jest.fn(),
};

describe('OneSignalProvider', () => {
  let provider: OneSignalProvider;
  let oneSignalService: jest.Mocked<typeof mockOneSignalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OneSignalProvider,
        {
          provide: OneSignalService,
          useValue: mockOneSignalService,
        },
      ],
    }).compile();

    provider = module.get<OneSignalProvider>(OneSignalProvider);
    oneSignalService = module.get(OneSignalService);
    jest.clearAllMocks(); // ADDED: Clear mocks before each test
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should return configured status', () => {
    oneSignalService.isConfigured.mockReturnValue(true);
    expect(provider.isConfigured()).toBe(true);
  });

  describe('send', () => {
    const mockPlayerId = 'mock-player-id-123';
    const mockContent = 'Test Content';
    const mockUserId = 'user-456';
    const mockSendResult: SendResult = {
      success: true,
      messageId: 'os-sent-123',
    };

    it('should return success when configured and recipient is present', async () => {
      oneSignalService.isConfigured.mockReturnValue(true);
      oneSignalService.sendNotification.mockResolvedValue(mockSendResult);

      const result = await provider.send(
        mockPlayerId,
        mockContent,
        'Test Subject',
        { userId: mockUserId },
      );

      expect(oneSignalService.sendNotification).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          heading: 'Test Subject',
          content: mockContent,
          data: { userId: mockUserId },
        },
        mockPlayerId,
      );
      expect(result).toEqual(mockSendResult);
    });

    it('should return simulated result when not configured', async () => {
      oneSignalService.isConfigured.mockReturnValue(false);

      const result = await provider.send(mockPlayerId, mockContent);

      expect(oneSignalService.sendNotification).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^onesignal-simulated-/);
    });

    it('should return failure when recipient (playerId) is missing', async () => {
      oneSignalService.isConfigured.mockReturnValue(true);

      const result = await provider.send('', mockContent);

      expect(oneSignalService.sendNotification).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('PlayerId missing');
    });

    it('should use default subject and data if not provided', async () => {
      oneSignalService.isConfigured.mockReturnValue(true);
      oneSignalService.sendNotification.mockResolvedValue(mockSendResult);

      await provider.send(mockPlayerId, mockContent);

      expect(oneSignalService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: 'Notification', // Default subject
          data: {}, // Default data
        }),
        mockPlayerId,
      );
    });
  });
});
