import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService, REDIS_CLIENT } from '@app/redis';
import { QUEUE_NAMES } from '@app/queue';

describe('Queue & Cache Resilience Smoke Tests', () => {
  let module: TestingModule;
  let redisService: RedisService;
  let mockRedisClient: any;

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      status: 'ready',
    };

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
      ],
      providers: [
        RedisService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('1. BullMQ Queue Registry & Invariants', () => {
    it('defines standard queue names for notifications, emails, and reconciliation', () => {
      expect(QUEUE_NAMES.NOTIFICATION).toBeDefined();
      expect(QUEUE_NAMES.EMAIL).toBeDefined();
      expect(QUEUE_NAMES.RECONCILIATION).toBeDefined();
      expect(typeof QUEUE_NAMES.NOTIFICATION).toBe('string');
    });
  });

  describe('2. Cache Provider & Fallback Resilience', () => {
    it('returns cached value if present in Redis cache', async () => {
      const cachedData = { prayerTimes: ['05:00', '13:00'] };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const fallbackFn = jest.fn();
      const result = await redisService.getOrSet('test-key', fallbackFn, 60);

      expect(result).toEqual(cachedData);
      expect(fallbackFn).not.toHaveBeenCalled();
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('gracefully executes fetchFn and stores in cache when key is missing (cache miss)', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const freshData = { status: 'FRESH', count: 42 };
      const fallbackFn = jest.fn().mockResolvedValue(freshData);

      const result = await redisService.getOrSet('fresh-key', fallbackFn, 120);

      expect(result).toEqual(freshData);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'fresh-key',
        JSON.stringify(freshData),
        'EX',
        120,
      );
    });

    it('gracefully degrades and executes fetchFn if Redis throws an I/O error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('ECONNREFUSED'));
      mockRedisClient.set.mockRejectedValue(new Error('ECONNREFUSED'));

      const fallbackData = { fallback: true };
      const fallbackFn = jest.fn().mockResolvedValue(fallbackData);

      // Must not crash the caller when Redis encounters socket failure
      const result = await redisService.getOrSet('failing-key', fallbackFn, 60);

      expect(result).toEqual(fallbackData);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
    });

    it('safely handles cache invalidation for single and multiple keys', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await redisService.invalidate('cache-key-1');
      expect(mockRedisClient.del).toHaveBeenCalledWith('cache-key-1');

      await redisService.invalidate(['cache-key-2', 'cache-key-3']);
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        'cache-key-2',
        'cache-key-3',
      );
    });
  });
});
