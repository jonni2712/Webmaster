'use client';

import { useEffect, useState } from 'react';

const chartPoints = [
  [0, 55], [20, 52], [40, 54], [60, 30], [80, 33],
  [100, 25], [120, 38], [140, 20], [160, 26], [180, 14],
  [200, 20], [220, 17], [240, 22], [260, 10], [280, 18],
];

const linePath = chartPoints
  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
  .join(' ');

const areaPath = `${linePath} L 280 60 L 0 60 Z`;
const LINE_LENGTH = 500;

const STAT_CARDS = [
  { label: 'Sites', value: '847', color: 'text-white' },
  { label: 'Uptime', value: '99.98%', color: 'text-emerald-400' },
  { label: 'Avg Response', value: '247ms', color: 'text-sky-400' },
  { label: 'Alerts', value: '2', color: 'text-amber-400' },
] as const;

const STATUS_ROWS = [
  { domain: 'example.com', status: 'Online', ms: '12ms', online: true, delay: '1.4s' },
  { domain: 'shop.example.it', status: 'Online', ms: '45ms', online: true, delay: '1.7s' },
  { domain: 'api.example.com', status: 'Online', ms: '23ms', online: true, delay: '2.0s' },
  { domain: 'staging.test.it', status: 'Down', ms: '—', online: false, delay: '2.3s' },
] as const;

export function UptimeHeroAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full max-w-[500px] mx-auto lg:mx-0">
      {/* Radial glow behind card */}
      <div
        className="absolute inset-0 -m-12 rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15), transparent 70%)',
          filter: 'blur(24px)',
        }}
        aria-hidden="true"
      />

      {/* Dashboard card */}
      <div
        className="relative bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.12)]"
        style={{
          transform: 'perspective(1000px) rotateY(-2deg) rotateX(2deg)',
        }}
      >
        {/* Top bar — fake browser chrome */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          {/* Window dots */}
          <span className="w-[6px] h-[6px] rounded-full bg-red-500/80" aria-hidden="true" />
          <span className="w-[6px] h-[6px] rounded-full bg-yellow-500/80" aria-hidden="true" />
          <span className="w-[6px] h-[6px] rounded-full bg-emerald-500/80" aria-hidden="true" />

          {/* Fake URL bar */}
          <div className="ml-2 flex-1 bg-white/[0.04] rounded px-2 py-0.5">
            <span className="text-[9px] text-zinc-600 font-mono select-none">
              webmaster-monitor.it/dashboard
            </span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4 space-y-4">

          {/* Row 1: stat cards */}
          <div className="grid grid-cols-4 gap-2">
            {STAT_CARDS.map((card, i) => (
              <div
                key={card.label}
                className={`bg-white/[0.03] rounded-lg p-3 border border-white/5 ${
                  mounted ? 'animate-reveal-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${0.6 + i * 0.2}s` }}
              >
                <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 truncate">
                  {card.label}
                </div>
                <div className={`text-sm font-mono font-bold ${card.color} truncate`}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Row 2: chart + live feed */}
          <div className="flex gap-3">

            {/* Left: mini uptime chart (60%) */}
            <div className="flex-[3] min-w-0">
              <div className="text-[9px] text-zinc-600 mb-1.5">
                Uptime — ultimi 30 giorni
              </div>
              <svg
                viewBox="0 0 280 60"
                fill="none"
                className="w-full h-auto"
                aria-hidden="true"
              >
                {/* Horizontal grid lines */}
                {[15, 30, 45].map((y) => (
                  <line
                    key={y}
                    x1="0" y1={y} x2="280" y2={y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                  />
                ))}

                <defs>
                  <linearGradient id="miniAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="miniLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>

                {mounted && (
                  <path
                    d={areaPath}
                    fill="url(#miniAreaGrad)"
                    className="animate-reveal-up"
                    style={{ animationDelay: '1.0s' }}
                  />
                )}

                {mounted && (
                  <path
                    d={linePath}
                    stroke="url(#miniLineGrad)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    style={{
                      strokeDasharray: LINE_LENGTH,
                      strokeDashoffset: LINE_LENGTH,
                      animation: 'draw-line 2s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards',
                    }}
                  />
                )}
              </svg>
            </div>

            {/* Right: live status feed (40%) */}
            <div className="flex-[2] min-w-0">
              {/* Live label */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse-online"
                  aria-hidden="true"
                />
                <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider">
                  Live
                </span>
              </div>

              {/* Status rows */}
              <div className="space-y-1">
                {STATUS_ROWS.map((row) => (
                  <div
                    key={row.domain}
                    className={`flex items-center gap-1 text-[8px] ${
                      mounted ? 'animate-reveal-up' : 'opacity-0'
                    }`}
                    style={{ animationDelay: row.delay }}
                  >
                    {/* Status dot */}
                    <span
                      className={`flex-shrink-0 w-[5px] h-[5px] rounded-full ${
                        row.online ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                      aria-hidden="true"
                    />
                    {/* Domain */}
                    <span className="text-zinc-400 truncate flex-1 font-mono">
                      {row.domain}
                    </span>
                    {/* Status */}
                    <span
                      className={`flex-shrink-0 font-mono ${
                        row.online ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {row.status}
                    </span>
                    {/* Response time */}
                    <span className="flex-shrink-0 text-zinc-600 font-mono ml-1">
                      {row.ms}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: notification bar */}
          {mounted && (
            <div
              className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2 animate-reveal-up"
              style={{ animationDelay: '2.5s' }}
            >
              {/* Bell icon — simple circle + arc suggestion */}
              <span
                className="flex-shrink-0 w-3 h-3 rounded-full border border-amber-400/60 flex items-center justify-center"
                aria-hidden="true"
              />
              <span className="text-[9px] text-amber-400 truncate">
                SSL scade tra 7 giorni — shop.example.it
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
