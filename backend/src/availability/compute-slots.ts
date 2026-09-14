import type {
  BusyInterval,
  ComputeSlotsInput,
  ScheduleExceptionInput,
  ScheduleWindow,
} from './types/availability.types.js';

const DEFAULT_SLOT_STEP_MINUTES = 15;

export interface SlotOccupancy {
  /** ISO UTC del inicio del turno */
  startsAt: string;
  /** Citas pending/confirmed/attended que ocupan el turno */
  booked: number;
  /** Máximo de clientes por horario */
  capacity: number;
}

/**
 * Motor puro de slots: horarios − excepciones − citas − duración/prep/buffer.
 * Devuelve ISO strings (UTC) de inicios aún disponibles.
 */
export function computeSlots(input: ComputeSlotsInput): string[] {
  return computeSlotOccupancy(input)
    .filter((s) => s.booked < s.capacity)
    .map((s) => s.startsAt);
}

/**
 * Todos los turnos del día con ocupación (incluye llenos).
 * Canceladas no cuentan (no vienen en busy).
 */
export function computeSlotOccupancy(input: ComputeSlotsInput): SlotOccupancy[] {
  const step = Math.max(1, input.slotStepMinutes ?? DEFAULT_SLOT_STEP_MINUTES);
  const duration = Math.max(1, input.durationMinutes);
  const prep = Math.max(0, input.prepMinutes);
  const buffer = Math.max(0, input.bufferMinutes);

  const windows = resolveWindowsForDate(
    input.date,
    input.timezone,
    input.schedules,
    input.exceptions,
  );
  if (windows.length === 0) {
    return [];
  }

  const busySource =
    input.appointments ?? input.existingAppointments ?? [];
  const busy = busySource.map((interval) =>
    expandBusyInterval(normalizeInterval(interval), prep, buffer),
  );
  const capacity = Math.max(1, input.maxConcurrent ?? 1);
  const slots: SlotOccupancy[] = [];

  for (const window of windows) {
    const windowStart = zonedLocalToUtc(
      input.date,
      window.startTime,
      input.timezone,
    );
    const windowEnd = zonedLocalToUtc(input.date, window.endTime, input.timezone);

    for (
      let cursor = windowStart.getTime();
      cursor + duration * 60_000 <= windowEnd.getTime();
      cursor += step * 60_000
    ) {
      const startMs = cursor;
      const endMs = startMs + duration * 60_000;
      const blockedStart = startMs - prep * 60_000;
      const blockedEnd = endMs + buffer * 60_000;

      const booked = busy.filter(
        (b) =>
          blockedStart < b.endsAt.getTime() &&
          blockedEnd > b.startsAt.getTime(),
      ).length;

      slots.push({
        startsAt: new Date(startMs).toISOString(),
        booked,
        capacity,
      });
    }
  }

  return slots;
}

function resolveWindowsForDate(
  date: string,
  timezone: string,
  schedules: ScheduleWindow[],
  exceptions: ScheduleExceptionInput[],
): Array<{ startTime: string; endTime: string }> {
  const dayException = exceptions.find((e) => e.exceptionDate === date);
  if (dayException) {
    if (dayException.isClosed) {
      return [];
    }
    if (dayException.startTime && dayException.endTime) {
      return [
        {
          startTime: normalizeTime(dayException.startTime),
          endTime: normalizeTime(dayException.endTime),
        },
      ];
    }
    return [];
  }

  const weekday = weekdayInTimeZone(date, timezone);
  return schedules
    .filter((s) => s.weekday === weekday)
    .map((s) => ({
      startTime: normalizeTime(s.startTime),
      endTime: normalizeTime(s.endTime),
    }))
    .filter((w) => parseTimeToMinutes(w.endTime) > parseTimeToMinutes(w.startTime));
}

function normalizeInterval(interval: BusyInterval): {
  startsAt: Date;
  endsAt: Date;
} {
  return {
    startsAt: new Date(interval.startsAt),
    endsAt: new Date(interval.endsAt),
  };
}

function expandBusyInterval(
  interval: { startsAt: Date; endsAt: Date },
  prepMinutes: number,
  bufferMinutes: number,
): { startsAt: Date; endsAt: Date } {
  return {
    startsAt: new Date(interval.startsAt.getTime() - prepMinutes * 60_000),
    endsAt: new Date(interval.endsAt.getTime() + bufferMinutes * 60_000),
  };
}

function normalizeTime(value: string): string {
  const parts = value.split(':').map((p) => p.trim());
  const hh = (parts[0] ?? '00').padStart(2, '0');
  const mm = (parts[1] ?? '00').padStart(2, '0');
  const ss = (parts[2] ?? '00').padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function parseTimeToMinutes(value: string): number {
  const [hh, mm] = normalizeTime(value).split(':').map(Number);
  return hh * 60 + mm;
}

/** Weekday 0=Sunday … 6=Saturday in the given IANA timezone for YYYY-MM-DD. */
export function weekdayInTimeZone(date: string, timeZone: string): number {
  // Noon avoids DST edge ambiguity for the calendar day.
  const probe = zonedLocalToUtc(date, '12:00:00', timeZone);
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(probe);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekdayName] ?? probe.getUTCDay();
}

/**
 * Interpreta fecha+hora civil en `timeZone` y devuelve el instante UTC.
 */
export function zonedLocalToUtc(
  ymd: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  const [hour, minute, second] = normalizeTime(time).split(':').map(Number);

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let date = new Date(utcGuess);
  const offset = getTimeZoneOffsetMs(date, timeZone);
  date = new Date(utcGuess - offset);

  const offset2 = getTimeZoneOffsetMs(date, timeZone);
  if (offset2 !== offset) {
    date = new Date(utcGuess - offset2);
  }
  return date;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}
