import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../generated/prisma/enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('allows requests when no role is required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    expect(
      guard.canActivate(
        new ExecutionContextHost([{}], Object, jest.fn()),
      ),
    ).toBe(true);
  });

  it('allows a user with a required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(
      guard.canActivate(
        new ExecutionContextHost(
          [{ user: { sub: 1, role: UserRole.ADMIN } }],
          Object,
          jest.fn(),
        ),
      ),
    ).toBe(true);
  });

  it('rejects a user without a required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() =>
      guard.canActivate(
        new ExecutionContextHost(
          [{ user: { sub: 1, role: UserRole.USER } }],
          Object,
          jest.fn(),
        ),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects requests without an authenticated user when a role is required', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() =>
      guard.canActivate(
        new ExecutionContextHost([{}], Object, jest.fn()),
      ),
    ).toThrow(ForbiddenException);
  });
});
