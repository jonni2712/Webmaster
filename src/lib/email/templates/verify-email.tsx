import * as React from 'react';

interface VerifyEmailTemplateProps {
  userName: string;
  verificationUrl: string;
}

export function VerifyEmailTemplate({
  userName,
  verificationUrl,
}: VerifyEmailTemplateProps): React.ReactElement {
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
        Verifica il tuo indirizzo email
      </h1>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Ciao {userName || 'utente'},
      </p>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Grazie per esserti registrato su Webmaster Monitor. Per completare la
        registrazione e accedere al tuo account, clicca sul pulsante qui sotto:
      </p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={verificationUrl}
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
          Verifica Email
        </a>
      </div>
      <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5' }}>
        Questo link scadra tra 24 ore. Se non hai richiesto questa email, puoi
        ignorarla in sicurezza.
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
        {verificationUrl}
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
