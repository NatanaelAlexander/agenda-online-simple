export interface MailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  appPublicUrl: string;
}

export function loadMailConfig(): MailConfig {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim() ?? '',
    fromEmail: process.env.RESEND_FROM_EMAIL?.trim() ?? '',
    fromName:
      process.env.RESEND_FROM_NAME?.trim() || 'Agenda online simple',
    appPublicUrl:
      process.env.APP_PUBLIC_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      'http://localhost:3001',
  };
}

export function isMailConfigured(config: MailConfig): boolean {
  const key = config.apiKey.trim();
  const from = config.fromEmail.trim();
  if (!key || !from) return false;
  // Placeholders de .env.example
  if (key.includes('xxxxxxxx') || key === 're_xxxxxxxx') return false;
  return true;
}
