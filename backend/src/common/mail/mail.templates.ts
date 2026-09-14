/** Templates HTML inline (sin react-email). */

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;padding:28px;color:#18181b;">
        <tr><td>
          <h1 style="margin:0 0 12px;font-size:22px;">${title}</h1>
          ${bodyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmailHtml(code: string): string {
  return shell(
    'Recuperar contraseña',
    `<p>Usa este código para restablecer tu contraseña. Expira en <strong>15 minutos</strong>.</p>
     <p style="font-size:28px;letter-spacing:6px;font-weight:700;text-align:center;margin:24px 0;">${code}</p>
     <p style="color:#71717a;font-size:13px;">Si no pediste esto, ignora el correo.</p>`,
  );
}

export function appointmentConfirmedEmailHtml(params: {
  clientName: string;
  businessName: string;
  serviceName: string;
  professionalName: string;
  startsAtLabel: string;
  cancelUrl?: string;
}): string {
  const cancel = params.cancelUrl
    ? `<p><a href="${params.cancelUrl}">Cancelar o reprogramar</a></p>`
    : '';
  return shell(
    'Hora confirmada',
    `<p>Hola ${params.clientName},</p>
     <p>Tu cita en <strong>${params.businessName}</strong> quedó agendada.</p>
     <ul>
       <li><strong>Servicio:</strong> ${params.serviceName}</li>
       <li><strong>Con:</strong> ${params.professionalName}</li>
       <li><strong>Cuándo:</strong> ${params.startsAtLabel}</li>
     </ul>
     ${cancel}`,
  );
}

export function appointmentCancelledEmailHtml(params: {
  clientName: string;
  businessName: string;
  serviceName: string;
  startsAtLabel: string;
}): string {
  return shell(
    'Cita cancelada',
    `<p>Hola ${params.clientName},</p>
     <p>Se canceló tu cita en <strong>${params.businessName}</strong>.</p>
     <ul>
       <li><strong>Servicio:</strong> ${params.serviceName}</li>
       <li><strong>Cuándo era:</strong> ${params.startsAtLabel}</li>
     </ul>`,
  );
}

export function appointmentRescheduledEmailHtml(params: {
  clientName: string;
  businessName: string;
  serviceName: string;
  startsAtLabel: string;
  cancelUrl?: string;
}): string {
  const cancel = params.cancelUrl
    ? `<p><a href="${params.cancelUrl}">Cancelar</a></p>`
    : '';
  return shell(
    'Cita reprogramada',
    `<p>Hola ${params.clientName},</p>
     <p>Tu cita en <strong>${params.businessName}</strong> cambió de horario.</p>
     <ul>
       <li><strong>Servicio:</strong> ${params.serviceName}</li>
       <li><strong>Nuevo horario:</strong> ${params.startsAtLabel}</li>
     </ul>
     ${cancel}`,
  );
}

export function appointmentReminderEmailHtml(params: {
  clientName: string;
  businessName: string;
  serviceName: string;
  professionalName: string;
  startsAtLabel: string;
  cancelUrl?: string;
}): string {
  const cancel = params.cancelUrl
    ? `<p><a href="${params.cancelUrl}">Cancelar o reprogramar</a></p>`
    : '';
  return shell(
    'Recordatorio de cita',
    `<p>Hola ${params.clientName},</p>
     <p>Te recordamos tu cita mañana en <strong>${params.businessName}</strong>.</p>
     <ul>
       <li><strong>Servicio:</strong> ${params.serviceName}</li>
       <li><strong>Con:</strong> ${params.professionalName}</li>
       <li><strong>Cuándo:</strong> ${params.startsAtLabel}</li>
     </ul>
     ${cancel}`,
  );
}
