/**
 * URL pública de reserva (la que va en el QR).
 * Apunta al index del sitio, donde vive la agenda pública.
 */
export function publicBookingUrl(_slug?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  const origin =
    fromEnv ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");
  return `${origin}/`;
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
