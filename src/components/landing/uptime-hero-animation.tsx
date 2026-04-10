'use client';

import { useEffect, useState } from 'react';

export function UptimeHeroAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const points = [
    [0, 60], [40, 55], [80, 58], [120, 30], [160, 35],
    [200, 25], [240, 40], [280, 20], [320, 28], [360, 15],
    [400, 22], [440, 18], [480, 25], [520, 12], [560, 20],
  ];

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ');

  const areaPath = `${linePath} L 560 100 L 0 100 Z`;
  const totalLength = 900;

  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow background */}
      <div
        className="absolute inset-0 -m-8 rounded-3xl opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.2), transparent 70%)',
        }}
      />

      <svg
        viewBox="0 0 560 140"
        fill="none"
        className="w-full h-auto relative z-10"
        aria-hidden="true"
      >
        {[20, 40, 60, 80, 100].map((y) => (
          <line
            key={y}
            x1="0" y1={y} x2="560" y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>

        {mounted && (
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            className="animate-reveal-up"
            style={{ animationDelay: '0.8s' }}
          />
        )}

        {mounted && (
          <path
            d={linePath}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: totalLength,
              strokeDashoffset: totalLength,
              animation: 'draw-line 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards',
            }}
          />
        )}

        {mounted && [
          { cx: 200, cy: 25, delay: '1.2s' },
          { cx: 360, cy: 15, delay: '1.6s' },
          { cx: 520, cy: 12, delay: '2.0s' },
        ].map((dot, i) => (
          <g key={i}>
            <circle
              cx={dot.cx} cy={dot.cy} r="6"
              fill="none"
              stroke="#10B981"
              strokeWidth="1"
              opacity="0"
              style={{
                animation: `dot-pulse 2s ease-in-out ${dot.delay} infinite`,
                transformOrigin: `${dot.cx}px ${dot.cy}px`,
              }}
            />
            <circle
              cx={dot.cx} cy={dot.cy} r="3"
              fill="#10B981"
              className="animate-reveal-up"
              style={{ animationDelay: dot.delay }}
            />
          </g>
        ))}
      </svg>

      {mounted && (
        <>
          <div
            className="absolute top-2 right-0 bg-[#141414] border border-white/10 rounded-lg px-3 py-2 animate-reveal-up"
            style={{ animationDelay: '1.4s' }}
          >
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Uptime</div>
            <div className="text-lg font-bold font-mono text-emerald-400">99.98%</div>
          </div>
          <div
            className="absolute bottom-4 left-0 bg-[#141414] border border-white/10 rounded-lg px-3 py-2 animate-reveal-up"
            style={{ animationDelay: '1.8s' }}
          >
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Response</div>
            <div className="text-lg font-bold font-mono text-sky-400">247ms</div>
          </div>
        </>
      )}
    </div>
  );
}
