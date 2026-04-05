import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    sendMagicLink: jest.fn(),
    validateMagicLink: jest.fn(),
    requestTelegramAuth: jest.fn(),
    validateTelegramToken: jest.fn(),
    getOneSignalPlayerId: jest.fn(),
    updatePlayerId: jest.fn(),
    updateTelegramChatId: jest.fn(),
    getProfessionals: jest.fn(),
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register should call service.register', async () => {
    const dto = { email: 'test@test.com' } as any;
    mockAuthService.register.mockResolvedValue({ id: 'u1' });
    expect(await controller.register(dto)).toEqual({ id: 'u1' });
  });

  it('login should call service.login', async () => {
    const dto = { email: 'test@test.com' } as any;
    const req = { headers: {} } as any;
    mockAuthService.login.mockResolvedValue({ token: 'jwt' });
    expect(await controller.login(dto, '127.0.0.1', req)).toEqual({ token: 'jwt' });
  });

  it('getCurrentUser should return user', async () => {
    const user = { id: 'u1' };
    expect(await controller.getCurrentUser(user)).toEqual(user);
  });
});
