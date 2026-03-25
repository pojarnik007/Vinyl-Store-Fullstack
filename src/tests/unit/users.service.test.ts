import { describe, it, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import { UsersService } from '../../users/users.service';
import { LogAction } from '../../logs/entities/system-log.entity';

describe('UsersService — Unit Tests', () => {
  let service: UsersService;
  let mockRepo: Record<string, any>;
  let mockLogsService: Record<string, any>;

  before(() => {
    mockRepo = {
      findOne: mock.fn(async () => null),
      create: mock.fn((data: any) => ({ id: 'user-uuid', ...data })),
      save: mock.fn(async (user: any) => user),
      update: mock.fn(async () => ({})),
      remove: mock.fn(async () => ({})),
      createQueryBuilder: mock.fn(() => ({
        addSelect: mock.fn(() => ({
          where: mock.fn(() => ({
            getOne: mock.fn(async () => null),
          })),
        })),
      })),
    };

    mockLogsService = {
      log: mock.fn(async (..._args: unknown[]) => {
        /* mock */
      }),
    };

    service = new UsersService(mockRepo as never, mockLogsService as never);
  });

  describe('findById', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockRepo.findOne = mock.fn(async () => null);
      await assert.rejects(() => service.findById('non-existent'), {
        name: 'NotFoundException',
      });
    });

    it('should return user if found', async () => {
      const mockUser = { id: 'uuid', email: 'test@test.com' };
      mockRepo.findOne = mock.fn(async () => mockUser);
      const result = await service.findById('uuid');
      assert.deepStrictEqual(result, mockUser);
    });
  });

  describe('create', () => {
    it('should create a user and log the action', async () => {
      const logSpy = mock.fn(async (..._args: unknown[]) => {
        /* mock */
      });
      mockLogsService.log = logSpy;

      const userData = { email: 'new@test.com', firstName: 'Ivan' };
      const result = await service.create(userData);

      assert.strictEqual(result.email, userData.email);
      assert.strictEqual(logSpy.mock.calls.length, 1);
      assert.strictEqual(logSpy.mock.calls[0].arguments[0], LogAction.CREATE);
      assert.strictEqual((logSpy.mock.calls[0].arguments[4] as any).email, userData.email);
    });
  });

  describe('update', () => {
    it('should update user and log the action', async () => {
      const logSpy = mock.fn(async (..._args: unknown[]) => {
        /* mock */
      });
      mockLogsService.log = logSpy;

      const userId = 'user-uuid';
      const updateData = { firstName: 'Ivan' };
      const updatedUser = { id: userId, email: 'test@test.com', ...updateData };

      mockRepo.update = mock.fn(async () => ({}));
      mockRepo.findOne = mock.fn(async () => updatedUser);

      const result = await service.update(userId, updateData);

      assert.strictEqual(result.firstName, 'Ivan');
      assert.strictEqual(logSpy.mock.calls[0].arguments[0], LogAction.UPDATE);
    });
  });

  describe('delete', () => {
    it('should remove user and log the action', async () => {
      const logSpy = mock.fn(async (..._args: unknown[]) => {
        /* mock */
      });
      mockLogsService.log = logSpy;

      const userId = 'delete-me';
      const mockUser = { id: userId, email: 'bye@test.com' };

      mockRepo.findOne = mock.fn(async () => mockUser);
      mockRepo.remove = mock.fn(async () => ({}));

      await service.delete(userId);

      assert.strictEqual(mockRepo.remove.mock.calls.length, 1);
      assert.strictEqual((logSpy.mock.calls[0].arguments[4] as any).email, 'bye@test.com');
    });
  });

  describe('findProfile', () => {
    it('should return profile with relations', async () => {
      const mockProfile = { id: 'uuid', reviews: [], orders: [] };
      mockRepo.findOne = mock.fn(async () => mockProfile);

      const result = await service.findProfile('uuid');
      const lastCall = mockRepo.findOne.mock.calls[0];
      const args = lastCall.arguments[0] as any;

      assert.ok(args.relations.includes('reviews'));
      assert.strictEqual(result.id, 'uuid');
    });
  });
});
