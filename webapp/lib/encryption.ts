import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY; // 32-byte hex key

/**
 * Encrypt a string using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all hex-encoded).
 * Falls back to plaintext if TOKEN_ENCRYPTION_KEY is not set.
 */
export function encrypt(plaintext: string): string {
  if (!ENCRYPTION_KEY) {
    console.warn('[encryption] TOKEN_ENCRYPTION_KEY not set - storing in plaintext');
    return plaintext;
  }
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string that was encrypted with `encrypt()`.
 * If the value doesn't look encrypted (no colons) or no key is set, returns as-is.
 */
export function decrypt(encrypted: string): string {
  if (!ENCRYPTION_KEY || !encrypted.includes(':')) {
    return encrypted;
  }
  const [ivHex, tagHex, ciphertextHex] = encrypted.split(':');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(ciphertextHex, 'hex', 'utf8') + decipher.final('utf8');
}
