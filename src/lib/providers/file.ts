import { getSecret } from '@/lib/secrets';

/**
 * Абстракция файлового хранилища (ARCHITECTURE.md §5). Сегодня — Bunny Storage.
 *
 * Конспекты НЕ отдаются публично: загрузка и скачивание идут через наш сервер по
 * AccessKey (Storage password), который остаётся server-side. Ученик получает файл
 * только через роут с проверкой доступа (ТЗ §6А.7) — прямого URL у файла нет вовсе.
 *
 * В БД (LessonFile.fileUrl) хранится относительный путь-ключ внутри зоны, не полный URL.
 */
export interface FileProvider {
  /** Загрузить файл по ключу-пути. */
  uploadFile(storagePath: string, data: Uint8Array, contentType: string): Promise<{ ok: boolean }>;
  /** Получить файл из хранилища для проксирования скачивания. */
  fetchFile(
    storagePath: string,
  ): Promise<{ ok: boolean; body: ReadableStream<Uint8Array> | null; contentType: string | null }>;
  /** Удалить файл из хранилища (полное удаление, Дополнение №1). Best-effort. */
  deleteFile(storagePath: string): Promise<{ ok: boolean }>;
}

/** Хост Storage API Bunny для регионов по умолчанию (вкл. Frankfurt). */
const STORAGE_HOST = 'storage.bunnycdn.com';

class BunnyFileProvider implements FileProvider {
  /** Базовый URL зоны: https://storage.bunnycdn.com/{zone}/ */
  private readonly base: string;

  constructor(
    zone: string,
    private readonly password: string,
  ) {
    this.base = `https://${STORAGE_HOST}/${zone.replace(/^\/+|\/+$/g, '')}/`;
  }

  private urlFor(storagePath: string): string {
    return this.base + storagePath.replace(/^\/+/, '');
  }

  async uploadFile(storagePath: string, data: Uint8Array, contentType: string): Promise<{ ok: boolean }> {
    try {
      const res = await fetch(this.urlFor(storagePath), {
        method: 'PUT',
        headers: { AccessKey: this.password, 'Content-Type': contentType },
        // Uint8Array — валидное тело fetch в Node/undici; cast обходит придирку дженериков TS.
        body: data as unknown as BodyInit,
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }

  async fetchFile(storagePath: string) {
    try {
      const res = await fetch(this.urlFor(storagePath), { headers: { AccessKey: this.password } });
      if (!res.ok || !res.body) return { ok: false, body: null, contentType: null };
      return { ok: true, body: res.body, contentType: res.headers.get('content-type') };
    } catch {
      return { ok: false, body: null, contentType: null };
    }
  }

  async deleteFile(storagePath: string): Promise<{ ok: boolean }> {
    try {
      const res = await fetch(this.urlFor(storagePath), {
        method: 'DELETE',
        headers: { AccessKey: this.password },
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }
}

/** Заглушка, пока ключи Bunny Storage не заданы. */
class NullFileProvider implements FileProvider {
  async uploadFile(): Promise<{ ok: boolean }> {
    return { ok: false };
  }
  async fetchFile() {
    return { ok: false, body: null, contentType: null };
  }
  async deleteFile(): Promise<{ ok: boolean }> {
    return { ok: true }; // нечего удалять
  }
}

export async function getFileProvider(): Promise<FileProvider> {
  const [zone, password] = await Promise.all([
    getSecret('BUNNY_STORAGE_ZONE'),
    getSecret('BUNNY_STORAGE_PASSWORD'),
  ]);
  if (zone && password) return new BunnyFileProvider(zone, password);
  return new NullFileProvider();
}
