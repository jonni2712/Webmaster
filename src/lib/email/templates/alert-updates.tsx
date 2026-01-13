import * as React from 'react';

interface UpdateItem {
  name: string;
  type: 'core' | 'plugin' | 'theme';
  currentVersion: string;
  newVersion: string;
  isCritical: boolean;
}

interface AlertUpdatesEmailProps {
  siteName: string;
  siteUrl: string;
  updates: UpdateItem[];
  criticalCount: number;
  totalCount: number;
  dashboardUrl?: string;
}

export function AlertUpdatesEmail({
  siteName,
  siteUrl,
  updates,
  criticalCount,
  totalCount,
  dashboardUrl,
}: AlertUpdatesEmailProps): React.ReactElement {
  const isCritical = criticalCount > 0;
  const headerColor = isCritical ? '#dc2626' : '#f59e0b';
  const emoji = isCritical ? '🔴' : '🔄';
  const title = isCritical
    ? `${criticalCount} Aggiornamenti Critici`
    : `${totalCount} Aggiornamenti Disponibili`;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'core':
        return 'WordPress';
      case 'plugin':
        return 'Plugin';
      case 'theme':
        return 'Tema';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'core':
        return '#2563eb';
      case 'plugin':
        return '#7c3aed';
      case 'theme':
        return '#db2777';
      default:
        return '#6b7280';
    }
  };

  // Show critical updates first, then limit to 5
  const sortedUpdates = [...updates]
    .sort((a, b) => (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0))
    .slice(0, 5);

  const remainingCount = updates.length - sortedUpdates.length;

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
        <h1 style={{ color: '#ffffff', margin: '0', fontSize: '24px' }}>{title}</h1>
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
          {isCritical
            ? `Sono stati rilevati ${criticalCount} aggiornamenti critici per il sito ${siteName}. Ti consigliamo di applicarli il prima possibile.`
            : `Sono disponibili ${totalCount} aggiornamenti per il sito ${siteName}.`}
        </p>

        {/* Updates list */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px',
            overflow: 'hidden',
          }}
        >
          {sortedUpdates.map((update, index) => (
            <div
              key={index}
              style={{
                padding: '12px 16px',
                borderBottom: index < sortedUpdates.length - 1 ? '1px solid #e5e7eb' : 'none',
                backgroundColor: update.isCritical ? '#fef2f2' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: getTypeColor(update.type),
                    color: '#ffffff',
                  }}
                >
                  {getTypeLabel(update.type)}
                </span>
                {update.isCritical && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                    }}
                  >
                    CRITICO
                  </span>
                )}
              </div>
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#111827' }}>{update.name}</span>
                <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '8px' }}>
                  {update.currentVersion} → {update.newVersion}
                </span>
              </div>
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              + altri {remainingCount} aggiornamenti
            </div>
          )}
        </div>

        {/* Warning box for critical updates */}
        {isCritical && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '20px',
            }}
          >
            <p style={{ color: '#991b1b', fontSize: '14px', margin: '0' }}>
              ⚠️ Gli aggiornamenti critici spesso contengono fix di sicurezza importanti.
              Non applicarli potrebbe esporre il tuo sito a vulnerabilita'.
            </p>
          </div>
        )}

        {/* Site info */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '14px' }}>Sito:</td>
                <td style={{ padding: '4px 0', color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>
                  {siteName}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '14px' }}>URL:</td>
                <td style={{ padding: '4px 0' }}>
                  <a href={siteUrl} style={{ color: '#2563eb', fontSize: '14px' }}>
                    {siteUrl}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action button */}
        <div style={{ textAlign: 'center' }}>
          <a
            href={dashboardUrl || siteUrl}
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              backgroundColor: isCritical ? '#dc2626' : '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
            }}
          >
            {isCritical ? 'Aggiorna Subito' : 'Visualizza Aggiornamenti'}
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
