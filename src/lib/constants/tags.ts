/**
 * Predefined site tags with their display configuration
 */

export interface TagConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PREDEFINED_TAGS: TagConfig[] = [
  {
    value: 'produzione',
    label: 'Produzione',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  {
    value: 'dev',
    label: 'Sviluppo',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  {
    value: 'staging',
    label: 'Staging',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  {
    value: 'nuova-versione',
    label: 'Nuova Versione',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
  {
    value: 'in-sviluppo',
    label: 'In Fase di Sviluppo',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    borderColor: 'border-orange-300 dark:border-orange-700',
  },
  {
    value: 'nuovo',
    label: 'Nuovo',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/50',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
  },
  {
    value: 'manutenzione',
    label: 'Manutenzione',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  {
    value: 'ecommerce',
    label: 'E-commerce',
    color: 'text-pink-700 dark:text-pink-300',
    bgColor: 'bg-pink-100 dark:bg-pink-900/50',
    borderColor: 'border-pink-300 dark:border-pink-700',
  },
];

/**
 * Get tag configuration by value
 */
export function getTagConfig(tagValue: string): TagConfig {
  const found = PREDEFINED_TAGS.find(t => t.value === tagValue);
  if (found) return found;

  // Default config for custom tags
  return {
    value: tagValue,
    label: tagValue,
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
  };
}

/**
 * Get all unique tags from sites
 */
export function getUniqueTags(sites: { tags?: string[] }[]): string[] {
  const tagSet = new Set<string>();
  for (const site of sites) {
    if (site.tags) {
      for (const tag of site.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort();
}
