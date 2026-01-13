'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  UserMinus,
  UserCog,
  Globe,
  GlobeLock,
  Pencil,
  Trash2,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityLog, ActivityActionType } from '@/types/database';

interface ActivityItemProps {
  activity: ActivityLog;
}

const actionConfig: Record<
  ActivityActionType,
  { icon: LucideIcon; color: string; description: (activity: ActivityLog) => string }
> = {
  member_invited: {
    icon: UserPlus,
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
    description: a =>
      `ha invitato ${a.target_user_email || 'un utente'} nel team`,
  },
  member_joined: {
    icon: Users,
    color: 'text-green-500 bg-green-100 dark:bg-green-900',
    description: a =>
      `${a.target_user_email || 'Un utente'} e' entrato nel team`,
  },
  member_removed: {
    icon: UserMinus,
    color: 'text-red-500 bg-red-100 dark:bg-red-900',
    description: a =>
      `ha rimosso ${a.target_user_email || 'un utente'} dal team`,
  },
  role_changed: {
    icon: UserCog,
    color: 'text-purple-500 bg-purple-100 dark:bg-purple-900',
    description: a => {
      const oldRole = a.metadata?.old_role || '';
      const newRole = a.metadata?.new_role || '';
      return `ha cambiato il ruolo di ${a.target_user_email || 'un utente'} da ${oldRole} a ${newRole}`;
    },
  },
  site_created: {
    icon: Globe,
    color: 'text-green-500 bg-green-100 dark:bg-green-900',
    description: a => `ha aggiunto il sito "${a.resource_name || 'nuovo sito'}"`,
  },
  site_updated: {
    icon: Pencil,
    color: 'text-amber-500 bg-amber-100 dark:bg-amber-900',
    description: a => `ha modificato il sito "${a.resource_name || 'sito'}"`,
  },
  site_deleted: {
    icon: Trash2,
    color: 'text-red-500 bg-red-100 dark:bg-red-900',
    description: a => `ha eliminato il sito "${a.resource_name || 'sito'}"`,
  },
  client_created: {
    icon: UserPlus,
    color: 'text-green-500 bg-green-100 dark:bg-green-900',
    description: a => `ha creato il cliente "${a.resource_name || 'nuovo cliente'}"`,
  },
  client_updated: {
    icon: Pencil,
    color: 'text-amber-500 bg-amber-100 dark:bg-amber-900',
    description: a => `ha modificato il cliente "${a.resource_name || 'cliente'}"`,
  },
  client_deleted: {
    icon: Trash2,
    color: 'text-red-500 bg-red-100 dark:bg-red-900',
    description: a => `ha eliminato il cliente "${a.resource_name || 'cliente'}"`,
  },
  site_access_granted: {
    icon: Globe,
    color: 'text-green-500 bg-green-100 dark:bg-green-900',
    description: a =>
      `ha concesso accesso al sito "${a.resource_name || 'sito'}" a ${a.target_user_email || 'un utente'}`,
  },
  site_access_revoked: {
    icon: GlobeLock,
    color: 'text-red-500 bg-red-100 dark:bg-red-900',
    description: a =>
      `ha revocato accesso al sito "${a.resource_name || 'sito'}" a ${a.target_user_email || 'un utente'}`,
  },
  settings_updated: {
    icon: Settings,
    color: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
    description: () => `ha aggiornato le impostazioni`,
  },
};

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'ora';
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays === 1) return 'ieri';
  if (diffDays < 7) return `${diffDays} giorni fa`;

  return then.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.substring(0, 2).toUpperCase();
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const config = actionConfig[activity.action_type] || {
    icon: Settings,
    color: 'text-gray-500 bg-gray-100',
    description: () => 'azione sconosciuta',
  };

  const Icon = config.icon;
  const description = config.description(activity);

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className={`rounded-full p-2 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">
            {activity.user_name || activity.user_email?.split('@')[0] || 'Utente'}
          </span>{' '}
          {description}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTimeAgo(activity.created_at)}
        </p>
      </div>

      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {getInitials(activity.user_name, activity.user_email || '')}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
