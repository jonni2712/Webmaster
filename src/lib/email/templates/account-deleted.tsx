import * as React from 'react';

interface AccountDeletedEmailProps {
  userName: string;
}

/**
 * Sent immediately after a successful GDPR account deletion.
 * Intentionally minimal — the user's data is already gone, so we
 * can't reference anything specific about them.
 */
export function AccountDeletedEmail({
  userName,
}: AccountDeletedEmailProps): React.ReactElement {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        color: '#333',
      }}
    >
      <h1 style={{ color: '#333', marginBottom: '24px' }}>
        Account eliminato
      </h1>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Ciao {userName || 'utente'},
      </p>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Il tuo account Webmaster Monitor è stato eliminato su tua richiesta.
        Tutti i dati personali e i workspace di cui eri unico proprietario
        sono stati rimossi in modo permanente dai nostri sistemi.
      </p>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Come richiesto dal GDPR, abbiamo mantenuto solo un record anonimizzato
        (hash SHA-256 del tuo indirizzo email) a fini di audit e conformità
        legale.
      </p>
      <div
        style={{
          borderLeft: '4px solid #e00',
          paddingLeft: '16px',
          margin: '24px 0',
          color: '#555',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        <strong>Non hai richiesto tu questa operazione?</strong>
        <br />
        Contatta immediatamente il nostro supporto all'indirizzo{' '}
        <a href="mailto:support@webmaster-monitor.it" style={{ color: '#0057FF' }}>
          support@webmaster-monitor.it
        </a>
        .
      </div>
      <p
        style={{
          color: '#888',
          fontSize: '13px',
          marginTop: '32px',
          borderTop: '1px solid #eaeaea',
          paddingTop: '16px',
        }}
      >
        Grazie per aver usato Webmaster Monitor.
      </p>
    </div>
  );
}
