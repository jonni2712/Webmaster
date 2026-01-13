'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface PerformanceDataPoint {
  date: string;
  avg_score: number;
  checks_count: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  height?: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'; // green
  if (score >= 50) return '#f59e0b'; // yellow
  return '#ef4444'; // red
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const date = parseISO(data.date);
  const score = data.avg_score;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{format(date, 'EEEE d MMMM yyyy', { locale: it })}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Performance Score:</span>
          <span
            className="font-bold"
            style={{ color: getScoreColor(score) }}
          >
            {score}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Test effettuati:</span>
          <span>{data.checks_count}</span>
        </div>
      </div>
    </div>
  );
}

export function PerformanceChart({ data, height = 300 }: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nessun dato disponibile per il periodo selezionato
      </div>
    );
  }

  // Filter and format data
  const formattedData = data
    .filter(point => point.avg_score > 0)
    .map(point => ({
      ...point,
      formattedDate: format(parseISO(point.date), 'dd/MM'),
    }));

  if (formattedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nessun dato di performance disponibile
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={formattedData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={90}
          stroke="#22c55e"
          strokeDasharray="5 5"
          label={{ value: 'Buono', position: 'right', fill: '#22c55e', fontSize: 10 }}
        />
        <ReferenceLine
          y={50}
          stroke="#f59e0b"
          strokeDasharray="5 5"
          label={{ value: 'Medio', position: 'right', fill: '#f59e0b', fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="avg_score"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#8b5cf6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
