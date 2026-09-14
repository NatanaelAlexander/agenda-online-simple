import { computeSlots, computeSlotOccupancy } from '../../src/availability/compute-slots.js';

/** Lunes 2026-09-14 en UTC. */
const MONDAY = '2026-09-14';

describe('computeSlots', () => {
  it('genera slots básicos del día según horario y duración', () => {
    const slots = computeSlots({
      schedules: [{ weekday: 1, startTime: '09:00', endTime: '12:00' }],
      exceptions: [],
      appointments: [],
      durationMinutes: 60,
      prepMinutes: 0,
      bufferMinutes: 0,
      date: MONDAY,
      timezone: 'UTC',
      slotStepMinutes: 60,
    });

    expect(slots).toEqual([
      '2026-09-14T09:00:00.000Z',
      '2026-09-14T10:00:00.000Z',
      '2026-09-14T11:00:00.000Z',
    ]);
  });

  it('devuelve vacío si la excepción cierra el día', () => {
    const slots = computeSlots({
      schedules: [{ weekday: 1, startTime: '09:00', endTime: '18:00' }],
      exceptions: [
        {
          exceptionDate: MONDAY,
          isClosed: true,
        },
      ],
      appointments: [],
      durationMinutes: 30,
      prepMinutes: 0,
      bufferMinutes: 0,
      date: MONDAY,
      timezone: 'UTC',
      slotStepMinutes: 30,
    });

    expect(slots).toEqual([]);
  });

  it('excluye solape con cita existente', () => {
    const slots = computeSlots({
      schedules: [{ weekday: 1, startTime: '09:00', endTime: '12:00' }],
      exceptions: [],
      appointments: [
        {
          startsAt: '2026-09-14T10:00:00.000Z',
          endsAt: '2026-09-14T11:00:00.000Z',
        },
      ],
      durationMinutes: 60,
      prepMinutes: 0,
      bufferMinutes: 0,
      date: MONDAY,
      timezone: 'UTC',
      slotStepMinutes: 60,
    });

    expect(slots).toEqual([
      '2026-09-14T09:00:00.000Z',
      '2026-09-14T11:00:00.000Z',
    ]);
  });

  it('aplica prep/buffer en candidato y en citas ocupadas', () => {
    const slots = computeSlots({
      schedules: [{ weekday: 1, startTime: '09:00', endTime: '12:00' }],
      exceptions: [],
      appointments: [
        {
          startsAt: '2026-09-14T10:00:00.000Z',
          endsAt: '2026-09-14T11:00:00.000Z',
        },
      ],
      durationMinutes: 60,
      prepMinutes: 0,
      bufferMinutes: 15,
      date: MONDAY,
      timezone: 'UTC',
      slotStepMinutes: 60,
    });

    // 09:00 choca por buffer del candidato; 11:00 choca con cita extendida hasta 11:15
    expect(slots).toEqual([]);
  });

  it('permite varios clientes a la misma hora con maxConcurrent', () => {
    const slots = computeSlots({
      schedules: [{ weekday: 1, startTime: '09:00', endTime: '11:00' }],
      exceptions: [],
      appointments: [
        {
          startsAt: '2026-09-14T09:00:00.000Z',
          endsAt: '2026-09-14T10:00:00.000Z',
        },
      ],
      durationMinutes: 60,
      prepMinutes: 0,
      bufferMinutes: 0,
      date: MONDAY,
      timezone: 'UTC',
      slotStepMinutes: 60,
      maxConcurrent: 2,
    });

    expect(slots).toContain('2026-09-14T09:00:00.000Z');
    expect(slots).toContain('2026-09-14T10:00:00.000Z');
  });
});

describe('computeSlotOccupancy', () => {
  it('incluye turnos llenos con booked/capacity (sin nombres)', () => {
    const occupancy = computeSlotOccupancy({
      schedules: [{ weekday: 1, startTime: '09:00', endTime: '11:00' }],
      exceptions: [],
      appointments: [
        {
          startsAt: '2026-09-14T09:00:00.000Z',
          endsAt: '2026-09-14T10:00:00.000Z',
        },
        {
          startsAt: '2026-09-14T09:00:00.000Z',
          endsAt: '2026-09-14T10:00:00.000Z',
        },
      ],
      durationMinutes: 60,
      prepMinutes: 0,
      bufferMinutes: 0,
      date: MONDAY,
      timezone: 'UTC',
      slotStepMinutes: 60,
      maxConcurrent: 2,
    });

    expect(occupancy).toEqual([
      {
        startsAt: '2026-09-14T09:00:00.000Z',
        booked: 2,
        capacity: 2,
      },
      {
        startsAt: '2026-09-14T10:00:00.000Z',
        booked: 0,
        capacity: 2,
      },
    ]);
  });

  it('cuenta un cupo ocupado y deja el resto disponible', () => {
    const input = {
      schedules: [{ weekday: 1, startTime: '09:00', endTime: '10:00' }],
      exceptions: [],
      appointments: [
        {
          startsAt: '2026-09-14T09:00:00.000Z',
          endsAt: '2026-09-14T10:00:00.000Z',
        },
      ],
      durationMinutes: 60,
      prepMinutes: 0,
      bufferMinutes: 0,
      date: MONDAY,
      timezone: 'UTC',
      slotStepMinutes: 60,
      maxConcurrent: 2,
    };

    expect(computeSlotOccupancy(input)[0]).toEqual({
      startsAt: '2026-09-14T09:00:00.000Z',
      booked: 1,
      capacity: 2,
    });
    expect(computeSlots(input)).toContain('2026-09-14T09:00:00.000Z');
  });
});
