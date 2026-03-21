import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (
    user: any,
    handler: any = {},
    classs: any = {},
  ) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => handler,
      getClass: () => classs,
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ role: UserRole.PATIENT });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext({ role: UserRole.ADMIN });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN, UserRole.SECRETARY]);

    const context = createMockContext({ role: UserRole.PATIENT });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when user is undefined', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext(undefined);
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should allow access when user has one of multiple required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN, UserRole.SECRETARY]);

    const context = createMockContext({ role: UserRole.SECRETARY });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});
