import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { env } from '@/config/env';

/**
 * Симметричное шифрование секретов в БД (ТЗ §6А.5): AES-256-GCM.
 * Ключ выводится из AUTH_SECRET (хранится в менеджере секретов хостинга, не в БД).
 * Формат хранения: base64(iv[12] | tag[16] | ciphertext). Только server-side.
 */
const KEY = scryptSync(env.AUTH_SECRET, 'svetozar-aesgcm-v1', 32);

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
