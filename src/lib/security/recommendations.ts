/**
 * Security Recommendations Generator v1.5.0
 * Generates actionable security recommendations based on scan results
 */

import type { SecurityScanData, SecurityRecommendation, RecommendationPriority } from '@/types/database';

let recommendationIdCounter = 0;

function createRecommendation(
  priority: RecommendationPriority,
  title: string,
  description: string,
  category: SecurityRecommendation['category']
): SecurityRecommendation {
  recommendationIdCounter += 1;
  return {
    id: `rec_${recommendationIdCounter}`,
    priority,
    title,
    description,
    category,
  };
}

/**
 * Generate SSL-related recommendations
 */
function generateSSLRecommendations(ssl: SecurityScanData['ssl']): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  if (!ssl.valid) {
    recommendations.push(
      createRecommendation(
        'critical',
        'Certificato SSL non valido',
        'Il certificato SSL del sito non e valido o e scaduto. Questo puo causare avvisi di sicurezza per i visitatori e penalizzazioni SEO. Rinnova o installa un certificato SSL valido.',
        'ssl'
      )
    );
  }

  if (!ssl.https_forced) {
    recommendations.push(
      createRecommendation(
        'high',
        'Forzare HTTPS',
        'Il sito non forza automaticamente il redirect da HTTP a HTTPS. Configura il redirect 301 permanente nel file .htaccess o tramite plugin per garantire che tutto il traffico sia cifrato.',
        'ssl'
      )
    );
  }

  if (ssl.valid && !ssl.hsts_enabled) {
    recommendations.push(
      createRecommendation(
        'medium',
        'Abilitare HSTS',
        'HTTP Strict Transport Security (HSTS) non e abilitato. HSTS forza i browser a comunicare solo tramite HTTPS, prevenendo attacchi downgrade. Aggiungi l\'header HSTS alla configurazione del server.',
        'ssl'
      )
    );
  }

  return recommendations;
}

/**
 * Generate version-related recommendations
 */
function generateVersionRecommendations(
  versions: SecurityScanData['versions']
): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  if (!versions.wp_updated) {
    recommendations.push(
      createRecommendation(
        'critical',
        'Aggiornare WordPress core',
        'La versione di WordPress non e aggiornata. Gli aggiornamenti del core includono fix di sicurezza critici. Esegui l\'aggiornamento alla versione piu recente il prima possibile.',
        'versions'
      )
    );
  }

  if (!versions.plugins_updated) {
    recommendations.push(
      createRecommendation(
        'high',
        'Aggiornare i plugin',
        `Ci sono ${versions.outdated_count || 'alcuni'} plugin non aggiornati. I plugin obsoleti sono una delle principali cause di vulnerabilita. Aggiorna tutti i plugin alla versione piu recente.`,
        'versions'
      )
    );
  }

  if (!versions.themes_updated) {
    recommendations.push(
      createRecommendation(
        'medium',
        'Aggiornare i temi',
        'Uno o piu temi non sono aggiornati. Anche i temi possono contenere vulnerabilita di sicurezza. Aggiorna i temi installati.',
        'versions'
      )
    );
  }

  return recommendations;
}

/**
 * Generate configuration-related recommendations
 */
function generateConfigRecommendations(
  config: SecurityScanData['config']
): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  if (!config.debug_disabled) {
    recommendations.push(
      createRecommendation(
        'high',
        'Disabilitare WP_DEBUG in produzione',
        'Il debug di WordPress e attivo. Questo puo esporre informazioni sensibili agli attaccanti. Imposta WP_DEBUG a false in wp-config.php per i siti in produzione.',
        'config'
      )
    );
  }

  if (!config.file_editor_disabled) {
    recommendations.push(
      createRecommendation(
        'high',
        'Disabilitare l\'editor di file',
        'L\'editor di file integrato di WordPress e attivo. Se un attaccante ottiene accesso admin, puo modificare direttamente il codice PHP. Aggiungi define(\'DISALLOW_FILE_EDIT\', true); in wp-config.php.',
        'config'
      )
    );
  }

  if (!config.directory_listing_disabled) {
    recommendations.push(
      createRecommendation(
        'medium',
        'Disabilitare il listing delle directory',
        'Il listing delle directory non e disabilitato. Gli attaccanti possono vedere la struttura dei file. Aggiungi "Options -Indexes" al file .htaccess.',
        'config'
      )
    );
  }

  if (config.default_prefix) {
    recommendations.push(
      createRecommendation(
        'low',
        'Cambiare il prefisso delle tabelle',
        'Il database utilizza il prefisso predefinito "wp_". Questo facilita gli attacchi SQL injection. Considera di cambiare il prefisso delle tabelle.',
        'config'
      )
    );
  }

  return recommendations;
}

/**
 * Generate security plugin recommendations
 */
function generateSecurityPluginRecommendations(
  securityPlugin: SecurityScanData['security_plugin']
): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  if (!securityPlugin.installed) {
    recommendations.push(
      createRecommendation(
        'high',
        'Installare un plugin di sicurezza',
        'Nessun plugin di sicurezza rilevato. Installa un plugin come Wordfence, Sucuri o iThemes Security per proteggere il sito da attacchi comuni.',
        'security_plugin'
      )
    );
  } else if (!securityPlugin.active) {
    recommendations.push(
      createRecommendation(
        'high',
        'Attivare il plugin di sicurezza',
        `Il plugin di sicurezza ${securityPlugin.name || ''} e installato ma non attivo. Attivalo per abilitare le protezioni.`,
        'security_plugin'
      )
    );
  }

  return recommendations;
}

/**
 * Generate file integrity recommendations
 */
function generateFileIntegrityRecommendations(
  fileIntegrity: SecurityScanData['file_integrity']
): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  if (fileIntegrity.core_files_modified > 0) {
    recommendations.push(
      createRecommendation(
        'critical',
        'File core WordPress modificati',
        `${fileIntegrity.core_files_modified} file core di WordPress sono stati modificati. Questo potrebbe indicare una compromissione. Verifica i file e ripristina gli originali se necessario.`,
        'files'
      )
    );
  }

  if (fileIntegrity.suspicious_files.length > 0) {
    recommendations.push(
      createRecommendation(
        'critical',
        'File sospetti rilevati',
        `Sono stati rilevati ${fileIntegrity.suspicious_files.length} file sospetti. Esamina questi file immediatamente per potenziale malware: ${fileIntegrity.suspicious_files.slice(0, 3).join(', ')}${fileIntegrity.suspicious_files.length > 3 ? '...' : ''}`,
        'files'
      )
    );
  }

  return recommendations;
}

/**
 * Generate all security recommendations based on scan data
 */
export function generateRecommendations(data: SecurityScanData): SecurityRecommendation[] {
  // Reset counter for each new generation
  recommendationIdCounter = 0;

  const recommendations: SecurityRecommendation[] = [
    ...generateSSLRecommendations(data.ssl),
    ...generateVersionRecommendations(data.versions),
    ...generateConfigRecommendations(data.config),
    ...generateSecurityPluginRecommendations(data.security_plugin),
    ...generateFileIntegrityRecommendations(data.file_integrity),
  ];

  // Sort by priority: critical > high > medium > low
  const priorityOrder: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get priority badge color for UI display
 */
export function getPriorityColor(priority: RecommendationPriority): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'low':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
  }
}

/**
 * Get priority label in Italian
 */
export function getPriorityLabel(priority: RecommendationPriority): string {
  switch (priority) {
    case 'critical':
      return 'Critico';
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Medio';
    case 'low':
      return 'Basso';
  }
}

/**
 * Get category label in Italian
 */
export function getCategoryLabel(category: SecurityRecommendation['category']): string {
  switch (category) {
    case 'ssl':
      return 'SSL/HTTPS';
    case 'versions':
      return 'Aggiornamenti';
    case 'config':
      return 'Configurazione';
    case 'security_plugin':
      return 'Plugin Sicurezza';
    case 'files':
      return 'Integrita File';
  }
}

/**
 * Count recommendations by priority
 */
export function countByPriority(
  recommendations: SecurityRecommendation[]
): Record<RecommendationPriority, number> {
  return recommendations.reduce(
    (acc, rec) => {
      acc[rec.priority] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 } as Record<RecommendationPriority, number>
  );
}
