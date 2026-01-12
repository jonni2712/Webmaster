import * as React from 'react';

interface AlertDowntimeEmailProps {
  siteName: string;
  siteUrl: string;
  timestamp: string;
  errorMessage?: string;
}

export function AlertDowntimeEmail({
  siteName,
  siteUrl,
  timestamp,
  errorMessage,
}: AlertDowntimeEmailProps): React.ReactElement {
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
      {/* Header with alert icon */}
      <div
        style={{
          backgroundColor: '#dc2626',
          padding: '20px',
          borderRadius: '8px 8px 0 0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔴</div>
        <h1 style={{ color: '#ffffff', margin: '0', fontSize: '24px' }}>
          Sito Non Raggiungibile
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
          Il monitoraggio ha rilevato che il sito <strong>{siteName}</strong> non e' raggiungibile.
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
                <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Rilevato:</td>
                <td style={{ padding: '8px 0', color: '#111827', fontSize: '14px' }}>
                  {formattedTime}
                </td>
              </tr>
              {errorMessage && (
                <tr>
                  <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Errore:</td>
                  <td style={{ padding: '8px 0', color: '#dc2626', fontSize: '14px' }}>
                    {errorMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action button */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <a
            href={siteUrl}
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            Verifica Sito
          </a>
        </div>

        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', margin: '0' }}>
          Ti invieremo un'altra notifica quando il sito tornera' online.
        </p>
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
