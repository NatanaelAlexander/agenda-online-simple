import { apiFetch, apiFetchDetalle } from "@/lib/api/client";
import {
  resolveThemePresetId,
  themeCssVarEntries,
  themeToBrandingColors,
  type ThemePresetId,
} from "@/lib/branding/theme-presets";

export interface AppBranding {
  id: number;
  themeId: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  bookingHomeLayout: string;
  updatedAt: string;
}

export const DEFAULT_APP_BRANDING: AppBranding = {
  id: 1,
  themeId: "default",
  ...themeToBrandingColors("default"),
  bookingHomeLayout: "classic",
  updatedAt: new Date(0).toISOString(),
};

/** CSS variables from the selected theme preset (light). */
export function brandingCssVars(
  branding: Pick<AppBranding, "themeId">,
): Record<string, string> {
  return themeCssVarEntries(resolveThemePresetId(branding.themeId));
}

export function brandingFromTheme(
  themeId: ThemePresetId,
  current: AppBranding,
): AppBranding {
  return {
    ...current,
    themeId,
    ...themeToBrandingColors(themeId),
  };
}

export async function portalGetBranding(): Promise<AppBranding> {
  return apiFetch<AppBranding>("/portal/system/branding");
}

export async function getInternalBranding(): Promise<AppBranding> {
  return apiFetchDetalle<AppBranding>("/internal/system/branding", {}, true);
}

export async function updateBranding(
  input: Partial<
    Pick<
      AppBranding,
      | "themeId"
      | "primaryColor"
      | "accentColor"
      | "backgroundColor"
      | "foregroundColor"
      | "bookingHomeLayout"
    >
  >,
): Promise<AppBranding> {
  return apiFetch<AppBranding>(
    "/internal/system/branding/update",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function resetBranding(): Promise<AppBranding> {
  return apiFetchDetalle<AppBranding>(
    "/internal/system/branding/reset",
    {},
    true,
  );
}
