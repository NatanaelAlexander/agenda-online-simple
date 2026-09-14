import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service.js';
import {
  SQL_GET_APP_BRANDING,
  SQL_UPSERT_APP_BRANDING,
} from './queries/branding.queries.js';
import type {
  AppBranding,
  UpdateAppBrandingInput,
} from './types/branding.types.js';

const DEFAULT_BRANDING: AppBranding = {
  id: 1,
  themeId: 'default',
  primaryColor: 'oklch(0.48 0.1 175)',
  accentColor: 'oklch(0.93 0.03 175)',
  backgroundColor: 'oklch(0.985 0.012 90)',
  foregroundColor: 'oklch(0.28 0.045 195)',
  bookingHomeLayout: 'classic',
  updatedAt: new Date(0),
};

const ALLOWED_LAYOUTS = new Set(['classic', 'full', 'compact']);
const ALLOWED_THEMES = new Set([
  'default',
  'amber-minimal',
  'caffeine',
  'vercel',
]);

function normalizeLayout(layout: string): string {
  if (layout === 'split') return 'full';
  return ALLOWED_LAYOUTS.has(layout) ? layout : 'classic';
}

@Injectable()
export class SystemBrandingService {
  constructor(private readonly db: DatabaseService) {}

  async get(): Promise<AppBranding> {
    const { rows } = await this.db.query<AppBranding>(SQL_GET_APP_BRANDING);
    const row = rows[0];
    if (!row) return { ...DEFAULT_BRANDING, updatedAt: new Date() };
    return {
      ...row,
      themeId: ALLOWED_THEMES.has(row.themeId) ? row.themeId : 'default',
      bookingHomeLayout: normalizeLayout(row.bookingHomeLayout),
    };
  }

  async update(input: UpdateAppBrandingInput): Promise<AppBranding> {
    const current = await this.get();
    const bookingHomeLayout = normalizeLayout(
      input.bookingHomeLayout ?? current.bookingHomeLayout,
    );
    const rawTheme = input.themeId ?? current.themeId;
    const themeId = ALLOWED_THEMES.has(rawTheme) ? rawTheme : 'default';

    const { rows } = await this.db.query<AppBranding>(SQL_UPSERT_APP_BRANDING, [
      themeId,
      input.primaryColor ?? current.primaryColor,
      input.accentColor ?? current.accentColor,
      input.backgroundColor ?? current.backgroundColor,
      input.foregroundColor ?? current.foregroundColor,
      bookingHomeLayout,
    ]);

    return rows[0];
  }

  async reset(): Promise<AppBranding> {
    return this.update({
      themeId: DEFAULT_BRANDING.themeId,
      primaryColor: DEFAULT_BRANDING.primaryColor,
      accentColor: DEFAULT_BRANDING.accentColor,
      backgroundColor: DEFAULT_BRANDING.backgroundColor,
      foregroundColor: DEFAULT_BRANDING.foregroundColor,
      bookingHomeLayout: DEFAULT_BRANDING.bookingHomeLayout,
    });
  }
}
