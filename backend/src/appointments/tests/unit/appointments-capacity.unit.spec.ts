/**
 * Cupos por profesional + validación de ventana (H2).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvailabilityService } from '../../../availability/availability.service.js';
import { HorarioNoDisponibleException } from '../../exceptions/appointments.exceptions.js';
import { AppointmentsService } from '../../appointments.service.js';

describe('AppointmentsService capacity / window (unit)', () => {
  const query = vi.fn();
  const transaction = vi.fn(async (fn: (q: typeof query) => Promise<unknown>) =>
    fn(query),
  );
  const db = { query, transaction };
  const availability = new AvailabilityService();
  const bookingSessions = {
    assertValid: vi.fn(),
    consume: vi.fn(),
  };
  const mail = {
    getAppPublicUrl: () => 'http://localhost:3000',
    send: vi.fn(),
  };

  let service: AppointmentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AppointmentsService(
      db as never,
      availability,
      bookingSessions as never,
      mail as never,
    );
  });

  it('assertSlotCapacity pasa professionalId al lock SQL', async () => {
    query.mockResolvedValue({ rows: [] });
    await (
      service as unknown as {
        assertSlotCapacity: (...args: unknown[]) => Promise<void>;
      }
    ).assertSlotCapacity(
      query,
      'biz',
      new Date('2026-09-14T15:00:00.000Z'),
      new Date('2026-09-14T15:30:00.000Z'),
      1,
      null,
      'pro-1',
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('professional_id'),
      expect.arrayContaining(['biz', expect.any(String), expect.any(String), null, 'pro-1']),
    );
  });

  it('assertSlotCapacity lanza si el cupo está lleno', async () => {
    query.mockResolvedValue({ rows: [{ id: 'a1' }] });
    await expect(
      (
        service as unknown as {
          assertSlotCapacity: (...args: unknown[]) => Promise<void>;
        }
      ).assertSlotCapacity(
        query,
        'biz',
        new Date('2026-09-14T15:00:00.000Z'),
        new Date('2026-09-14T15:30:00.000Z'),
        1,
        null,
        'pro-1',
      ),
    ).rejects.toBeInstanceOf(HorarioNoDisponibleException);
  });

  it('assertStartsInOpenWindow rechaza hora fuera de ventana', async () => {
    const spy = vi
      .spyOn(service, 'getPortalSlots')
      .mockResolvedValue({ slots: [] });
    // bypass requireBusinessBySlug via mock on private through getPortalSlots only —
    // assertStartsInOpenWindow also calls requireBusinessBySlug first.
    query.mockResolvedValue({
      rows: [
        {
          id: 'biz',
          name: 'Demo',
          slug: 'demo',
          timezone: 'America/Santiago',
          bookingEnabled: true,
          maxBookingsPerSlot: 1,
        },
      ],
    });

    await expect(
      (
        service as unknown as {
          assertStartsInOpenWindow: (input: {
            businessSlug: string;
            startsAt: Date;
          }) => Promise<void>;
        }
      ).assertStartsInOpenWindow({
        businessSlug: 'demo',
        startsAt: new Date('2026-09-14T03:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(HorarioNoDisponibleException);

    expect(spy).toHaveBeenCalled();
  });
});
