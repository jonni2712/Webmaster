import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  value: string;
  active?: boolean;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tabs?: Tab[];
}

export function PageHeader({ title, description, actions, tabs }: PageHeaderProps) {
  return (
    <div className="border-b border-zinc-200 dark:border-white/5">
      <div className="px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex items-center px-6 gap-0">
          {tabs.map((tab) => {
            const spanClass = cn(
              'inline-block px-3 py-2 text-sm border-b-2 transition-colors',
              tab.active
                ? 'text-zinc-900 dark:text-white border-emerald-500'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white border-transparent'
            );

            if (tab.href) {
              return (
                <Link key={tab.value} href={tab.href} className={spanClass}>
                  {tab.label}
                </Link>
              );
            }

            return (
              <span key={tab.value} className={spanClass}>
                {tab.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
