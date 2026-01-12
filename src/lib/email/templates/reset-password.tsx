import * as React from 'react';

interface ResetPasswordTemplateProps {
  userName: string;
  resetUrl: string;
}

export function ResetPasswordTemplate({
  userName,
  resetUrl,
}: ResetPasswordTemplateProps): React.ReactElement {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <h1 style={{ color: '#333', marginBottom: '24px' }}>
        Reimposta la tua password
      </h1>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Ciao {userName || 'utente'},
      </p>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Abbiamo ricevuto una richiesta per reimpostare la password del tuo
        account Webmaster Monitor. Clicca sul pulsante qui sotto per creare una
        nuova password:
      </p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={resetUrl}
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            backgroundColor: '#0070f3',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          Reimposta Password
        </a>
      </div>
      <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5' }}>
        Questo link scadra' tra 1 ora. Se non hai richiesto questa email, puoi
        ignorarla in sicurezza - la tua password rimarra' invariata.
      </p>
      <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5' }}>
        Se il pulsante non funziona, copia e incolla questo link nel tuo
        browser:
      </p>
      <p
        style={{
          color: '#0070f3',
          fontSize: '14px',
          wordBreak: 'break-all',
        }}
      >
        {resetUrl}
      </p>
      <hr
        style={{ borderColor: '#eee', borderStyle: 'solid', marginTop: '32px' }}
      />
      <p style={{ color: '#999', fontSize: '12px', marginTop: '16px' }}>
        Webmaster Monitor - Monitoraggio siti web
      </p>
    </div>
  );
}
