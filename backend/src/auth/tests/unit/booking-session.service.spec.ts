import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { RedisService } from '../../../common/redis/redis.service.js';
import {
  BookingSessionInvalidaException,
  BookingSessionUsadaException,
} from '../../exceptions/auth.exceptions.js';
import { BookingSessionService } from '../../booking/booking-session.service.js';

const BOOKING_SECRET = 'test-booking-secret-32-chars-minimum!';

describe('BookingSessionService', () => {
  let service: BookingSessionService;
  let redis: {
    setJson: ReturnType<typeof vi.fn>;
    getJson: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };

  beforeAll(() => {
    process.env.JWT_BOOKING_SECRET = BOOKING_SECRET;
    process.env.JWT_ACCESS_SECRET = BOOKING_SECRET;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    redis = {
      setJson: vi.fn().mockResolvedValue(undefined),
      getJson: vi.fn(),
      del: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingSessionService,
        JwtService,
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(BookingSessionService);
    service.onModuleInit();
  });

  it('emite booking token y guarda en Redis', async () => {
    const result = await service.issueFromGoogleProfile({
      email: 'cliente@gmail.com',
      name: 'Cliente Demo',
      googleSub: 'google-123',
    });

    expect(result.tokenType).toBe('Bearer');
    expect(result.bookingToken).toBeTruthy();
    expect(result.client.email).toBe('cliente@gmail.com');
    expect(redis.setJson).toHaveBeenCalledOnce();
  });

  it('assertValid falla si Redis no tiene sesión', async () => {
    redis.getJson.mockResolvedValue(null);

    const issued = await service.issueFromGoogleProfile({
      email: 'a@b.com',
      name: 'A',
      googleSub: 'g1',
    });

    await expect(service.assertValid(issued.bookingToken)).rejects.toBeInstanceOf(
      BookingSessionInvalidaException,
    );
  });

  it('consume marca used y assertValid posterior falla', async () => {
    const store = new Map<string, unknown>();
    redis.setJson.mockImplementation(async (key: string, value: unknown) => {
      store.set(key, value);
    });
    redis.getJson.mockImplementation(async (key: string) => store.get(key) ?? null);

    const issued = await service.issueFromGoogleProfile({
      email: 'a@b.com',
      name: 'A',
      googleSub: 'g1',
    });

    await service.consume(issued.bookingToken);

    await expect(service.assertValid(issued.bookingToken)).rejects.toBeInstanceOf(
      BookingSessionUsadaException,
    );
  });
});
