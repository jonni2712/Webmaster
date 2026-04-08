import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/client';
import { VerifyEmailTemplate } from '@/lib/email/templates/verify-email';

/**
 * TEMPORARY debug endpoint — DELETE AFTER TROUBLESHOOTING.
 *
 * Sends a real email through the production sendEmail() pipeline
 * and returns the full result, so we can see:
 *   - which backend was actually used (smtp / resend / none)
 *   - any error from nodemailer or Resend
 *   - the SMTP_HOST env var value visible to this function instance
 *
 * Protected by a query secret to avoid being used as a spam relay.
 * Set DEBUG_EMAIL_SECRET on Vercel to a random string before calling.
 */

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  const to = url.searchParams.get('to');

  if (!process.env.DEBUG_EMAIL_SECRET) {
    return NextResponse.json(
      { error: 'DEBUG_EMAIL_SECRET not configured' },
      { status: 503 }
    );
  }
  if (secret !== process.env.DEBUG_EMAIL_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!to) {
    return NextResponse.json(
      { error: 'missing ?to=email parameter' },
      { status: 400 }
    );
  }

  // Snapshot env state visible to this function instance
  const envSnapshot = {
    SMTP_HOST: process.env.SMTP_HOST || null,
    SMTP_PORT: process.env.SMTP_PORT || null,
    SMTP_SECURE: process.env.SMTP_SECURE || null,
    SMTP_USER: process.env.SMTP_USER ? `<set, ${process.env.SMTP_USER.length} chars>` : null,
    SMTP_PASS: process.env.SMTP_PASS ? `<set, ${process.env.SMTP_PASS.length} chars>` : null,
    EMAIL_FROM: process.env.EMAIL_FROM || null,
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '<set>' : null,
    NODE_ENV: process.env.NODE_ENV || null,
  };

  let result;
  try {
    result = await sendEmail({
      to,
      subject: '[DEBUG] Test email da Webmaster Monitor',
      react: VerifyEmailTemplate({
        userName: 'Debug Test',
        verificationUrl: 'https://webmaster-monitor.it/verify-email?token=DEBUG_TEST',
      }),
    });
  } catch (err) {
    return NextResponse.json(
      {
        env: envSnapshot,
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      },
      { status: 500 }
    );
  }

  // Serialize the error properly if any
  const serializedError = result.error
    ? (result.error instanceof Error
        ? { message: result.error.message, stack: result.error.stack, name: result.error.name }
        : result.error)
    : null;

  return NextResponse.json({
    env: envSnapshot,
    result: {
      success: result.success,
      backend: result.backend,
      messageId: result.messageId,
      error: serializedError,
    },
  });
}
