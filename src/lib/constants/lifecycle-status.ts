/**
 * Domain lifecycle status configuration
 * Used for managing 800+ domains portfolio
 */

import type { DomainLifecycleStatus } from '@/types/database';

export interface LifecycleStatusConfig {
  value: DomainLifecycleStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string; // Lucide icon name
}

export const LIFECYCLE_STATUS_CONFIG: LifecycleStatusConfig[] = [
  {
    value: 'active',
    label: 'Attivo',
    description: 'Sito in produzione e funzionante',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: 'CheckCircle',
  },
  {
    value: 'to_update',
    label: 'Da Aggiornare',
    description: 'Necessita aggiornamenti o modifiche',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    icon: 'RefreshCw',
  },
  {
    value: 'to_rebuild',
    label: 'Da Rifare',
    description: 'Richiede redesign o ricostruzione completa',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    borderColor: 'border-orange-300 dark:border-orange-700',
    icon: 'Hammer',
  },
  {
    value: 'in_maintenance',
    label: 'In Manutenzione',
    description: 'Temporaneamente sospeso o in manutenzione',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    borderColor: 'border-blue-300 dark:border-blue-700',
    icon: 'Wrench',
  },
  {
    value: 'in_progress',
    label: 'In Lavorazione',
    description: 'Attualmente in fase di sviluppo',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50',
    borderColor: 'border-purple-300 dark:border-purple-700',
    icon: 'Clock',
  },
  {
    value: 'to_delete',
    label: 'Da Cancellare',
    description: 'Programmato per eliminazione',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    borderColor: 'border-red-300 dark:border-red-700',
    icon: 'Trash2',
  },
  {
    value: 'redirect_only',
    label: 'Solo Redirect',
    description: 'Dominio che reindirizza ad altro sito',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    icon: 'ArrowRight',
  },
  {
    value: 'archived',
    label: 'Archiviato',
    description: 'Non piu attivo, mantenuto per storico',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-600',
    icon: 'Archive',
  },
];

/**
 * Get lifecycle status configuration by value
 */
export function getLifecycleStatusConfig(status: DomainLifecycleStatus): LifecycleStatusConfig {
  const found = LIFECYCLE_STATUS_CONFIG.find(s => s.value === status);
  if (found) return found;

  // Default fallback
  return {
    value: status,
    label: status,
    description: '',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    icon: 'Circle',
  };
}

/**
 * Get all lifecycle statuses as select options
 */
export function getLifecycleStatusOptions(): { value: DomainLifecycleStatus; label: string }[] {
  return LIFECYCLE_STATUS_CONFIG.map(s => ({
    value: s.value,
    label: s.label,
  }));
}

/**
 * Redirect type configuration
 */
export interface RedirectTypeConfig {
  value: string;
  label: string;
  description: string;
}

export const REDIRECT_TYPES: RedirectTypeConfig[] = [
  { value: '301', label: '301 - Permanente', description: 'Redirect permanente (SEO friendly)' },
  { value: '302', label: '302 - Temporaneo', description: 'Redirect temporaneo' },
  { value: '307', label: '307 - Temporaneo (HTTP/1.1)', description: 'Redirect temporaneo che preserva il metodo' },
  { value: '308', label: '308 - Permanente (HTTP/1.1)', description: 'Redirect permanente che preserva il metodo' },
  { value: 'meta', label: 'Meta Refresh', description: 'Redirect tramite meta tag HTML' },
  { value: 'js', label: 'JavaScript', description: 'Redirect tramite JavaScript' },
];

/**
 * Get redirect type label
 */
export function getRedirectTypeLabel(type: string | null): string {
  if (!type) return '-';
  const found = REDIRECT_TYPES.find(t => t.value === type);
  return found ? found.label : type;
}
