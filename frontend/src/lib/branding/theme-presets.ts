/** Presets light (tweakcn + default del sistema). */

export type ThemePresetId =
  | "default"
  | "amber-minimal"
  | "caffeine"
  | "vercel";

export type ThemeCssVars = Record<string, string>;

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  description: string;
  /** CSS vars for :root (light only). */
  cssVars: ThemeCssVars;
};

export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  "default": {
    id: "default",
    label: "Default",
    description: "El tema actual del sistema (teal / crema).",
    cssVars: {
      "background": "oklch(0.985 0.012 90)",
      "foreground": "oklch(0.28 0.045 195)",
      "card": "oklch(0.995 0.008 92)",
      "card-foreground": "oklch(0.28 0.045 195)",
      "popover": "oklch(0.995 0.008 92)",
      "popover-foreground": "oklch(0.28 0.045 195)",
      "primary": "oklch(0.48 0.1 175)",
      "primary-foreground": "oklch(0.99 0.01 90)",
      "secondary": "oklch(0.96 0.018 88)",
      "secondary-foreground": "oklch(0.32 0.05 195)",
      "muted": "oklch(0.96 0.014 90)",
      "muted-foreground": "oklch(0.48 0.04 195)",
      "accent": "oklch(0.93 0.03 175)",
      "accent-foreground": "oklch(0.32 0.06 175)",
      "destructive": "oklch(0.55 0.2 25)",
      "destructive-foreground": "oklch(0.99 0.01 90)",
      "border": "oklch(0.9 0.02 90)",
      "input": "oklch(0.92 0.02 90)",
      "ring": "oklch(0.52 0.09 175)",
      "chart-1": "oklch(0.52 0.1 175)",
      "chart-2": "oklch(0.58 0.08 200)",
      "chart-3": "oklch(0.45 0.07 165)",
      "chart-4": "oklch(0.65 0.06 190)",
      "chart-5": "oklch(0.38 0.05 210)",
      "radius": "0.625rem",
      "sidebar": "oklch(0.978 0.014 92)",
      "sidebar-foreground": "oklch(0.28 0.045 195)",
      "sidebar-primary": "oklch(0.48 0.1 175)",
      "sidebar-primary-foreground": "oklch(0.99 0.01 90)",
      "sidebar-accent": "oklch(0.94 0.025 175)",
      "sidebar-accent-foreground": "oklch(0.28 0.05 195)",
      "sidebar-border": "oklch(0.9 0.02 90)",
      "sidebar-ring": "oklch(0.52 0.09 175)",
    },
  },
  "amber-minimal": {
    id: "amber-minimal",
    label: "Amber Minimal",
    description: "Ámbar cálido, minimalista.",
    cssVars: {
      "background": "oklch(1.0000 0 0)",
      "foreground": "oklch(0.2686 0 0)",
      "card": "oklch(1.0000 0 0)",
      "card-foreground": "oklch(0.2686 0 0)",
      "popover": "oklch(1.0000 0 0)",
      "popover-foreground": "oklch(0.2686 0 0)",
      "primary": "oklch(0.7686 0.1647 70.0804)",
      "primary-foreground": "oklch(0 0 0)",
      "secondary": "oklch(0.9670 0.0029 264.5419)",
      "secondary-foreground": "oklch(0.4461 0.0263 256.8018)",
      "muted": "oklch(0.9846 0.0017 247.8389)",
      "muted-foreground": "oklch(0.5510 0.0234 264.3637)",
      "accent": "oklch(0.9869 0.0214 95.2774)",
      "accent-foreground": "oklch(0.4732 0.1247 46.2007)",
      "destructive": "oklch(0.6368 0.2078 25.3313)",
      "destructive-foreground": "oklch(1.0000 0 0)",
      "border": "oklch(0.9276 0.0058 264.5313)",
      "input": "oklch(0.9276 0.0058 264.5313)",
      "ring": "oklch(0.7686 0.1647 70.0804)",
      "chart-1": "oklch(0.7686 0.1647 70.0804)",
      "chart-2": "oklch(0.6658 0.1574 58.3183)",
      "chart-3": "oklch(0.5553 0.1455 48.9975)",
      "chart-4": "oklch(0.4732 0.1247 46.2007)",
      "chart-5": "oklch(0.4137 0.1054 45.9038)",
      "radius": "0.375rem",
      "sidebar": "oklch(0.9846 0.0017 247.8389)",
      "sidebar-foreground": "oklch(0.2686 0 0)",
      "sidebar-primary": "oklch(0.7686 0.1647 70.0804)",
      "sidebar-primary-foreground": "oklch(1.0000 0 0)",
      "sidebar-accent": "oklch(0.9869 0.0214 95.2774)",
      "sidebar-accent-foreground": "oklch(0.4732 0.1247 46.2007)",
      "sidebar-border": "oklch(0.9276 0.0058 264.5313)",
      "sidebar-ring": "oklch(0.7686 0.1647 70.0804)",
    },
  },
  "caffeine": {
    id: "caffeine",
    label: "Caffeine",
    description: "Tonos café y neutros.",
    cssVars: {
      "background": "oklch(0.9821 0 0)",
      "foreground": "oklch(0.2435 0 0)",
      "card": "oklch(0.9911 0 0)",
      "card-foreground": "oklch(0.2435 0 0)",
      "popover": "oklch(0.9911 0 0)",
      "popover-foreground": "oklch(0.2435 0 0)",
      "primary": "oklch(0.4341 0.0392 41.9938)",
      "primary-foreground": "oklch(1.0000 0 0)",
      "secondary": "oklch(0.9200 0.0651 74.3695)",
      "secondary-foreground": "oklch(0.3499 0.0685 40.8288)",
      "muted": "oklch(0.9521 0 0)",
      "muted-foreground": "oklch(0.5032 0 0)",
      "accent": "oklch(0.9310 0 0)",
      "accent-foreground": "oklch(0.2435 0 0)",
      "destructive": "oklch(0.6271 0.1936 33.3390)",
      "destructive-foreground": "oklch(1.0000 0 0)",
      "border": "oklch(0.8822 0 0)",
      "input": "oklch(0.8822 0 0)",
      "ring": "oklch(0.4341 0.0392 41.9938)",
      "chart-1": "oklch(0.4341 0.0392 41.9938)",
      "chart-2": "oklch(0.9200 0.0651 74.3695)",
      "chart-3": "oklch(0.9310 0 0)",
      "chart-4": "oklch(0.9367 0.0523 75.5009)",
      "chart-5": "oklch(0.4338 0.0437 41.6746)",
      "radius": "0.5rem",
      "sidebar": "oklch(0.9881 0 0)",
      "sidebar-foreground": "oklch(0.2645 0 0)",
      "sidebar-primary": "oklch(0.3250 0 0)",
      "sidebar-primary-foreground": "oklch(0.9881 0 0)",
      "sidebar-accent": "oklch(0.9761 0 0)",
      "sidebar-accent-foreground": "oklch(0.3250 0 0)",
      "sidebar-border": "oklch(0.9401 0 0)",
      "sidebar-ring": "oklch(0.7731 0 0)",
    },
  },
  vercel: {
    id: "vercel",
    label: "Vercel",
    description: "Negro y blanco, estilo Vercel (tweakcn).",
    cssVars: {
      background: "oklch(0.9900 0 0)",
      foreground: "oklch(0 0 0)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0 0 0)",
      popover: "oklch(0.9900 0 0)",
      "popover-foreground": "oklch(0 0 0)",
      primary: "oklch(0 0 0)",
      "primary-foreground": "oklch(1 0 0)",
      secondary: "oklch(0.9400 0 0)",
      "secondary-foreground": "oklch(0 0 0)",
      muted: "oklch(0.9700 0 0)",
      "muted-foreground": "oklch(0.4400 0 0)",
      accent: "oklch(0.9400 0 0)",
      "accent-foreground": "oklch(0 0 0)",
      destructive: "oklch(0.6300 0.1900 23.0300)",
      "destructive-foreground": "oklch(1 0 0)",
      border: "oklch(0.9200 0 0)",
      input: "oklch(0.9400 0 0)",
      ring: "oklch(0 0 0)",
      "chart-1": "oklch(0.8100 0.1700 75.3500)",
      "chart-2": "oklch(0.5500 0.2200 264.5300)",
      "chart-3": "oklch(0.7200 0 0)",
      "chart-4": "oklch(0.9200 0 0)",
      "chart-5": "oklch(0.5600 0 0)",
      radius: "0.5rem",
      sidebar: "oklch(0.9900 0 0)",
      "sidebar-foreground": "oklch(0 0 0)",
      "sidebar-primary": "oklch(0 0 0)",
      "sidebar-primary-foreground": "oklch(1 0 0)",
      "sidebar-accent": "oklch(0.9400 0 0)",
      "sidebar-accent-foreground": "oklch(0 0 0)",
      "sidebar-border": "oklch(0.9400 0 0)",
      "sidebar-ring": "oklch(0 0 0)",
    },
  },
};

export const THEME_PRESET_IDS = Object.keys(THEME_PRESETS) as ThemePresetId[];

export function resolveThemePresetId(id: string | null | undefined): ThemePresetId {
  if (id && id in THEME_PRESETS) return id as ThemePresetId;
  return "default";
}

export function themeToBrandingColors(id: ThemePresetId) {
  const v = THEME_PRESETS[id].cssVars;
  return {
    primaryColor: v.primary,
    accentColor: v.accent,
    backgroundColor: v.background,
    foregroundColor: v.foreground,
  };
}

/** Map for documentElement / preview scope. */
export function themeCssVarEntries(id: ThemePresetId): Record<string, string> {
  const vars = THEME_PRESETS[resolveThemePresetId(id)].cssVars;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    out[`--${key}`] = value;
  }
  return out;
}

