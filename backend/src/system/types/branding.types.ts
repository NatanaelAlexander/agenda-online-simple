export interface AppBranding {
  id: number;
  themeId: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  bookingHomeLayout: string;
  updatedAt: Date;
}

export interface UpdateAppBrandingInput {
  themeId?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  bookingHomeLayout?: string;
}
