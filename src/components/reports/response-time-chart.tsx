'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface ResponseTimeDataPoint {
  date: string;
  avg_response_time: number | null;
  min_response_time: number | null;
  max_response_time: number | null;
}

interface ResponseTimeChartProps {
  data: ResponseTimeDataPoint[];
  height?: number;
  showRange?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const date = parseISO(data.date);

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{format(date, 'EEEE d MMMM yyyy', { locale: it })}</p>
      <div className="space-y-1">
        {data.avg_response_time && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Media:</span>
            <span className="font-medium text-sky-500">{data.avg_response_time}ms</span>
          </div>
        )}
        {data.min_response_time && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Min:</span>
            <span className="text-emerald-600">{data.min_response_time}ms</span>
          </div>
        )}
        {data.max_response_time && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Max:</span>
            <span className="text-amber-500">{data.max_response_time}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ResponseTimeChart({ data, height = 300, showRange = true }: ResponseTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nessun dato disponibile per il periodo selezionato
      </div>
    );
  }

  // Filter out null values and format dates
  const formattedData = data
    .filter(point => point.avg_response_time !== null)
    .map(point => ({
      ...point,
      formattedDate: format(parseISO(point.date), 'dd/MM'),
      // For area range
      range: point.min_response_time && point.max_response_time
        ? [point.min_response_time, point.max_response_time]
        : null,
    }));

  if (formattedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nessun dato di risposta disponibile
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={formattedData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
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
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}ms`}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        {showRange && (
          <Area
            type="monotone"
            dataKey="max_response_time"
            stroke="transparent"
            fill="url(#responseGradient)"
          />
        )}
        <Line
          type="monotone"
          dataKey="avg_response_time"
          stroke="#0EA5E9"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#0EA5E9' }}
        />
        {showRange && (
          <>
            <Line
              type="monotone"
              dataKey="min_response_time"
              stroke="#10B981"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="max_response_time"
              stroke="#F59E0B"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
            />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
