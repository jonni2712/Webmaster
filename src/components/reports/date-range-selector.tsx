'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subDays, subMonths, format, startOfDay, endOfDay } from 'date-fns';

export type DateRangePreset = '7d' | '30d' | '90d' | '6m' | '1y';

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: 'Ultimi 7 giorni' },
  { value: '30d', label: 'Ultimi 30 giorni' },
  { value: '90d', label: 'Ultimi 90 giorni' },
  { value: '6m', label: 'Ultimi 6 mesi' },
  { value: '1y', label: 'Ultimo anno' },
];

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const end = endOfDay(new Date());
  let start: Date;

  switch (preset) {
    case '7d':
      start = startOfDay(subDays(end, 7));
      break;
    case '30d':
      start = startOfDay(subDays(end, 30));
      break;
    case '90d':
      start = startOfDay(subDays(end, 90));
      break;
    case '6m':
      start = startOfDay(subMonths(end, 6));
      break;
    case '1y':
      start = startOfDay(subMonths(end, 12));
      break;
    default:
      start = startOfDay(subDays(end, 30));
  }

  return { start, end, preset };
}

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  const handlePresetChange = (preset: DateRangePreset) => {
    onChange(getDateRangeFromPreset(preset));
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value.preset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Seleziona periodo" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {format(value.start, 'dd/MM/yyyy')} - {format(value.end, 'dd/MM/yyyy')}
      </span>
    </div>
  );
}
