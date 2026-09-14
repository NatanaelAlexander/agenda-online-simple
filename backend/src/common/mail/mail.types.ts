export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
}

export interface SendMailResult {
  id: string | null;
  skipped: boolean;
}
