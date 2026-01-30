'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  RefreshCw,
  Hammer,
  Wrench,
  Clock,
  Trash2,
  ArrowRight,
  Archive,
  Circle,
} from 'lucide-react';
import type { DomainLifecycleStatus } from '@/types/database';
import { LIFECYCLE_STATUS_CONFIG } from '@/lib/constants/lifecycle-status';

interface LifecycleStatusSelectProps {
  value: DomainLifecycleStatus;
  onChange: (value: DomainLifecycleStatus) => void;
  disabled?: boolean;
}

const iconMap = {
  CheckCircle,
  RefreshCw,
  Hammer,
  Wrench,
  Clock,
  Trash2,
  ArrowRight,
  Archive,
  Circle,
};

export function LifecycleStatusSelect({
  value,
  onChange,
  disabled,
}: LifecycleStatusSelectProps) {
  const currentConfig = LIFECYCLE_STATUS_CONFIG.find(s => s.value === value);
  const CurrentIcon = currentConfig
    ? iconMap[currentConfig.icon as keyof typeof iconMap]
    : Circle;

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as DomainLifecycleStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 sm:h-10">
        <SelectValue placeholder="Seleziona stato">
          {currentConfig && (
            <div className="flex items-center gap-2">
              <CurrentIcon className={`h-4 w-4 ${currentConfig.color}`} />
              <span>{currentConfig.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LIFECYCLE_STATUS_CONFIG.map((status) => {
          const Icon = iconMap[status.icon as keyof typeof iconMap] || Circle;
          return (
            <SelectItem key={status.value} value={status.value}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${status.color}`} />
                <div className="flex flex-col">
                  <span className={status.color}>{status.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {status.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
