'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface WebVitalsDataPoint {
  date: string;
  avg_lcp: number;
  avg_fid: number;
  avg_cls: number;
  avg_fcp: number;
  avg_ttfb: number;
}

interface WebVitalsChartProps {
  data: WebVitalsDataPoint[];
  metric: 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb' | 'all';
  height?: number;
}

const metricConfig = {
  lcp: {
    key: 'avg_lcp',
    name: 'LCP',
    color: '#0EA5E9',
    unit: 'ms',
    thresholds: { good: 2500, poor: 4000 },
  },
  fid: {
    key: 'avg_fid',
    name: 'FID',
    color: '#10B981',
    unit: 'ms',
    thresholds: { good: 100, poor: 300 },
  },
  cls: {
    key: 'avg_cls',
    name: 'CLS',
    color: '#F59E0B',
    unit: '',
    thresholds: { good: 0.1, poor: 0.25 },
  },
  fcp: {
    key: 'avg_fcp',
    name: 'FCP',
    color: '#8B5CF6',
    unit: 'ms',
    thresholds: { good: 1800, poor: 3000 },
  },
  ttfb: {
    key: 'avg_ttfb',
    name: 'TTFB',
    color: '#EF4444',
    unit: 'ms',
    thresholds: { good: 800, poor: 1800 },
  },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const date = parseISO(data.date);

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{format(date, 'EEEE d MMMM yyyy', { locale: it })}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const metric = Object.values(metricConfig).find(m => m.key === entry.dataKey);
          if (!metric) return null;

          let statusColor = '#10B981';
          if (entry.value > metric.thresholds.poor) statusColor = '#EF4444';
          else if (entry.value > metric.thresholds.good) statusColor = '#F59E0B';

          return (
            <div key={index} className="flex justify-between gap-4">
              <span style={{ color: entry.color }}>{metric.name}:</span>
              <span className="font-medium" style={{ color: statusColor }}>
                {metric.key === 'avg_cls' ? entry.value.toFixed(3) : Math.round(entry.value)}
                {metric.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WebVitalsChart({ data, metric, height = 300 }: WebVitalsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nessun dato disponibile per il periodo selezionato
      </div>
    );
  }

  // Format data
  const formattedData = data.map(point => ({
    ...point,
    formattedDate: format(parseISO(point.date), 'dd/MM'),
  }));

  // Determine which metrics to show
  const metricsToShow = metric === 'all'
    ? ['lcp', 'fid', 'fcp'] // Don't show CLS in 'all' mode as it has different scale
    : [metric];

  // Calculate Y-axis domain based on selected metrics
  const getYDomain = (): [number, number] => {
    if (metric === 'cls') {
      const maxCls = Math.max(...data.map(d => d.avg_cls));
      return [0, Math.max(0.3, maxCls * 1.2)];
    }
    const allValues = metricsToShow.flatMap(m => {
      const config = metricConfig[m as keyof typeof metricConfig];
      return data.map(d => (d as any)[config.key] || 0);
    });
    const maxValue = Math.max(...allValues);
    return [0, Math.max(1000, maxValue * 1.2)];
  };

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
          domain={getYDomain()}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            metric === 'cls' ? value.toFixed(2) : `${Math.round(value)}ms`
          }
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        {metric === 'all' && <Legend />}
        {metricsToShow.map(m => {
          const config = metricConfig[m as keyof typeof metricConfig];
          return (
            <Line
              key={m}
              type="monotone"
              dataKey={config.key}
              name={config.name}
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: config.color }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
