import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Webmaster Monitor - Monitoraggio Siti Web 24/7';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#0A0A0A',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Gradient glow blob */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '800px',
            height: '800px',
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(14, 165, 233, 0.1) 40%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo + brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
              borderRadius: '16px',
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'white',
                lineHeight: 1,
              }}
            >
              Webmaster
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#71717A',
                letterSpacing: '0.2em',
                marginTop: '4px',
              }}
            >
              MONITOR
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            Monitora ogni sito.
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #34D399 0%, #38BDF8 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            Intervieni prima.
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '26px',
            color: '#A1A1AA',
            marginTop: '32px',
            maxWidth: '900px',
          }}
        >
          Uptime, SSL, performance e notifiche in tempo reale per webmaster e
          agenzie.
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '80px',
            fontSize: '20px',
            color: '#52525B',
          }}
        >
          webmaster-monitor.it
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
