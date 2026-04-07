import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * AES-256-GCM encryption for sensitive data at rest (API keys, secrets).
 *
 * Format: `enc:v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>`
 *
 * The `enc:v1:` prefix allows backward compatibility with existing plaintext
 * values: `decrypt()` returns plaintext as-is if it doesn't match the format,
 * enabling gradual migration of existing data.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const AUTH_TAG_LENGTH = 16;
const ENC_PREFIX = 'enc:v1:';

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey || rawKey.length === 0) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  // Accept either 64-char hex (32 bytes) or any string (we'll hash it).
  // Hex is preferred for production; hashing allows easier dev setup.
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    cachedKey = Buffer.from(rawKey, 'hex');
  } else {
    // Derive a 32-byte key from any string via SHA-256.
    cachedKey = createHash('sha256').update(rawKey).digest();
  }

  return cachedKey;
}

/**
 * Returns true if the value is in the encrypted envelope format.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

/**
 * Encrypts a plaintext string. Returns the envelope format.
 * If input is null/undefined/empty, returns it unchanged.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return null;
  }

  // Idempotent: don't re-encrypt already-encrypted values.
  if (isEncrypted(plaintext)) {
    return plaintext;
  }

  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts an envelope-formatted string.
 *
 * Backward compatibility: if the value is NOT in the envelope format,
 * it is assumed to be legacy plaintext and returned as-is. This allows
 * gradual migration of existing rows without breaking reads.
 *
 * Returns null for null/undefined/empty input.
 */
export function decrypt(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Legacy plaintext: return as-is.
  if (!isEncrypted(value)) {
    return value;
  }

  const payload = value.slice(ENC_PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted value: bad IV or auth tag length');
  }

  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

/**
 * Safe decrypt that returns null on error instead of throwing.
 * Use in non-critical paths where a corrupt value shouldn't crash the request.
 */
export function tryDecrypt(value: string | null | undefined): string | null {
  try {
    return decrypt(value);
  } catch (err) {
    console.error('Failed to decrypt value:', err instanceof Error ? err.message : err);
    return null;
  }
}
