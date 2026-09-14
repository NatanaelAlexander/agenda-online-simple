/** Tipos del motor de disponibilidad (sin BD). */

export interface ScheduleWindow {
  /** 0 = domingo … 6 = sábado (igual JS Date#getDay). */
  weekday: number;
  /** HH:MM o HH:MM:SS */
  startTime: string;
  endTime: string;
}

export interface ScheduleExceptionInput {
  /** YYYY-MM-DD */
  exceptionDate: string;
  isClosed: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export interface BusyInterval {
  startsAt: Date | string;
  endsAt: Date | string;
}

export interface ServiceTiming {
  durationMinutes: number;
  prepMinutes: number;
  bufferMinutes: number;
}

export interface ComputeSlotsInput extends ServiceTiming {
  schedules: ScheduleWindow[];
  exceptions: ScheduleExceptionInput[];
  /** Alias de `existingAppointments` (contrato portal). */
  appointments?: BusyInterval[];
  existingAppointments?: BusyInterval[];
  /** YYYY-MM-DD en la timezone dada */
  date: string;
  timezone: string;
  /** Paso entre candidatos; default 15 */
  slotStepMinutes?: number;
  /**
   * Máximo de citas solapadas permitidas en el mismo horario (default 1).
   * Ej. 2 = hasta dos clientes a la misma hora.
   */
  maxConcurrent?: number;
}
