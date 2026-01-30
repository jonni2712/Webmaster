'use client';

import { Badge } from '@/components/ui/badge';
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
import { getLifecycleStatusConfig } from '@/lib/constants/lifecycle-status';

interface LifecycleStatusBadgeProps {
  status: DomainLifecycleStatus;
  size?: 'sm' | 'default';
  showIcon?: boolean;
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

export function LifecycleStatusBadge({
  status,
  size = 'default',
  showIcon = true,
}: LifecycleStatusBadgeProps) {
  const config = getLifecycleStatusConfig(status);
  const Icon = iconMap[config.icon as keyof typeof iconMap] || Circle;

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <Badge
      variant="outline"
      className={`${sizeClasses} ${config.color} ${config.bgColor} ${config.borderColor} font-medium`}
    >
      {showIcon && <Icon className={`${iconSize} mr-1`} />}
      {config.label}
    </Badge>
  );
}
