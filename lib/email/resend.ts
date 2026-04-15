import { Resend } from 'resend';
import { EMAIL_FROM, EMAIL_REPLY_TO, APP_URL, APP_NAME } from '@/lib/config';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      replyTo: replyTo || EMAIL_REPLY_TO,
    });

    if (error) {
      console.error('[Email] Error sending email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Email] Exception sending email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Base email template wrapper
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 700; color: #f0b400; text-decoration: none; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1a1a1a; }
    p { margin: 0 0 16px 0; color: #4a4a4a; }
    .highlight { background: #f8f9fa; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .highlight-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .highlight-row:last-child { border-bottom: none; }
    .highlight-label { color: #6b7280; font-size: 14px; }
    .highlight-value { color: #1a1a1a; font-weight: 500; }
    .button { display: inline-block; background: #f0b400; color: #0c1220; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #d9a300; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #9ca3af; }
    .footer a { color: #6b7280; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <a href="${APP_URL}" class="logo">${APP_NAME}</a>
      </div>
      ${content}
      <div class="footer">
        <p>${APP_NAME}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Email template types
export type EmailEventType = 
  | 'agreement_created'
  | 'agreement_accepted'
  | 'agreement_funded'
  | 'evidence_submitted'
  | 'milestone_approved'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'agreement_completed';

export interface AgreementEmailData {
  recipientName: string;
  agreementTitle: string;
  agreementId: string;
  amount?: string;
  currency?: string;
  milestoneNumber?: number;
  milestoneDescription?: string;
  senderName?: string;
  disputeReason?: string;
  resolution?: string;
  resolutionDetails?: string;
}

// Generate email content based on event type
export function generateEmailContent(
  eventType: EmailEventType,
  data: AgreementEmailData
): { subject: string; html: string } {
  const viewAgreementButton = `<a href="${APP_URL}/dashboard/personal?agreement=${data.agreementId}" class="button">Ver acuerdo</a>`;

  switch (eventType) {
    case 'agreement_created':
      return {
        subject: `Tienes un acuerdo pendiente de revision - ${data.agreementTitle}`,
        html: emailWrapper(`
          <h1>Nuevo acuerdo recibido</h1>
          <p>Hola ${data.recipientName},</p>
          <p>${data.senderName || 'Alguien'} te ha enviado un acuerdo para tu revision.</p>
          <div class="highlight">
            <div class="highlight-row">
              <span class="highlight-label">Acuerdo</span>
              <span class="highlight-value">${data.agreementTitle}</span>
            </div>
            ${data.amount ? `
            <div class="highlight-row">
              <span class="highlight-label">Monto total</span>
              <span class="highlight-value">$${data.amount} ${data.currency || 'USDC'}</span>
            </div>
            ` : ''}
          </div>
          <p>Revisa los detalles y confirma tu participacion:</p>
          ${viewAgreementButton}
          <p style="font-size: 13px; color: #6b7280;">Si no reconoces este acuerdo, puedes ignorar este mensaje.</p>
        `),
      };

    case 'agreement_accepted':
      return {
        subject: `Acuerdo aceptado - ${data.agreementTitle}`,
        html: emailWrapper(`
          <h1>Acuerdo aceptado</h1>
          <p>Hola ${data.recipientName},</p>
          <p>${data.senderName || 'La contraparte'} acepto el acuerdo "${data.agreementTitle}".</p>
          <p>El siguiente paso es depositar los fondos para activar el acuerdo.</p>
          ${data.amount ? `
          <div class="highlight">
            <div class="highlight-row">
              <span class="highlight-label">Monto a depositar</span>
              <span class="highlight-value">$${data.amount} ${data.currency || 'USDC'}</span>
            </div>
          </div>
          ` : ''}
          ${viewAgreementButton}
        `),
      };

    case 'agreement_funded':
      return {
        subject: `Fondos depositados - Puedes comenzar el trabajo`,
        html: emailWrapper(`
          <h1>Fondos depositados</h1>
          <p>Hola ${data.recipientName},</p>
          <p>Los fondos del acuerdo "${data.agreementTitle}" fueron depositados.</p>
          <p>Ya puedes comenzar con la primera entrega.</p>
          ${data.milestoneDescription ? `
          <div class="highlight">
            <div class="highlight-row">
              <span class="highlight-label">Primera entrega</span>
              <span class="highlight-value">${data.milestoneDescription}</span>
            </div>
            ${data.amount ? `
            <div class="highlight-row">
              <span class="highlight-label">Monto</span>
              <span class="highlight-value">$${data.amount} ${data.currency || 'USDC'}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}
          <p>Cuando completes el trabajo, sube la evidencia para solicitar la liberacion de fondos.</p>
          ${viewAgreementButton}
        `),
      };

    case 'evidence_submitted':
      return {
        subject: `Nueva entrega lista para revision - ${data.agreementTitle}`,
        html: emailWrapper(`
          <h1>Nueva entrega recibida</h1>
          <p>Hola ${data.recipientName},</p>
          <p>${data.senderName || 'El proveedor'} subio evidencia para la entrega #${data.milestoneNumber || 1} del acuerdo "${data.agreementTitle}".</p>
          <p>Revisa el trabajo entregado y aprueba la liberacion de fondos si estas conforme.</p>
          ${viewAgreementButton}
        `),
      };

    case 'milestone_approved':
      return {
        subject: `Entrega aprobada - Fondos liberados`,
        html: emailWrapper(`
          <h1>Entrega aprobada</h1>
          <p>Hola ${data.recipientName},</p>
          <p>La entrega #${data.milestoneNumber || 1} del acuerdo "${data.agreementTitle}" fue aprobada.</p>
          ${data.amount ? `
          <div class="highlight">
            <div class="highlight-row">
              <span class="highlight-label">Fondos liberados</span>
              <span class="highlight-value">$${data.amount} ${data.currency || 'USDC'}</span>
            </div>
          </div>
          ` : ''}
          <p>Los fondos ya estan disponibles en tu wallet.</p>
          ${viewAgreementButton}
        `),
      };

    case 'dispute_opened':
      return {
        subject: `Se abrio una disputa - ${data.agreementTitle}`,
        html: emailWrapper(`
          <h1>Disputa abierta</h1>
          <p>Hola ${data.recipientName},</p>
          <p>Se abrio una disputa en el acuerdo "${data.agreementTitle}".</p>
          ${data.disputeReason || data.milestoneNumber || data.amount ? `
          <div class="highlight">
            ${data.disputeReason ? `
            <div class="highlight-row">
              <span class="highlight-label">Motivo</span>
              <span class="highlight-value">${data.disputeReason}</span>
            </div>
            ` : ''}
            ${data.milestoneNumber ? `
            <div class="highlight-row">
              <span class="highlight-label">Entrega en disputa</span>
              <span class="highlight-value">#${data.milestoneNumber}</span>
            </div>
            ` : ''}
            ${data.amount ? `
            <div class="highlight-row">
              <span class="highlight-label">Monto en disputa</span>
              <span class="highlight-value">$${data.amount} ${data.currency || 'USDC'}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}
          <p>Un arbitro revisara el caso y tomara una decision. Te notificaremos cuando haya una resolucion.</p>
          <p>Si tienes evidencia adicional que presentar, puedes subirla desde el acuerdo.</p>
          ${viewAgreementButton}
        `),
      };

    case 'dispute_resolved':
      return {
        subject: `Disputa resuelta - ${data.agreementTitle}`,
        html: emailWrapper(`
          <h1>Disputa resuelta</h1>
          <p>Hola ${data.recipientName},</p>
          <p>La disputa del acuerdo "${data.agreementTitle}" fue resuelta.</p>
          <div class="highlight">
            <div class="highlight-row">
              <span class="highlight-label">Decision</span>
              <span class="highlight-value">${data.resolution || 'Ver detalles'}</span>
            </div>
            ${data.resolutionDetails ? `
            <div class="highlight-row">
              <span class="highlight-label">Justificacion</span>
              <span class="highlight-value">${data.resolutionDetails}</span>
            </div>
            ` : ''}
          </div>
          ${viewAgreementButton}
        `),
      };

    case 'agreement_completed':
      return {
        subject: `Acuerdo completado - ${data.agreementTitle}`,
        html: emailWrapper(`
          <h1>Acuerdo completado</h1>
          <p>Hola ${data.recipientName},</p>
          <p>El acuerdo "${data.agreementTitle}" se completo exitosamente.</p>
          ${data.amount ? `
          <div class="highlight">
            <div class="highlight-row">
              <span class="highlight-label">Monto total</span>
              <span class="highlight-value">$${data.amount} ${data.currency || 'USDC'}</span>
            </div>
          </div>
          ` : ''}
          <p>Gracias por usar Thalos.</p>
          ${viewAgreementButton}
        `),
      };

    default:
      return {
        subject: `Actualizacion de acuerdo - ${data.agreementTitle}`,
        html: emailWrapper(`
          <h1>Actualizacion de acuerdo</h1>
          <p>Hola ${data.recipientName},</p>
          <p>Hay una actualizacion en tu acuerdo "${data.agreementTitle}".</p>
          ${viewAgreementButton}
        `),
      };
  }
}
