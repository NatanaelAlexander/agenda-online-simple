import { Injectable } from '@nestjs/common';
import {
  computeSlots,
  computeSlotOccupancy,
  type SlotOccupancy,
} from './compute-slots.js';
import type { ComputeSlotsInput } from './types/availability.types.js';

@Injectable()
export class AvailabilityService {
  /**
   * Calcula inicios ISO disponibles para un día (motor puro, sin I/O).
   */
  computeSlots(input: ComputeSlotsInput): string[] {
    return computeSlots(input);
  }

  /** Todos los turnos del día con cupos ocupados / capacidad. */
  computeSlotOccupancy(input: ComputeSlotsInput): SlotOccupancy[] {
    return computeSlotOccupancy(input);
  }
}
