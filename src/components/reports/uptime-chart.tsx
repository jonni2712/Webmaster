'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface UptimeDataPoint {
  date: string;
  uptime_percentage: number;
  total_checks: number;
  successful_checks: number;
  avg_response_time: number | null;
}

interface UptimeChartProps {
  data: UptimeDataPoint[];
  slaTarget?: number;
  height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const date = parseISO(data.date);

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{format(date, 'EEEE d MMMM yyyy', { locale: it })}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Uptime:</span>
          <span className={`font-medium ${data.uptime_percentage >= 99.5 ? 'text-green-600' : data.uptime_percentage >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
            {data.uptime_percentage}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Check:</span>
          <span>{data.successful_checks}/{data.total_checks}</span>
        </div>
        {data.avg_response_time && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Tempo medio:</span>
            <span>{data.avg_response_time}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function UptimeChart({ data, slaTarget = 99.9, height = 300 }: UptimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nessun dato disponibile per il periodo selezionato
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.map(point => ({
    ...point,
    formattedDate: format(parseISO(point.date), 'dd/MM'),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={formattedData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          domain={[
            (dataMin: number) => Math.max(0, Math.floor(dataMin - 5)),
            100
          ]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        {slaTarget && (
          <ReferenceLine
            y={slaTarget}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{
              value: `SLA ${slaTarget}%`,
              position: 'right',
              fill: '#f59e0b',
              fontSize: 10,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="uptime_percentage"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#uptimeGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#22c55e' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
