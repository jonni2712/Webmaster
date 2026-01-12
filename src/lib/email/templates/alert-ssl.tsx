import * as React from 'react';

interface AlertSSLEmailProps {
  siteName: string;
  siteUrl: string;
  expiryDate?: string;
  daysUntilExpiry: number;
  isExpired: boolean;
}

export function AlertSSLEmail({
  siteName,
  siteUrl,
  expiryDate,
  daysUntilExpiry,
  isExpired,
}: AlertSSLEmailProps): React.ReactElement {
  const headerColor = isExpired ? '#dc2626' : '#f59e0b';
  const emoji = isExpired ? '🔴' : '⚠️';
  const title = isExpired ? 'Certificato SSL Scaduto' : 'Certificato SSL in Scadenza';

  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString('it-IT', {
        dateStyle: 'full',
      })
    : 'Non disponibile';

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
      {/* Header */}
      <div
        style={{
          backgroundColor: headerColor,
          padding: '20px',
          borderRadius: '8px 8px 0 0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>{emoji}</div>
        <h1 style={{ color: '#ffffff', margin: '0', fontSize: '24px' }}>
          {title}
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
          {isExpired
            ? `Il certificato SSL del sito ${siteName} e' scaduto. Il sito potrebbe non essere sicuro per i visitatori.`
            : `Il certificato SSL del sito ${siteName} scadra' tra ${daysUntilExpiry} giorni. Ti consigliamo di rinnovarlo prima della scadenza.`}
        </p>

        {/* SSL info box */}
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
                <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Scadenza:</td>
                <td style={{ padding: '8px 0', color: isExpired ? '#dc2626' : '#111827', fontSize: '14px', fontWeight: 'bold' }}>
                  {formattedExpiry}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Giorni rimanenti:</td>
                <td
                  style={{
                    padding: '8px 0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: isExpired ? '#dc2626' : daysUntilExpiry <= 7 ? '#f59e0b' : '#059669',
                  }}
                >
                  {isExpired ? 'SCADUTO' : `${daysUntilExpiry} giorni`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Warning box */}
        <div
          style={{
            backgroundColor: isExpired ? '#fef2f2' : '#fffbeb',
            padding: '15px',
            borderRadius: '8px',
            border: `1px solid ${isExpired ? '#fecaca' : '#fde68a'}`,
            marginBottom: '20px',
          }}
        >
          <p style={{ color: isExpired ? '#991b1b' : '#92400e', fontSize: '14px', margin: '0' }}>
            {isExpired
              ? '⚠️ Un certificato scaduto causera\' avvisi di sicurezza ai visitatori e potrebbe influenzare negativamente il posizionamento SEO.'
              : '💡 Rinnova il certificato SSL prima della scadenza per evitare interruzioni del servizio e avvisi di sicurezza.'}
          </p>
        </div>

        {/* Action button */}
        <div style={{ textAlign: 'center' }}>
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
            Verifica Certificato
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
