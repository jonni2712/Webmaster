/**
 * Migration script: encrypt existing plaintext API keys in the `sites` table.
 *
 * Run with:
 *   npx dotenv -e .env.local -- npx tsx scripts/encrypt-existing-api-keys.ts
 *
 * Requires env vars:
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - ENCRYPTION_KEY  (the SAME key that the app will use for decryption)
 *
 * The script is idempotent: rows already in `enc:v1:` format are skipped.
 * Run as many times as needed without side effects.
 */

import { createClient } from '@supabase/supabase-js';
import { encrypt, isEncrypted } from '../src/lib/crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!ENCRYPTION_KEY) {
  console.error('Missing ENCRYPTION_KEY. Generate one with: openssl rand -hex 32');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log('Fetching sites with API key or secret set...');

  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, name, api_key_encrypted, api_secret_encrypted')
    .or('api_key_encrypted.not.is.null,api_secret_encrypted.not.is.null');

  if (error) {
    console.error('Failed to fetch sites:', error.message);
    process.exit(1);
  }

  if (!sites || sites.length === 0) {
    console.log('No sites with API credentials found. Nothing to do.');
    return;
  }

  console.log(`Found ${sites.length} sites with credentials.`);

  let migratedKeys = 0;
  let migratedSecrets = 0;
  let skipped = 0;
  let failed = 0;

  for (const site of sites) {
    const updates: Record<string, string | null> = {};

    if (site.api_key_encrypted && !isEncrypted(site.api_key_encrypted)) {
      updates.api_key_encrypted = encrypt(site.api_key_encrypted);
    }

    if (site.api_secret_encrypted && !isEncrypted(site.api_secret_encrypted)) {
      updates.api_secret_encrypted = encrypt(site.api_secret_encrypted);
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('sites')
      .update(updates)
      .eq('id', site.id);

    if (updateError) {
      console.error(`  [FAIL] ${site.name} (${site.id}): ${updateError.message}`);
      failed++;
      continue;
    }

    if (updates.api_key_encrypted) migratedKeys++;
    if (updates.api_secret_encrypted) migratedSecrets++;
    console.log(`  [OK]   ${site.name}`);
  }

  console.log('');
  console.log('=== Migration Summary ===');
  console.log(`  Sites scanned:        ${sites.length}`);
  console.log(`  API keys encrypted:   ${migratedKeys}`);
  console.log(`  API secrets encrypted:${migratedSecrets}`);
  console.log(`  Already encrypted:    ${skipped}`);
  console.log(`  Failed:               ${failed}`);
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
