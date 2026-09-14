import type { ComponentType } from "react";
import { CompactBookingHome } from "./compact-booking-home";
import { ClassicBookingHome } from "./classic-booking-home";
import { FullBookingHome } from "./full-booking-home";

export const BOOKING_HOME_LAYOUTS = {
  classic: {
    id: "classic",
    label: "Clásico",
    description: "Marca arriba, calendario a la derecha (look actual).",
    component: ClassicBookingHome,
  },
  full: {
    id: "full",
    label: "Full",
    description:
      "Servicio y profesional arriba; calendario a todo el ancho, sin scroll de página.",
    component: FullBookingHome,
  },
  compact: {
    id: "compact",
    label: "Compacto",
    description: "Más denso, ideal para pantallas pequeñas.",
    component: CompactBookingHome,
  },
} as const;

export type BookingHomeLayoutId = keyof typeof BOOKING_HOME_LAYOUTS;

export function resolveBookingHomeLayout(
  id: string | null | undefined,
): BookingHomeLayoutId {
  // Compat: "split" era el layout anterior → ahora "full"
  if (id === "split") return "full";
  if (id && id in BOOKING_HOME_LAYOUTS) {
    return id as BookingHomeLayoutId;
  }
  return "classic";
}

export function getBookingHomeComponent(
  id: string | null | undefined,
): ComponentType<{ slug: string; embedded?: boolean }> {
  const key = resolveBookingHomeLayout(id);
  return BOOKING_HOME_LAYOUTS[key].component;
}
