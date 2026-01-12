import * as React from 'react';

interface SiteStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number | null;
  sslStatus: 'valid' | 'expiring' | 'expired' | 'invalid' | null;
  sslDaysRemaining: number | null;
}

interface AlertSummary {
  id: string;
  siteName: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

interface DigestEmailProps {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  stats: {
    totalSites: number;
    sitesOnline: number;
    sitesOffline: number;
    sslValid: number;
    sslExpiring: number;
    sslExpired: number;
    totalAlerts: number;
    criticalAlerts: number;
  };
  sites: SiteStatus[];
  recentAlerts: AlertSummary[];
  dashboardUrl: string;
}

export function DigestEmail({
  periodLabel,
  periodStart,
  periodEnd,
  stats,
  sites,
  recentAlerts,
  dashboardUrl,
}: DigestEmailProps): React.ReactElement {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'valid':
        return '#22c55e';
      case 'offline':
      case 'expired':
      case 'invalid':
        return '#ef4444';
      case 'degraded':
      case 'expiring':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const offlineSites = sites.filter(s => s.status === 'offline');
  const expiringSslSites = sites.filter(s => s.sslStatus === 'expiring' || s.sslStatus === 'expired');

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
      backgroundColor: '#f6f9fc',
      padding: '20px 0',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        margin: '0 auto',
        maxWidth: '600px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 20px',
          textAlign: 'center',
          backgroundColor: '#1a1a2e',
          color: '#ffffff',
        }}>
          <h1 style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 600,
            margin: '0 0 8px 0',
          }}>
            Riepilogo {periodLabel}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            {periodStart} - {periodEnd}
          </p>
        </div>

        {/* Stats Overview */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center', padding: '12px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>{stats.totalSites}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Siti Totali</div>
                </td>
                <td style={{ textAlign: 'center', padding: '12px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{stats.sitesOnline}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Online</div>
                </td>
                <td style={{ textAlign: 'center', padding: '12px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stats.sitesOffline > 0 ? '#ef4444' : '#22c55e' }}>
                    {stats.sitesOffline}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Offline</div>
                </td>
                <td style={{ textAlign: 'center', padding: '12px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stats.criticalAlerts > 0 ? '#ef4444' : '#6b7280' }}>
                    {stats.totalAlerts}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Alert</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Offline Sites Alert */}
        {offlineSites.length > 0 && (
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 16px 0' }}>
              Siti Offline ({offlineSites.length})
            </h2>
            {offlineSites.map((site, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                marginBottom: '8px',
              }}>
                <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>{site.name}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{site.url}</p>
              </div>
            ))}
          </div>
        )}

        {/* SSL Expiring Alert */}
        {expiringSslSites.length > 0 && (
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 16px 0' }}>
              SSL in Scadenza ({expiringSslSites.length})
            </h2>
            {expiringSslSites.map((site, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: site.sslStatus === 'expired' ? '#fef2f2' : '#fffbeb',
                borderRadius: '8px',
                marginBottom: '8px',
              }}>
                <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>
                  {site.name}
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: site.sslStatus === 'expired' ? '#fef2f2' : '#fffbeb',
                    color: site.sslStatus === 'expired' ? '#ef4444' : '#f59e0b',
                  }}>
                    {site.sslStatus === 'expired' ? 'Scaduto' : `${site.sslDaysRemaining} giorni`}
                  </span>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{site.url}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 16px 0' }}>
              Ultimi Alert ({recentAlerts.length})
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {recentAlerts.slice(0, 10).map((alert, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getSeverityColor(alert.severity),
                        marginRight: '8px',
                      }} />
                      <span style={{ fontWeight: 500 }}>{alert.siteName}</span>
                    </td>
                    <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>
                      {alert.title}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* All Sites Status */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: '0 0 16px 0' }}>
            Stato Siti
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Sito</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Stato</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Uptime</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>SSL</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                    <div style={{ margin: 0, fontWeight: 500 }}>{site.name}</div>
                    <div style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{site.url}</div>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: site.status === 'online' ? '#f0fdf4' : '#fef2f2',
                      color: getStatusColor(site.status),
                    }}>
                      {site.status === 'online' ? 'Online' : site.status === 'offline' ? 'Offline' : 'Degradato'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                    {site.uptime !== null ? `${site.uptime.toFixed(1)}%` : '-'}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                    {site.sslStatus ? (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: site.sslStatus === 'valid' ? '#f0fdf4' : site.sslStatus === 'expiring' ? '#fffbeb' : '#fef2f2',
                        color: getStatusColor(site.sslStatus),
                      }}>
                        {site.sslStatus === 'valid' ? 'Valido' : site.sslStatus === 'expiring' ? `${site.sslDaysRemaining}g` : 'Scaduto'}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <a href={dashboardUrl} style={{
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            padding: '12px 24px',
            display: 'inline-block',
          }}>
            Vai alla Dashboard
          </a>
        </div>

        {/* Footer */}
        <div style={{ padding: '24px 20px', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 8px 0' }}>
            Ricevi questa email perche' hai attivato il digest {periodLabel}.
          </p>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
            Puoi modificare le preferenze nelle{' '}
            <a href={`${dashboardUrl}/settings`} style={{ color: '#3b82f6' }}>impostazioni</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DigestEmail;
