import * as React from 'react';
import { sendEmail } from './client';

// ---------- Shared layout ----------

const EMERALD = '#10B981';
const CONTAINER: React.CSSProperties = {
  fontFamily: 'Arial, sans-serif',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
};
const H1: React.CSSProperties = { color: '#333', marginBottom: '24px' };
const BODY: React.CSSProperties = { color: '#555', fontSize: '16px', lineHeight: '1.5' };
const MUTED: React.CSSProperties = { color: '#888', fontSize: '14px', lineHeight: '1.5' };
const FOOTER: React.CSSProperties = { color: '#999', fontSize: '12px', marginTop: '16px' };
const HR: React.CSSProperties = { borderColor: '#eee', borderStyle: 'solid', marginTop: '32px' };
const BUTTON: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 28px',
  backgroundColor: EMERALD,
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  fontSize: '16px',
};
const BUTTON_WRAP: React.CSSProperties = { textAlign: 'center', margin: '32px 0' };

const SETTINGS_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`
  : 'https://app.webmaster-monitor.com/dashboard/settings/billing';

// ---------- Templates ----------

function UpgradeTemplate({ planName }: { planName: string }): React.ReactElement {
  return React.createElement(
    'div',
    { style: CONTAINER },
    React.createElement('h1', { style: H1 }, `Upgrade confermato — Piano ${planName}`),
    React.createElement(
      'p',
      { style: BODY },
      `Congratulazioni! Il tuo piano e' stato aggiornato a ${planName}.`
    ),
    React.createElement(
      'p',
      { style: BODY },
      "Puoi gestire il tuo abbonamento dalla sezione Impostazioni > Abbonamento."
    ),
    React.createElement(
      'div',
      { style: BUTTON_WRAP },
      React.createElement('a', { href: SETTINGS_URL, style: BUTTON }, 'Gestisci abbonamento')
    ),
    React.createElement('hr', { style: HR }),
    React.createElement(
      'p',
      { style: FOOTER },
      'Webmaster Monitor - Monitoraggio siti web'
    )
  );
}

function TrialEndingTemplate({
  planName,
  endsAt,
}: {
  planName: string;
  endsAt: string;
}): React.ReactElement {
  return React.createElement(
    'div',
    { style: CONTAINER },
    React.createElement('h1', { style: H1 }, 'La tua prova gratuita scade tra 3 giorni'),
    React.createElement(
      'p',
      { style: BODY },
      `La prova gratuita del piano ${planName} scade il ${endsAt}.`
    ),
    React.createElement(
      'p',
      { style: BODY },
      'Per continuare senza interruzioni, verifica il tuo metodo di pagamento.'
    ),
    React.createElement(
      'div',
      { style: BUTTON_WRAP },
      React.createElement('a', { href: SETTINGS_URL, style: BUTTON }, 'Verifica pagamento')
    ),
    React.createElement('p', { style: MUTED }, 'Se non aggiorni il metodo di pagamento, al termine della prova il tuo account passera\' automaticamente al piano Starter gratuito.'),
    React.createElement('hr', { style: HR }),
    React.createElement(
      'p',
      { style: FOOTER },
      'Webmaster Monitor - Monitoraggio siti web'
    )
  );
}

function PaymentFailedTemplate(): React.ReactElement {
  return React.createElement(
    'div',
    { style: CONTAINER },
    React.createElement('h1', { style: H1 }, 'Pagamento non riuscito — aggiorna il metodo di pagamento'),
    React.createElement(
      'p',
      { style: BODY },
      "Non siamo riusciti a processare il pagamento per il tuo abbonamento."
    ),
    React.createElement(
      'p',
      { style: BODY },
      'Aggiorna il metodo di pagamento entro 7 giorni per evitare la sospensione.'
    ),
    React.createElement(
      'div',
      { style: BUTTON_WRAP },
      React.createElement('a', { href: SETTINGS_URL, style: BUTTON }, 'Aggiorna pagamento')
    ),
    React.createElement(
      'p',
      { style: MUTED },
      "Se hai gia' aggiornato il metodo di pagamento, il sistema ritentero' automaticamente il pagamento nei prossimi giorni."
    ),
    React.createElement('hr', { style: HR }),
    React.createElement(
      'p',
      { style: FOOTER },
      'Webmaster Monitor - Monitoraggio siti web'
    )
  );
}

function CancellationTemplate(): React.ReactElement {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.webmaster-monitor.com';
  return React.createElement(
    'div',
    { style: CONTAINER },
    React.createElement('h1', { style: H1 }, 'Abbonamento cancellato'),
    React.createElement(
      'p',
      { style: BODY },
      "Il tuo abbonamento e' stato cancellato. Sei passato al piano Starter gratuito."
    ),
    React.createElement(
      'p',
      { style: BODY },
      'Puoi effettuare un nuovo upgrade in qualsiasi momento.'
    ),
    React.createElement(
      'div',
      { style: BUTTON_WRAP },
      React.createElement(
        'a',
        { href: `${appUrl}/dashboard/settings/billing`, style: BUTTON },
        'Effettua upgrade'
      )
    ),
    React.createElement(
      'p',
      { style: MUTED },
      'Se hai cancellato per errore o hai cambiato idea, puoi riattivare un piano a pagamento in qualsiasi momento dalla dashboard.'
    ),
    React.createElement('hr', { style: HR }),
    React.createElement(
      'p',
      { style: FOOTER },
      'Webmaster Monitor - Monitoraggio siti web'
    )
  );
}

// ---------- Public API ----------

/**
 * Send upgrade confirmation email.
 * Called from webhook when subscription is created/updated.
 */
export async function sendUpgradeEmail(to: string, planName: string): Promise<void> {
  await sendEmail({
    to,
    subject: `Upgrade confermato — Piano ${planName}`,
    react: React.createElement(UpgradeTemplate, { planName }),
  });
}

/**
 * Send trial ending reminder (3 days before).
 * Called from a cron job or scheduled check.
 */
export async function sendTrialEndingEmail(
  to: string,
  planName: string,
  endsAt: string
): Promise<void> {
  await sendEmail({
    to,
    subject: 'La tua prova gratuita scade tra 3 giorni',
    react: React.createElement(TrialEndingTemplate, { planName, endsAt }),
  });
}

/**
 * Send payment failed notification.
 * Called from webhook on invoice.payment_failed.
 */
export async function sendPaymentFailedEmail(to: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Pagamento non riuscito — aggiorna il metodo di pagamento',
    react: React.createElement(PaymentFailedTemplate, {}),
  });
}

/**
 * Send cancellation confirmation.
 * Called from webhook on subscription.deleted.
 */
export async function sendCancellationEmail(to: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Abbonamento cancellato',
    react: React.createElement(CancellationTemplate, {}),
  });
}
