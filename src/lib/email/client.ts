import { ReactElement } from 'react';
import { render } from '@react-email/render';
import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';

/**
 * Email client with pluggable backends.
 *
 * Priority order (first match wins):
 *   1. SMTP (nodemailer) — if SMTP_HOST is set
 *   2. Resend — if RESEND_API_KEY is set
 *   3. Console log — dev fallback, no email actually sent
 *
 * All existing callers that import `resend` or `sendEmail` continue to
 * work unchanged. `resend` is exported as `null` when the Resend backend
 * is not active; the preferred API is `sendEmail()`.
 */

export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Webmaster Monitor <noreply@webmaster-monitor.com>';

// ---------- SMTP (nodemailer) ----------

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter | null {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // SMTP_SECURE=true uses implicit TLS (typically port 465).
  // Otherwise nodemailer upgrades via STARTTLS when the server offers it.
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return smtpTransporter;
}

// ---------- Resend (legacy fallback) ----------

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ---------- Public API ----------

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  backend: 'smtp' | 'resend' | 'console' | 'none';
  messageId?: string;
  error?: unknown;
}

/**
 * Sends a transactional email using the best-available backend.
 * Safe to call even when no backend is configured — it will log and
 * return success=false instead of throwing.
 */
export async function sendEmail({
  to,
  subject,
  react,
  from,
}: SendEmailOptions): Promise<SendEmailResult> {
  const recipients = Array.isArray(to) ? to : [to];
  const sender = from || EMAIL_FROM;

  const transporter = getSmtpTransporter();

  // Backend 1: SMTP (nodemailer)
  if (transporter) {
    try {
      const html = await render(react);
      const text = await render(react, { plainText: true });

      const info = await transporter.sendMail({
        from: sender,
        to: recipients,
        subject,
        html,
        text,
      });

      return {
        success: true,
        backend: 'smtp',
        messageId: info.messageId,
      };
    } catch (err) {
      console.error('[email] SMTP send failed:', err);
      return { success: false, backend: 'smtp', error: err };
    }
  }

  // Backend 2: Resend
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: sender,
        to: recipients,
        subject,
        react,
      });

      if (error) {
        console.error('[email] Resend send failed:', error);
        return { success: false, backend: 'resend', error };
      }

      return {
        success: true,
        backend: 'resend',
        messageId: data?.id,
      };
    } catch (err) {
      console.error('[email] Resend send failed:', err);
      return { success: false, backend: 'resend', error: err };
    }
  }

  // Backend 3: Console fallback (development only)
  console.warn(
    `[email] No backend configured. Would have sent:\n  to: ${recipients.join(', ')}\n  subject: ${subject}`
  );
  return { success: false, backend: 'none' };
}

/**
 * Compatibility shim for callers that used the Resend API directly
 * (e.g. `resend.emails.send(...)`). Routes the call through `sendEmail`
 * so SMTP is used when available.
 */
export const emailCompat = {
  emails: {
    async send(options: {
      from?: string;
      to: string | string[];
      subject: string;
      react: ReactElement;
    }) {
      return sendEmail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        react: options.react,
      });
    },
  },
};
