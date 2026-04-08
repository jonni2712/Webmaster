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
 * All log lines are prefixed with `[email]` plus a per-call trace id
 * (8 hex chars) so you can grep a single send across the function logs.
 */

export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Webmaster Monitor <noreply@webmaster-monitor.com>';

// ---------- Tracing helpers ----------

function newTraceId(): string {
  // 8 random hex chars — short enough to read in logs, unique enough
  // to correlate one call across multiple log lines.
  return Math.random().toString(16).slice(2, 10);
}

interface LogContext {
  traceId: string;
  to: string[];
  subject: string;
}

function logInfo(ctx: LogContext, msg: string, extra?: Record<string, unknown>) {
  console.log(
    `[email ${ctx.traceId}] ${msg}`,
    JSON.stringify({
      to: ctx.to,
      subject: ctx.subject,
      ...extra,
    })
  );
}

function logError(ctx: LogContext, msg: string, err: unknown, extra?: Record<string, unknown>) {
  const serialized =
    err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : { value: String(err) };
  console.error(
    `[email ${ctx.traceId}] ${msg}`,
    JSON.stringify({
      to: ctx.to,
      subject: ctx.subject,
      ...extra,
      error: serialized,
    })
  );
}

// ---------- SMTP (nodemailer) ----------

let smtpTransporter: Transporter | null = null;
let smtpTransporterBuiltAt: number | null = null;

function getSmtpTransporter(ctx: LogContext): Transporter | null {
  if (smtpTransporter) {
    logInfo(ctx, 'smtp.transporter.cached', {
      built_at: smtpTransporterBuiltAt,
      age_ms: smtpTransporterBuiltAt ? Date.now() - smtpTransporterBuiltAt : null,
    });
    return smtpTransporter;
  }

  const host = process.env.SMTP_HOST;
  if (!host) {
    logInfo(ctx, 'smtp.transporter.skip', { reason: 'SMTP_HOST not set' });
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // SMTP_SECURE=true uses implicit TLS (typically port 465).
  // Otherwise nodemailer upgrades via STARTTLS when the server offers it.
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;

  logInfo(ctx, 'smtp.transporter.creating', {
    host,
    port,
    secure,
    user_length: user?.length ?? 0,
    pass_length: pass?.length ?? 0,
    has_auth: !!(user && pass),
  });

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    // Strict ENV-driven timeouts so we never hang a request forever.
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
    // Logging hooks at the SMTP-protocol level. These produce noisy
    // logs but are exactly what we need to diagnose silent drops.
    logger: false,
    debug: false,
  });
  smtpTransporterBuiltAt = Date.now();

  logInfo(ctx, 'smtp.transporter.created');
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
  traceId: string;
}

/**
 * Sends a transactional email using the best-available backend.
 *
 * Heavily instrumented: every step emits a `[email <traceId>]` log line
 * so you can correlate the entire pipeline of one send in vercel logs.
 * Steps logged:
 *   1. start                       — entry, recipients, subject, sender
 *   2. smtp.transporter.{created,cached,skip}
 *   3. smtp.render.{start,done}    — React-to-HTML rendering
 *   4. smtp.send.start              — sendMail() invocation
 *   5. smtp.send.done | smtp.send.failed
 *   6. (if SMTP unavailable) resend.send.{start,done,failed}
 *   7. result                      — final outcome
 */
export async function sendEmail({
  to,
  subject,
  react,
  from,
}: SendEmailOptions): Promise<SendEmailResult> {
  const traceId = newTraceId();
  const startedAt = Date.now();
  const recipients = Array.isArray(to) ? to : [to];
  const sender = from || EMAIL_FROM;
  const ctx: LogContext = { traceId, to: recipients, subject };

  logInfo(ctx, 'start', {
    sender,
    env: {
      SMTP_HOST_set: !!process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT || null,
      SMTP_SECURE: process.env.SMTP_SECURE || null,
      SMTP_USER_set: !!process.env.SMTP_USER,
      SMTP_PASS_set: !!process.env.SMTP_PASS,
      RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM || null,
    },
  });

  const transporter = getSmtpTransporter(ctx);

  // Backend 1: SMTP (nodemailer)
  if (transporter) {
    try {
      logInfo(ctx, 'smtp.render.start');
      const renderStartedAt = Date.now();
      const html = await render(react);
      const text = await render(react, { plainText: true });
      logInfo(ctx, 'smtp.render.done', {
        html_bytes: html.length,
        text_bytes: text.length,
        render_ms: Date.now() - renderStartedAt,
      });

      logInfo(ctx, 'smtp.send.start', { sender });
      const sendStartedAt = Date.now();
      const info = await transporter.sendMail({
        from: sender,
        to: recipients,
        subject,
        html,
        text,
        headers: {
          // Embed the trace id in a header so we can find the same
          // message later in cPanel mail logs.
          'X-Trace-Id': traceId,
        },
      });
      const sendMs = Date.now() - sendStartedAt;

      logInfo(ctx, 'smtp.send.done', {
        send_ms: sendMs,
        message_id: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        pending: info.pending,
        response: info.response,
        envelope: info.envelope,
      });

      const result: SendEmailResult = {
        success: true,
        backend: 'smtp',
        messageId: info.messageId,
        traceId,
      };
      logInfo(ctx, 'result', {
        success: true,
        backend: 'smtp',
        total_ms: Date.now() - startedAt,
      });
      return result;
    } catch (err) {
      logError(ctx, 'smtp.send.failed', err, {
        total_ms: Date.now() - startedAt,
      });
      return {
        success: false,
        backend: 'smtp',
        error: err,
        traceId,
      };
    }
  }

  // Backend 2: Resend
  if (resend) {
    try {
      logInfo(ctx, 'resend.send.start', { sender });
      const sendStartedAt = Date.now();
      const { data, error } = await resend.emails.send({
        from: sender,
        to: recipients,
        subject,
        react,
      });
      const sendMs = Date.now() - sendStartedAt;

      if (error) {
        logError(ctx, 'resend.send.failed', error, { send_ms: sendMs });
        return { success: false, backend: 'resend', error, traceId };
      }

      logInfo(ctx, 'resend.send.done', {
        send_ms: sendMs,
        message_id: data?.id,
      });
      logInfo(ctx, 'result', {
        success: true,
        backend: 'resend',
        total_ms: Date.now() - startedAt,
      });
      return {
        success: true,
        backend: 'resend',
        messageId: data?.id,
        traceId,
      };
    } catch (err) {
      logError(ctx, 'resend.send.failed', err, {
        total_ms: Date.now() - startedAt,
      });
      return { success: false, backend: 'resend', error: err, traceId };
    }
  }

  // Backend 3: Console fallback (development only)
  console.warn(
    `[email ${traceId}] no backend configured`,
    JSON.stringify({ to: recipients, subject })
  );
  return { success: false, backend: 'none', traceId };
}

/**
 * Compatibility shim for callers that used the Resend API directly.
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
