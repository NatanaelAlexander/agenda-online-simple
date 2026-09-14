import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { QueryResult, QueryResultRow } from 'pg';
import { BookingSessionService } from '../auth/booking/booking-session.service.js';
import { AvailabilityService } from '../availability/availability.service.js';
import { zonedLocalToUtc } from '../availability/compute-slots.js';
import { DatabaseService } from '../common/database/database.service.js';
import {
  appointmentCancelledEmailHtml,
  appointmentConfirmedEmailHtml,
  appointmentReminderEmailHtml,
  appointmentRescheduledEmailHtml,
} from '../common/mail/mail.templates.js';
import { MailService } from '../common/mail/mail.service.js';
import {
  BookingTokenRequeridoException,
  CitaNoEncontradaException,
  CitaYaCanceladaException,
  ClienteNoEncontradoException,
  EstadoCitaNoEncontradoException,
  HorarioNoDisponibleException,
  NegocioNoEncontradoException,
  ProfesionalNoEncontradoException,
  ProfesionalServicioInvalidoException,
  ReservasDeshabilitadasException,
  ServicioNoEncontradoException,
} from './exceptions/appointments.exceptions.js';
import {
  SQL_COUNT_APPOINTMENTS_BASE,
  SQL_FIND_ALL_APPOINTMENTS_BASE,
  SQL_FIND_APPOINTMENT_BY_CANCEL_TOKEN,
  SQL_FIND_APPOINTMENT_BY_ID,
  SQL_FIND_BUSY_APPOINTMENTS,
  SQL_FIND_BUSINESS_BY_ID,
  SQL_FIND_BUSINESS_BY_SLUG,
  SQL_FIND_CLIENT_BY_ID,
  SQL_FIND_CLIENT_FOR_UPSERT,
  SQL_ASSERT_PROFESSIONAL_SERVICE,
  SQL_FIND_APPOINTMENTS_BY_CANCEL_TOKENS,
  SQL_FIND_EXCEPTIONS,
  SQL_FIND_PROFESSIONAL,
  SQL_FIND_PROFESSIONAL_SCHEDULES,
  SQL_FIND_REMINDER_CANDIDATES,
  SQL_FIND_SCHEDULES,
  SQL_FIND_SERVICE_TIMING,
  SQL_FIND_STATUS_BY_CODE,
  SQL_INSERT_APPOINTMENT,
  SQL_INSERT_CLIENT,
  SQL_LOCK_OVERLAPPING_APPOINTMENTS,
  SQL_MARK_REMINDER_SENT,
  SQL_UPDATE_CLIENT,
  SQL_UPDATE_SCHEDULE,
  SQL_UPDATE_STATUS,
  SQL_UPDATE_STATUS_WITH_CANCELLED_BY,
} from './queries/appointments.queries.js';
import type {
  AppointmentDetail,
  AppointmentFilters,
  BookingCookiePayload,
  ConfirmPortalAppointmentInput,
  ConfirmPortalResult,
  CreateAppointmentInput,
  PaginatedAppointments,
  PortalSlotsInput,
  StaffAppointmentDetail,
} from './types/appointment.types.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

type TxQuery = <R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) => Promise<QueryResult<R>>;

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  bookingEnabled: boolean;
  maxBookingsPerSlot: number;
}

interface ServiceRow {
  id: string;
  businessId: string;
  name: string;
  durationMinutes: number | null;
  prepMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
}

interface ProfessionalRow {
  id: string;
  businessId: string;
  displayName: string;
  isActive: boolean;
}

interface ClientRow {
  id: string;
  businessId: string;
  fullName: string;
  email: string | null;
  googleSub?: string | null;
}

interface StatusRow {
  id: string;
  code: string;
  name: string;
}


function withoutCancelToken(
  appointment: AppointmentDetail,
): StaffAppointmentDetail {
  const { cancelToken: _omit, ...rest } = appointment;
  return rest;
}

function pickDayExceptions<T extends { professionalId?: string | null }>(
  rows: T[],
): T[] {
  const specific = rows.filter((row) => row.professionalId != null);
  return specific.length > 0 ? specific : rows;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly availability: AvailabilityService,
    private readonly bookingSessions: BookingSessionService,
    private readonly mail: MailService,
  ) {}

  async findAll(
    filters: AppointmentFilters = {},
  ): Promise<PaginatedAppointments> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;
    const { where, params } = this.buildFilters(filters);

    const countResult = await this.db.query<{ total: number }>(
      `${SQL_COUNT_APPOINTMENTS_BASE} ${where}`,
      params,
    );
    const total = countResult.rows[0]?.total ?? 0;

    const dataSql = `${SQL_FIND_ALL_APPOINTMENTS_BASE}
      ${where}
      ORDER BY a.starts_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}`;

    const { rows } = await this.db.query<AppointmentDetail>(dataSql, [
      ...params,
      pageSize,
      offset,
    ]);

    return { items: rows.map(withoutCancelToken), total, page, pageSize };
  }

  async findById(id: string): Promise<StaffAppointmentDetail> {
    return withoutCancelToken(await this.loadById(id));
  }

  private async loadById(id: string): Promise<AppointmentDetail> {
    const { rows } = await this.db.query<AppointmentDetail>(
      SQL_FIND_APPOINTMENT_BY_ID,
      [id],
    );
    if (!rows[0]) {
      throw new CitaNoEncontradaException();
    }
    return rows[0];
  }

  async create(input: CreateAppointmentInput): Promise<StaffAppointmentDetail> {
    const business = await this.requireBusinessById(input.businessId);
    const service = await this.requireService(input.serviceId);
    const professional = await this.requireProfessional(input.professionalId);
    await this.assertSameBusiness(business.id, service, professional);
    await this.requireClient(input.clientId, business.id);

    const startsAt = new Date(input.startsAt);
    const endsAt = addMinutes(startsAt, resolveServiceDuration(service.durationMinutes));
    const statusCode = input.statusCode ?? 'confirmed';
    const status = await this.requireStatus(statusCode);
    const maxConcurrent = Math.max(1, business.maxBookingsPerSlot ?? 1);

    await this.assertProfessionalOffersService(professional.id, service.id);
    await this.assertStartsInOpenWindow({
      businessSlug: business.slug,
      serviceId: service.id,
      professionalId: professional.id,
      startsAt,
      requireBookingEnabled: false,
    });

    const id = await this.db.transaction(async (query) => {
      await this.assertSlotCapacity(
        query,
        business.id,
        startsAt,
        endsAt,
        maxConcurrent,
        null,
        professional.id,
      );
      const cancelToken = createCancelToken();
      const { rows } = await query<{ id: string }>(SQL_INSERT_APPOINTMENT, [
        business.id,
        service.id,
        professional.id,
        input.clientId,
        status.id,
        startsAt.toISOString(),
        endsAt.toISOString(),
        cancelToken,
        input.notes ?? null,
        input.bookingSource ?? 'internal',
      ]);
      return rows[0].id;
    });

    return this.findById(id);
  }

  async changeStatus(
    id: string,
    statusCode: string,
  ): Promise<StaffAppointmentDetail> {
    const current = await this.findById(id);
    const status = await this.requireStatus(statusCode);
    const wasOccupying = occupiesSlot(current.statusCode);
    const willOccupy = occupiesSlot(statusCode);

    if (statusCode === 'cancelled') {
      await this.db.query(SQL_UPDATE_STATUS_WITH_CANCELLED_BY, [
        id,
        status.id,
        'staff',
      ]);
    } else if (!wasOccupying && willOccupy) {
      const business = await this.requireBusinessById(current.businessId);
      const maxConcurrent = Math.max(1, business.maxBookingsPerSlot ?? 1);
      await this.db.transaction(async (query) => {
        await this.assertSlotCapacity(
          query,
          current.businessId,
          new Date(current.startsAt),
          new Date(current.endsAt),
          maxConcurrent,
          id,
          current.professionalId,
        );
        await query(SQL_UPDATE_STATUS, [id, status.id]);
      });
    } else {
      await this.db.query(SQL_UPDATE_STATUS, [id, status.id]);
    }

    const updated = await this.findById(id);
    if (
      statusCode === 'confirmed' &&
      current.statusCode !== 'confirmed'
    ) {
      await this.sendConfirmedEmail(updated).catch((error) => {
        this.logger.error(
          `Cita ${id} aceptada pero el email falló`,
          error instanceof Error ? error.message : error,
        );
      });
    }
    return updated;
  }

  async accept(id: string): Promise<StaffAppointmentDetail> {
    const current = await this.findById(id);
    if (current.statusCode === 'confirmed') {
      return current;
    }
    return this.changeStatus(id, 'confirmed');
  }

  async reject(id: string): Promise<StaffAppointmentDetail> {
    const current = await this.findById(id);
    if (current.statusCode === 'cancelled') {
      return current;
    }
    const updated = await this.changeStatus(id, 'cancelled');
    await this.sendCancelledEmail(updated).catch(() => undefined);
    return updated;
  }

  async reschedule(
    id: string,
    startsAtInput: string | Date,
  ): Promise<StaffAppointmentDetail> {
    const current = await this.findById(id);
    if (current.statusCode === 'cancelled') {
      throw new CitaYaCanceladaException();
    }

    const service = current.serviceId
      ? await this.requireService(current.serviceId)
      : null;
    const business = await this.requireBusinessById(current.businessId);
    const startsAt = new Date(startsAtInput);
    const endsAt = addMinutes(
      startsAt,
      resolveServiceDuration(service?.durationMinutes ?? null),
    );

    await this.assertStartsInOpenWindow({
      businessSlug: business.slug,
      serviceId: current.serviceId,
      professionalId: current.professionalId,
      startsAt,
      requireBookingEnabled: false,
    });

    await this.db.transaction(async (query) => {
      await this.assertSlotCapacity(
        query,
        current.businessId,
        startsAt,
        endsAt,
        Math.max(1, business.maxBookingsPerSlot ?? 1),
        current.id,
        current.professionalId,
      );
      await query(SQL_UPDATE_SCHEDULE, [
        current.id,
        startsAt.toISOString(),
        endsAt.toISOString(),
      ]);
    });

    const updated = await this.findById(id);
    await this.sendRescheduledEmail(updated);
    return updated;
  }

  async cancel(id: string): Promise<StaffAppointmentDetail> {
    const current = await this.findById(id);
    if (current.statusCode === 'cancelled') {
      throw new CitaYaCanceladaException();
    }
    const status = await this.requireStatus('cancelled');
    await this.db.query(SQL_UPDATE_STATUS_WITH_CANCELLED_BY, [
      id,
      status.id,
      'staff',
    ]);
    const updated = await this.findById(id);
    await this.sendCancelledEmail(updated);
    return updated;
  }

  async getPortalSlots(
    input: PortalSlotsInput,
    options: { requireBookingEnabled?: boolean } = {},
  ): Promise<{
    slots: Array<{
      startsAt: string;
      booked: number;
      capacity: number;
      remaining: number;
    }>;
  }> {
    const business = await this.requireBusinessBySlug(input.businessSlug, {
      requireBookingEnabled: options.requireBookingEnabled,
    });

    let durationMinutes = 30;
    let prepMinutes = 0;
    let bufferMinutes = 0;

    if (input.serviceId) {
      const service = await this.requireService(input.serviceId);
      if (service.businessId !== business.id) {
        throw new ProfesionalServicioInvalidoException();
      }
      durationMinutes = resolveServiceDuration(service.durationMinutes);
      prepMinutes = service.prepMinutes;
      bufferMinutes = service.bufferMinutes;
    }

    if (input.professionalId) {
      const professional = await this.requireProfessional(input.professionalId);
      if (professional.businessId !== business.id) {
        throw new ProfesionalServicioInvalidoException();
      }
    }

    if (input.professionalId && input.serviceId) {
      await this.assertProfessionalOffersService(
        input.professionalId,
        input.serviceId,
      );
    }

    const dayStart = zonedLocalToUtc(
      input.date,
      '00:00:00',
      business.timezone,
    );
    const dayEnd = zonedLocalToUtc(input.date, '23:59:59', business.timezone);
    const professionalId = input.professionalId ?? null;

    const businessSchedules = await this.db.query<{
      weekday: number;
      startTime: string;
      endTime: string;
    }>(SQL_FIND_SCHEDULES, [business.id]);

    let schedules = businessSchedules.rows;
    if (professionalId) {
      const proSchedules = await this.db.query<{
        weekday: number;
        startTime: string;
        endTime: string;
      }>(SQL_FIND_PROFESSIONAL_SCHEDULES, [professionalId]);
      if (proSchedules.rows.length > 0) {
        schedules = proSchedules.rows;
      }
    }

    const [exceptionsResult, busyResult] = await Promise.all([
      this.db.query<{
        exceptionDate: string;
        isClosed: boolean;
        startTime: string | null;
        endTime: string | null;
        professionalId: string | null;
      }>(SQL_FIND_EXCEPTIONS, [input.date, business.id, professionalId]),
      this.db.query<{ startsAt: Date; endsAt: Date }>(
        SQL_FIND_BUSY_APPOINTMENTS,
        [
          business.id,
          dayStart.toISOString(),
          dayEnd.toISOString(),
          professionalId,
        ],
      ),
    ]);

    const occupancy = this.availability.computeSlotOccupancy({
      schedules,
      exceptions: pickDayExceptions(exceptionsResult.rows),
      existingAppointments: busyResult.rows,
      durationMinutes,
      prepMinutes,
      bufferMinutes,
      date: input.date,
      timezone: business.timezone,
      maxConcurrent: Math.max(1, business.maxBookingsPerSlot ?? 1),
    });

    return {
      slots: occupancy.map((s) => ({
        startsAt: s.startsAt,
        booked: s.booked,
        capacity: s.capacity,
        remaining: Math.max(0, s.capacity - s.booked),
      })),
    };
  }

  async confirmPortal(
    bookingToken: string | undefined,
    input: ConfirmPortalAppointmentInput,
  ): Promise<ConfirmPortalResult> {
    if (!bookingToken?.trim()) {
      throw new BookingTokenRequeridoException();
    }

    const session = await this.bookingSessions.assertValid(bookingToken.trim());
    const business = await this.requireBusinessBySlug(input.businessSlug);

    const service = input.serviceId
      ? await this.requireService(input.serviceId)
      : null;
    const professional = input.professionalId
      ? await this.requireProfessional(input.professionalId)
      : null;

    if (service && service.businessId !== business.id) {
      throw new ProfesionalServicioInvalidoException();
    }
    if (professional && professional.businessId !== business.id) {
      throw new ProfesionalServicioInvalidoException();
    }
    if (professional && service) {
      await this.assertProfessionalOffersService(professional.id, service.id);
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = addMinutes(
      startsAt,
      resolveServiceDuration(service?.durationMinutes ?? null),
    );
    const status = await this.requireStatus('pending');
    const maxConcurrent = Math.max(1, business.maxBookingsPerSlot ?? 1);

    await this.assertStartsInOpenWindow({
      businessSlug: business.slug,
      serviceId: service?.id ?? null,
      professionalId: professional?.id ?? null,
      startsAt,
    });

    const appointmentId = await this.db.transaction(async (query) => {
      await this.assertSlotCapacity(
        query,
        business.id,
        startsAt,
        endsAt,
        maxConcurrent,
        null,
        professional?.id ?? null,
      );
      const client = await this.upsertClient(query, {
        businessId: business.id,
        fullName: session.name,
        email: session.email,
        googleSub: session.googleSub,
      });
      const cancelToken = createCancelToken();
      const { rows } = await query<{ id: string }>(SQL_INSERT_APPOINTMENT, [
        business.id,
        service?.id ?? null,
        professional?.id ?? null,
        client.id,
        status.id,
        startsAt.toISOString(),
        endsAt.toISOString(),
        cancelToken,
        input.notes ?? null,
        'portal',
      ]);
      return rows[0].id;
    });

    await this.bookingSessions.consume(bookingToken.trim());

    const appointment = await this.loadById(appointmentId);

    return {
      appointment: withoutCancelToken(appointment),
      cookiePayload: toCookiePayload(appointment),
    };
  }

  async cancelByToken(cancelToken: string): Promise<AppointmentDetail> {
    const { rows } = await this.db.query<AppointmentDetail>(
      SQL_FIND_APPOINTMENT_BY_CANCEL_TOKEN,
      [cancelToken],
    );
    if (!rows[0]) {
      throw new CitaNoEncontradaException();
    }
    if (rows[0].statusCode === 'cancelled') {
      throw new CitaYaCanceladaException();
    }

    const status = await this.requireStatus('cancelled');
    await this.db.query(SQL_UPDATE_STATUS_WITH_CANCELLED_BY, [
      rows[0].id,
      status.id,
      'client',
    ]);
    const updated = await this.loadById(rows[0].id);
    await this.sendCancelledEmail(updated);
    return updated;
  }

  async getPortalStatus(cancelToken: string): Promise<AppointmentDetail> {
    const { rows } = await this.db.query<AppointmentDetail>(
      SQL_FIND_APPOINTMENT_BY_CANCEL_TOKEN,
      [cancelToken],
    );
    if (!rows[0]) {
      throw new CitaNoEncontradaException();
    }
    return rows[0];
  }

  async sendDueReminders(): Promise<number> {
    const { rows } = await this.db.query<AppointmentDetail>(
      SQL_FIND_REMINDER_CANDIDATES,
    );

    let sent = 0;
    for (const appointment of rows) {
      try {
        await this.sendReminderEmail(appointment);
        await this.db.query(SQL_MARK_REMINDER_SENT, [appointment.id]);
        sent += 1;
      } catch (error) {
        this.logger.error(
          `No se pudo enviar recordatorio de cita ${appointment.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
    return sent;
  }

  private async assertSlotCapacity(
    query: TxQuery,
    businessId: string,
    startsAt: Date,
    endsAt: Date,
    maxConcurrent: number,
    excludeId: string | null,
    professionalId: string | null = null,
  ): Promise<void> {
    const { rows } = await query<{ id: string }>(
      SQL_LOCK_OVERLAPPING_APPOINTMENTS,
      [
        businessId,
        startsAt.toISOString(),
        endsAt.toISOString(),
        excludeId,
        professionalId,
      ],
    );
    if (rows.length >= maxConcurrent) {
      throw new HorarioNoDisponibleException();
    }
  }

  private async assertProfessionalOffersService(
    professionalId: string,
    serviceId: string,
  ): Promise<void> {
    const { rows } = await this.db.query<{ ok: number }>(
      SQL_ASSERT_PROFESSIONAL_SERVICE,
      [professionalId, serviceId],
    );
    if (!rows[0]) {
      throw new ProfesionalServicioInvalidoException();
    }
  }

  private async assertStartsInOpenWindow(input: {
    businessSlug: string;
    serviceId?: string | null;
    professionalId?: string | null;
    startsAt: Date;
    requireBookingEnabled?: boolean;
  }): Promise<void> {
    const business = await this.requireBusinessBySlug(input.businessSlug, {
      requireBookingEnabled: input.requireBookingEnabled ?? true,
    });
    const localDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: business.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(input.startsAt);

    const { slots } = await this.getPortalSlots(
      {
        businessSlug: input.businessSlug,
        serviceId: input.serviceId,
        professionalId: input.professionalId,
        date: localDate,
      },
      { requireBookingEnabled: input.requireBookingEnabled ?? true },
    );

    const target = input.startsAt.getTime();
    const match = slots.find(
      (slot) =>
        new Date(slot.startsAt).getTime() === target && slot.remaining > 0,
    );
    if (!match) {
      throw new HorarioNoDisponibleException();
    }
  }

  async listPortalByCancelTokens(input: {
    cancelTokens: string[];
    businessSlug?: string | null;
  }): Promise<AppointmentDetail[]> {
    const tokens = [
      ...new Set(
        input.cancelTokens
          .map((token) => token.trim())
          .filter((token) => token.length >= 16),
      ),
    ].slice(0, 50);
    if (tokens.length === 0) {
      return [];
    }
    const { rows } = await this.db.query<AppointmentDetail>(
      SQL_FIND_APPOINTMENTS_BY_CANCEL_TOKENS,
      [tokens, input.businessSlug ?? null],
    );
    return rows;
  }

  private async upsertClient(
    query: TxQuery,
    input: {
      businessId: string;
      fullName: string;
      email: string;
      googleSub: string;
    },
  ): Promise<ClientRow> {
    const email = input.email.trim().toLowerCase();
    const googleSub = input.googleSub?.trim() || null;
    const fullName = input.fullName.trim();

    const existing = await query<ClientRow>(SQL_FIND_CLIENT_FOR_UPSERT, [
      input.businessId,
      email,
      googleSub,
    ]);
    if (existing.rows[0]) {
      const updated = await query<ClientRow>(SQL_UPDATE_CLIENT, [
        existing.rows[0].id,
        fullName,
        email,
        googleSub,
      ]);
      return updated.rows[0];
    }

    try {
      const inserted = await query<ClientRow>(SQL_INSERT_CLIENT, [
        input.businessId,
        fullName,
        email,
        googleSub,
      ]);
      return inserted.rows[0];
    } catch (error) {
      // Carrera / cliente ya existía: reutilizar fila
      if (!isUniqueViolation(error)) {
        throw error;
      }
      const again = await query<ClientRow>(SQL_FIND_CLIENT_FOR_UPSERT, [
        input.businessId,
        email,
        googleSub,
      ]);
      if (!again.rows[0]) {
        throw error;
      }
      const updated = await query<ClientRow>(SQL_UPDATE_CLIENT, [
        again.rows[0].id,
        fullName,
        email,
        googleSub,
      ]);
      return updated.rows[0];
    }
  }

  private async requireBusinessById(id: string): Promise<BusinessRow> {
    const { rows } = await this.db.query<BusinessRow>(SQL_FIND_BUSINESS_BY_ID, [
      id,
    ]);
    if (!rows[0]) {
      throw new NegocioNoEncontradoException();
    }
    return rows[0];
  }

  private async requireBusinessBySlug(
    slug: string,
    options: { requireBookingEnabled?: boolean } = {},
  ): Promise<BusinessRow> {
    const { rows } = await this.db.query<BusinessRow>(SQL_FIND_BUSINESS_BY_SLUG, [
      slug,
    ]);
    if (!rows[0]) {
      throw new NegocioNoEncontradoException();
    }
    if (
      (options.requireBookingEnabled ?? true) &&
      !rows[0].bookingEnabled
    ) {
      throw new ReservasDeshabilitadasException();
    }
    return rows[0];
  }

  private async requireService(id: string): Promise<ServiceRow> {
    const { rows } = await this.db.query<ServiceRow>(SQL_FIND_SERVICE_TIMING, [
      id,
    ]);
    if (!rows[0] || !rows[0].isActive) {
      throw new ServicioNoEncontradoException();
    }
    return rows[0];
  }

  private async requireProfessional(id: string): Promise<ProfessionalRow> {
    const { rows } = await this.db.query<ProfessionalRow>(
      SQL_FIND_PROFESSIONAL,
      [id],
    );
    if (!rows[0] || !rows[0].isActive) {
      throw new ProfesionalNoEncontradoException();
    }
    return rows[0];
  }

  private async requireClient(
    id: string,
    businessId: string,
  ): Promise<ClientRow> {
    const { rows } = await this.db.query<ClientRow>(SQL_FIND_CLIENT_BY_ID, [id]);
    if (!rows[0] || rows[0].businessId !== businessId) {
      throw new ClienteNoEncontradoException();
    }
    return rows[0];
  }

  private async requireStatus(code: string): Promise<StatusRow> {
    const { rows } = await this.db.query<StatusRow>(SQL_FIND_STATUS_BY_CODE, [
      code,
    ]);
    if (!rows[0]) {
      throw new EstadoCitaNoEncontradoException(code);
    }
    return rows[0];
  }

  private async assertSameBusiness(
    businessId: string,
    service: ServiceRow,
    professional: ProfessionalRow,
  ): Promise<void> {
    if (
      service.businessId !== businessId ||
      professional.businessId !== businessId
    ) {
      throw new ProfesionalServicioInvalidoException();
    }
  }

  private buildFilters(filters: AppointmentFilters): {
    where: string;
    params: unknown[];
  } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (filters.businessId) {
      conditions.push(`a.business_id = $${index++}`);
      params.push(filters.businessId);
    }
    if (filters.professionalId) {
      conditions.push(`a.professional_id = $${index++}`);
      params.push(filters.professionalId);
    }
    if (filters.serviceId) {
      conditions.push(`a.service_id = $${index++}`);
      params.push(filters.serviceId);
    }
    if (filters.clientId) {
      conditions.push(`a.client_id = $${index++}`);
      params.push(filters.clientId);
    }
    if (filters.statusCode) {
      conditions.push(`st.code = $${index++}`);
      params.push(filters.statusCode);
    }
    if (filters.dateFrom) {
      conditions.push(`a.starts_at >= $${index++}`);
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push(`a.starts_at <= $${index++}`);
      params.push(filters.dateTo);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { where, params };
  }

  private cancelUrl(appointment: AppointmentDetail): string {
    const base = this.mail.getAppPublicUrl().replace(/\/$/, '');
    return `${base}/r/${appointment.businessSlug}?cancel=${appointment.cancelToken}`;
  }

  private formatStartsLabel(appointment: AppointmentDetail | StaffAppointmentDetail): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: appointment.timezone || 'UTC',
    }).format(new Date(appointment.startsAt));
  }

  private displayServiceName(appointment: AppointmentDetail | StaffAppointmentDetail): string {
    return appointment.serviceName?.trim() || 'Por definir';
  }

  private displayProfessionalName(
    appointment: AppointmentDetail | StaffAppointmentDetail,
  ): string {
    return appointment.professionalName?.trim() || 'Por definir';
  }

  private async sendConfirmedEmail(
    appointment: AppointmentDetail | StaffAppointmentDetail,
  ): Promise<void> {
    const full =
      'cancelToken' in appointment && appointment.cancelToken
        ? (appointment as AppointmentDetail)
        : await this.loadById(appointment.id);
    if (!appointment.clientEmail) return;
    await this.mail.send({
      to: appointment.clientEmail,
      subject: `Hora confirmada — ${appointment.businessName}`,
      html: appointmentConfirmedEmailHtml({
        clientName: appointment.clientName,
        businessName: appointment.businessName,
        serviceName: this.displayServiceName(appointment),
        professionalName: this.displayProfessionalName(appointment),
        startsAtLabel: this.formatStartsLabel(full),
        cancelUrl: this.cancelUrl(full),
      }),
    });
  }

  private async sendCancelledEmail(
    appointment: AppointmentDetail | StaffAppointmentDetail,
  ): Promise<void> {
    const full =
      'cancelToken' in appointment && appointment.cancelToken
        ? (appointment as AppointmentDetail)
        : await this.loadById(appointment.id);
    if (!appointment.clientEmail) return;
    await this.mail.send({
      to: appointment.clientEmail,
      subject: `Cita cancelada — ${appointment.businessName}`,
      html: appointmentCancelledEmailHtml({
        clientName: appointment.clientName,
        businessName: appointment.businessName,
        serviceName: this.displayServiceName(appointment),
        startsAtLabel: this.formatStartsLabel(full),
      }),
    });
  }

  private async sendRescheduledEmail(
    appointment: AppointmentDetail | StaffAppointmentDetail,
  ): Promise<void> {
    const full =
      'cancelToken' in appointment && appointment.cancelToken
        ? (appointment as AppointmentDetail)
        : await this.loadById(appointment.id);
    if (!appointment.clientEmail) return;
    await this.mail.send({
      to: appointment.clientEmail,
      subject: `Cita reprogramada — ${appointment.businessName}`,
      html: appointmentRescheduledEmailHtml({
        clientName: appointment.clientName,
        businessName: appointment.businessName,
        serviceName: this.displayServiceName(appointment),
        startsAtLabel: this.formatStartsLabel(full),
        cancelUrl: this.cancelUrl(full),
      }),
    });
  }

  private async sendReminderEmail(
    appointment: AppointmentDetail | StaffAppointmentDetail,
  ): Promise<void> {
    const full =
      'cancelToken' in appointment && appointment.cancelToken
        ? (appointment as AppointmentDetail)
        : await this.loadById(appointment.id);
    if (!appointment.clientEmail) return;
    await this.mail.send({
      to: appointment.clientEmail,
      subject: `Recordatorio — ${appointment.businessName}`,
      html: appointmentReminderEmailHtml({
        clientName: appointment.clientName,
        businessName: appointment.businessName,
        serviceName: this.displayServiceName(appointment),
        professionalName: this.displayProfessionalName(appointment),
        startsAtLabel: this.formatStartsLabel(full),
        cancelUrl: this.cancelUrl(full),
      }),
    });
  }
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Si el servicio no declara duración, usamos 30 min para slots/citas. */
export function resolveServiceDuration(durationMinutes: number | null): number {
  return durationMinutes != null && durationMinutes > 0 ? durationMinutes : 30;
}

function occupiesSlot(statusCode: string): boolean {
  return (
    statusCode === 'pending' ||
    statusCode === 'confirmed' ||
    statusCode === 'attended'
  );
}

function createCancelToken(): string {
  return randomBytes(32).toString('hex');
}

function toCookiePayload(appointment: AppointmentDetail): BookingCookiePayload {
  return {
    email: appointment.clientEmail ?? '',
    name: appointment.clientName,
    appointmentId: appointment.id,
    startsAt: new Date(appointment.startsAt).toISOString(),
    endsAt: new Date(appointment.endsAt).toISOString(),
    serviceName: appointment.serviceName?.trim() || 'Por definir',
    professionalName: appointment.professionalName?.trim() || 'Por definir',
    businessSlug: appointment.businessSlug,
    cancelToken: appointment.cancelToken,
    statusCode: appointment.statusCode,
    cancelledBy: (appointment.cancelledBy as 'client' | 'staff' | null) ?? null,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

/** Extrae Bearer token del header Authorization. */
export function extractBearerToken(
  authorization: string | undefined,
): string | undefined {
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }
  return token;
}
