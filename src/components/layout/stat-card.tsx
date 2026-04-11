import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: string; positive?: boolean };
  icon?: React.ReactNode;
  href?: string;
}

function StatCardInner({ label, value, change, icon }: Omit<StatCardProps, 'href'>) {
  return (
    <>
      <div className="flex items-start justify-between">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{label}</p>
        {icon && (
          <span className="h-4 w-4 text-zinc-400 flex-shrink-0">{icon}</span>
        )}
      </div>
      <p className="text-2xl font-semibold font-mono text-zinc-900 dark:text-white mt-2 tracking-tight">
        {value}
      </p>
      {change && (
        <p
          className={cn(
            'text-xs mt-1',
            change.positive === true
              ? 'text-emerald-600 dark:text-emerald-400'
              : change.positive === false
              ? 'text-red-500 dark:text-red-400'
              : 'text-zinc-500'
          )}
        >
          {change.value}
        </p>
      )}
    </>
  );
}

export function StatCard({ label, value, change, icon, href }: StatCardProps) {
  const baseClass =
    'relative bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-white/10 transition-colors';

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        <StatCardInner label={label} value={value} change={change} icon={icon} />
      </Link>
    );
  }

  return (
    <div className={baseClass}>
      <StatCardInner label={label} value={value} change={change} icon={icon} />
    </div>
  );
}
