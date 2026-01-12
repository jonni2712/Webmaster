import * as React from 'react';

interface AlertRecoveryEmailProps {
  siteName: string;
  siteUrl: string;
  timestamp: string;
  downtimeDuration?: string;
}

export function AlertRecoveryEmail({
  siteName,
  siteUrl,
  timestamp,
  downtimeDuration,
}: AlertRecoveryEmailProps): React.ReactElement {
  const formattedTime = new Date(timestamp).toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header with success icon */}
      <div
        style={{
          backgroundColor: '#059669',
          padding: '20px',
          borderRadius: '8px 8px 0 0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
        <h1 style={{ color: '#ffffff', margin: '0', fontSize: '24px' }}>
          Sito Tornato Online
        </h1>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '30px',
          backgroundColor: '#f9fafb',
          borderRadius: '0 0 8px 8px',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
        }}
      >
        <p style={{ color: '#374151', fontSize: '16px', lineHeight: '1.6', margin: '0 0 20px' }}>
          Ottime notizie! Il sito <strong>{siteName}</strong> e' nuovamente raggiungibile e funzionante.
        </p>

        {/* Site info box */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Sito:</td>
                <td style={{ padding: '8px 0', color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>
                  {siteName}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>URL:</td>
                <td style={{ padding: '8px 0' }}>
                  <a href={siteUrl} style={{ color: '#2563eb', fontSize: '14px' }}>
                    {siteUrl}
                  </a>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Ripristinato:</td>
                <td style={{ padding: '8px 0', color: '#111827', fontSize: '14px' }}>
                  {formattedTime}
                </td>
              </tr>
              {downtimeDuration && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Durata downtime:</td>
                  <td style={{ padding: '8px 0', color: '#111827', fontSize: '14px' }}>
                    {downtimeDuration}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Success box */}
        <div
          style={{
            backgroundColor: '#ecfdf5',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #a7f3d0',
            marginBottom: '20px',
          }}
        >
          <p style={{ color: '#065f46', fontSize: '14px', margin: '0' }}>
            🎉 Il monitoraggio continuera' a controllare il sito regolarmente per assicurarsi che rimanga online.
          </p>
        </div>

        {/* Action button */}
        <div style={{ textAlign: 'center' }}>
          <a
            href={siteUrl}
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              backgroundColor: '#059669',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            Visita Sito
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0' }}>
          Webmaster Monitor - Monitoraggio siti web
        </p>
      </div>
    </div>
  );
}
