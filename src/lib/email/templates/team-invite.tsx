import * as React from 'react';

interface TeamInviteTemplateProps {
  inviterName: string;
  teamName: string;
  role: string;
  inviteUrl: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Amministratore',
  member: 'Membro',
  viewer: 'Visualizzatore',
};

export function TeamInviteTemplate({
  inviterName,
  teamName,
  role,
  inviteUrl,
}: TeamInviteTemplateProps): React.ReactElement {
  const roleLabel = roleLabels[role] || role;

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
        Sei stato invitato a unirti a un team
      </h1>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Ciao,
      </p>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        <strong>{inviterName}</strong> ti ha invitato a unirti al team{' '}
        <strong>{teamName}</strong> su Webmaster Monitor come{' '}
        <strong>{roleLabel}</strong>.
      </p>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          margin: '24px 0',
        }}
      >
        <p style={{ color: '#555', fontSize: '14px', margin: '0 0 8px 0' }}>
          <strong>Team:</strong> {teamName}
        </p>
        <p style={{ color: '#555', fontSize: '14px', margin: '0' }}>
          <strong>Ruolo:</strong> {roleLabel}
        </p>
      </div>
      <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
        Clicca sul pulsante qui sotto per accettare l'invito e unirti al team:
      </p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={inviteUrl}
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
          Accetta Invito
        </a>
      </div>
      <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5' }}>
        Questo invito scadra' tra 7 giorni. Se non conosci chi ti ha inviato
        questo invito, puoi ignorare questa email in sicurezza.
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
        {inviteUrl}
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
