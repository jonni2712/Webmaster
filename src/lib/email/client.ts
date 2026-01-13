import { Resend } from 'resend';
import { ReactElement } from 'react';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set - email functionality will not work');
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Webmaster Monitor <noreply@webmaster-monitor.com>';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}

export async function sendEmail({ to, subject, react, from }: SendEmailOptions) {
  if (!resend) {
    console.warn('Email not sent - Resend client not configured');
    return { error: 'Email client not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { error };
    }

    return { data };
  } catch (err) {
    console.error('Error sending email:', err);
    return { error: err };
  }
}
