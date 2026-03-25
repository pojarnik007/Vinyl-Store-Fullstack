import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../../auth/auth.service';
import { LogAction, LogEntity } from '../../logs/entities/system-log.entity';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');

describe('AuthService — Unit Tests', () => {
  let service: AuthService;
  let mockUsersService: Record<string, any>;
  let mockJwtService: Record<string, any>;
  let mockLogsService: Record<string, any>;

  beforeEach(() => {
    mock.restoreAll();

    mock.method(bcrypt, 'hash', async () => 'hashed-pass');
    mock.method(bcrypt, 'compare', async (plain: string, hash: string) => plain === hash);

    mockUsersService = {
      findByGoogleId: mock.fn(async () => null),
      findByEmail: mock.fn(async () => null),
      findByEmailWithPassword: mock.fn(async () => null),
      create: mock.fn(async (data: any) => ({ id: 'new-id', ...data })),
      update: mock.fn(async (id: string, data: any) => ({ id, ...data })),
    };

    mockJwtService = {
      sign: mock.fn(() => 'mock-token'),
    };

    mockLogsService = {
      log: mock.fn(async (..._args: unknown[]) => {
        /* mock */
      }),
    };

    service = new AuthService(
      mockUsersService as any,
      mockJwtService as any,
      mockLogsService as any,
    );
  });

  describe('findOrCreateUser', () => {
    const googleUser = {
      googleId: 'g-123',
      email: 'test@gmail.com',
      firstName: 'Ivan',
      lastName: 'Ivanov',
      avatar: 'url',
    };

    it('should return existing user if found by googleId', async () => {
      mockUsersService.findByGoogleId = mock.fn(async () => ({
        id: 'existing-id',
        googleId: 'g-123',
      }));

      const result = await service.findOrCreateUser(googleUser);
      assert.strictEqual(result.id, 'existing-id');
      assert.strictEqual(mockUsersService.create.mock.calls.length, 0);
    });

    it('should create new user and log it if not found', async () => {
      mockUsersService.findByGoogleId = mock.fn(async () => null);
      mockUsersService.findByEmail = mock.fn(async () => null);

      const logSpy = mock.fn(async (..._args: unknown[]) => {
        /* mock */
      });
      mockLogsService.log = logSpy;

      const result = await service.findOrCreateUser(googleUser);

      assert.strictEqual(result.id, 'new-id');
      assert.strictEqual(logSpy.mock.calls[0].arguments[0], LogAction.CREATE);
      assert.strictEqual((logSpy.mock.calls[0].arguments[4] as any).provider, 'google');
    });
  });

  describe('register', () => {
    it('should throw ConflictException if email is taken', async () => {
      mockUsersService.findByEmail = mock.fn(async () => ({ id: '1' }));

      await assert.rejects(
        () =>
          service.register({
            email: 'taken@test.com',
            password: '123',
            firstName: 'A',
            lastName: 'B',
          }),
        { name: 'ConflictException' },
      );
    });

    it('should register user and return token', async () => {
      mockUsersService.findByEmail = mock.fn(async () => null);

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'Ivan',
        lastName: 'Ivanov',
      });

      assert.strictEqual(result.access_token, 'mock-token');
      assert.strictEqual(mockUsersService.create.mock.calls.length, 1);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findByEmailWithPassword = mock.fn(async () => null);

      await assert.rejects(() => service.login({ email: 'wrong@test.com', password: '123' }), {
        name: 'UnauthorizedException',
      });
    });

    it('should return token for valid credentials and log login', async () => {
      const mockUser = { id: 'u-1', email: 'ok@test.com', password: 'password123' };
      mockUsersService.findByEmailWithPassword = mock.fn(async () => mockUser);

      const logSpy = mock.fn(async (..._args: unknown[]) => {
        /* mock */
      });
      mockLogsService.log = logSpy;

      const result = await service.login({ email: 'ok@test.com', password: 'password123' });

      assert.strictEqual(result.access_token, 'mock-token');
      assert.strictEqual(logSpy.mock.calls.length, 1);
      assert.strictEqual(logSpy.mock.calls[0].arguments[1], LogEntity.USER);
    });
  });

  describe('googleLogin', () => {
    it('should log google login and return token', async () => {
      const logSpy = mock.fn(async (..._args: unknown[]) => {
        /* mock */
      });
      mockLogsService.log = logSpy;

      const result = await service.googleLogin({ id: 'u-1', email: 'g@test.com' } as any);

      assert.strictEqual(result.access_token, 'mock-token');
      assert.strictEqual((logSpy.mock.calls[0].arguments[4] as any).method, 'google');
    });
  });
});
