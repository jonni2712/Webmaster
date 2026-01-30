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

/**
 * Domain relation type configuration
 * Defines how a domain relates to the primary domain in a brand
 */
export type DomainRelationType =
  | 'primary'           // Dominio principale del brand
  | 'redirect'          // Redirect verso altro dominio
  | 'weglot_language'   // Lingua Weglot collegata al principale
  | 'wordpress_subsite' // Sottosito WordPress (multisite)
  | 'alias'             // Alias/mirror del principale
  | 'standalone';       // Sito indipendente nel brand

export interface DomainRelationConfig {
  value: DomainRelationType;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const DOMAIN_RELATION_CONFIG: DomainRelationConfig[] = [
  {
    value: 'primary',
    label: 'Principale',
    description: 'Dominio principale del brand',
    icon: 'Star',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    value: 'redirect',
    label: 'Redirect',
    description: 'Reindirizza ad altro dominio',
    icon: 'ArrowRight',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    value: 'weglot_language',
    label: 'Lingua Weglot',
    description: 'Variante lingua gestita da Weglot',
    icon: 'Languages',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    value: 'wordpress_subsite',
    label: 'Sottosito WP',
    description: 'Sottosito WordPress multisite',
    icon: 'LayoutGrid',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    value: 'alias',
    label: 'Alias',
    description: 'Alias o mirror del sito principale',
    icon: 'Copy',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  {
    value: 'standalone',
    label: 'Indipendente',
    description: 'Sito indipendente nel brand',
    icon: 'Globe',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

/**
 * Common Weglot language codes
 */
export const WEGLOT_LANGUAGES = [
  { code: 'en', label: 'Inglese', flag: '🇬🇧' },
  { code: 'de', label: 'Tedesco', flag: '🇩🇪' },
  { code: 'fr', label: 'Francese', flag: '🇫🇷' },
  { code: 'es', label: 'Spagnolo', flag: '🇪🇸' },
  { code: 'pt', label: 'Portoghese', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Olandese', flag: '🇳🇱' },
  { code: 'pl', label: 'Polacco', flag: '🇵🇱' },
  { code: 'ru', label: 'Russo', flag: '🇷🇺' },
  { code: 'zh', label: 'Cinese', flag: '🇨🇳' },
  { code: 'ja', label: 'Giapponese', flag: '🇯🇵' },
  { code: 'ko', label: 'Coreano', flag: '🇰🇷' },
  { code: 'ar', label: 'Arabo', flag: '🇸🇦' },
  { code: 'tr', label: 'Turco', flag: '🇹🇷' },
  { code: 'sv', label: 'Svedese', flag: '🇸🇪' },
  { code: 'da', label: 'Danese', flag: '🇩🇰' },
  { code: 'fi', label: 'Finlandese', flag: '🇫🇮' },
  { code: 'no', label: 'Norvegese', flag: '🇳🇴' },
  { code: 'cs', label: 'Ceco', flag: '🇨🇿' },
  { code: 'el', label: 'Greco', flag: '🇬🇷' },
];

export function getDomainRelationConfig(relation: DomainRelationType | null): DomainRelationConfig {
  const found = DOMAIN_RELATION_CONFIG.find(r => r.value === relation);
  return found || DOMAIN_RELATION_CONFIG.find(r => r.value === 'standalone')!;
}

export function getWeglotLanguageLabel(code: string | null): string {
  if (!code) return '-';
  const lang = WEGLOT_LANGUAGES.find(l => l.code === code);
  return lang ? `${lang.flag} ${lang.label}` : code.toUpperCase();
}
