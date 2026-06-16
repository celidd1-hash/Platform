import { createHash } from 'node:crypto';
import { env } from '@/config/env';
import { SIGNED_URL } from '@/config/constants';

/**
 * Абстракция файлового хранилища (ARCHITECTURE.md §5). Сегодня — Bunny Storage/CDN.
 * Файлы-вложings отдаются только по подписанной ссылке с коротким TTL (ТЗ §6А.7).
 */
export interface FileProvider {
  getSignedDownloadUrl(fileUrl: string, userId: string): Promise<string>;
  /** Удалить файл из хранилища (полное удаление, Дополнение №1). Best-effort. */
  deleteFile(fileUrl: string): Promise<{ ok: boolean }>;
}

/** Bunny CDN token authentication по пути (как для видео). */
class BunnyFileProvider implements FileProvider {
  constructor(
    private readonly tokenAuthKey: string,
    private readonly storageKey: string | undefined,
  ) {}

  async getSignedDownloadUrl(fileUrl: string, _userId: string): Promise<string> {
    try {
      const url = new URL(fileUrl);
      const expires = Math.floor(Date.now() / 1000) + SIGNED_URL.FILE_TTL_SEC;
      const token = createHash('sha256')
        .update(this.tokenAuthKey + url.pathname + expires)
        .digest('hex');
      url.searchParams.set('token', token);
      url.searchParams.set('expires', String(expires));
      return url.toString();
    } catch {
      return fileUrl;
    }
  }

  async deleteFile(fileUrl: string): Promise<{ ok: boolean }> {
    if (!this.storageKey) return { ok: false };
    try {
      // Bunny Storage: DELETE по пути файла с заголовком AccessKey (Storage password).
      const res = await fetch(fileUrl, {
        method: 'DELETE',
        headers: { AccessKey: this.storageKey },
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }
}

class NullFileProvider implements FileProvider {
  async getSignedDownloadUrl(fileUrl: string): Promise<string> {
    return fileUrl;
  }

  async deleteFile(): Promise<{ ok: boolean }> {
    return { ok: true }; // нечего удалять
  }
}

let instance: FileProvider | null = null;

export function getFileProvider(): FileProvider {
  if (instance) return instance;
  instance = env.BUNNY_TOKEN_AUTH_KEY
    ? new BunnyFileProvider(env.BUNNY_TOKEN_AUTH_KEY, env.BUNNY_STORAGE_PASSWORD)
    : new NullFileProvider();
  return instance;
}
