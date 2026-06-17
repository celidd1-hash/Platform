import { createHash } from 'node:crypto';
import { getSecret } from '@/lib/secrets';
import { SIGNED_URL } from '@/config/constants';

/**
 * Абстракция видеохостинга (ARCHITECTURE.md §5).
 * Остальной код знает ТОЛЬКО этот интерфейс. Имя «Bunny» живёт только здесь —
 * смена хостинга = правка одного адаптера, плеер и страницы не трогаем.
 */
export interface VideoProvider {
  /** Подписанная HLS-ссылка с коротким TTL для авторизованного ученика (ТЗ §6А.7). */
  getSignedStreamUrl(videoId: string, userId: string): Promise<string>;
  /** Удалить видео из хранилища (полное удаление курса, Дополнение №1). Best-effort. */
  deleteVideo(videoId: string): Promise<{ ok: boolean }>;
}

/**
 * Bunny Stream через прямое HLS-воспроизведение (Direct Play) + CDN Token Authentication.
 *
 * Наш собственный плеер (hls.js) грузит playlist.m3u8 НАПРЯМУЮ с CDN-хоста библиотеки
 * (vz-xxxx.b-cdn.net), а не через iframe Bunny. Значит и подписывать надо схемой
 * CDN token auth, а не iframe-токеном.
 *
 * Используем directory-токен (token_path = «/{guid}/»): один токен с общим expires
 * покрывает и мастер-плейлист, и вложенные плейлисты/сегменты, которые hls.js
 * запрашивает сам. Иначе segment-запросы прилетали бы без валидного токена → 403.
 *
 * Док: https://docs.bunny.net/docs/cdn-token-authentication-basics
 */
class BunnyVideoProvider implements VideoProvider {
  constructor(
    private readonly libraryId: string,
    private readonly cdnHostname: string,
    private readonly tokenAuthKey: string,
    private readonly apiKey: string | undefined,
  ) {}

  async getSignedStreamUrl(videoId: string, _userId: string): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + SIGNED_URL.VIDEO_TTL_SEC;
    const host = this.cdnHostname.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    // Directory-токен: подпись считается по token_path, а сам token_path уходит в query.
    const tokenPath = `/${videoId}/`;
    const params = `token_path=${tokenPath}`;
    // Bunny CDN token auth: base64(sha256(key + signaturePath + expires + params)), url-safe.
    const token = createHash('sha256')
      .update(this.tokenAuthKey + tokenPath + expires + params)
      .digest('base64')
      .replace(/\n/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    const query = `token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}`;
    return `https://${host}/${videoId}/playlist.m3u8?${query}`;
  }

  async deleteVideo(videoId: string): Promise<{ ok: boolean }> {
    if (!this.apiKey) return { ok: false };
    try {
      const res = await fetch(
        `https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`,
        { method: 'DELETE', headers: { AccessKey: this.apiKey } },
      );
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }
}

/** Заглушка для dev/каркаса, пока ключи Bunny не заданы. */
class NullVideoProvider implements VideoProvider {
  async getSignedStreamUrl(videoId: string): Promise<string> {
    // В каркасе возвращаем «как есть» (или пустую строку) — плеер покажет заглушку.
    return videoId ?? '';
  }

  async deleteVideo(): Promise<{ ok: boolean }> {
    return { ok: true }; // нечего удалять
  }
}

export async function getVideoProvider(): Promise<VideoProvider> {
  const [libraryId, cdnHostname, tokenKey, apiKey] = await Promise.all([
    getSecret('BUNNY_LIBRARY_ID'),
    getSecret('BUNNY_CDN_HOSTNAME'),
    getSecret('BUNNY_TOKEN_AUTH_KEY'),
    getSecret('BUNNY_API_KEY'),
  ]);
  // Для прямого HLS нужен и CDN-хост, и токен-ключ — иначе подписать ссылку нечем.
  if (libraryId && cdnHostname && tokenKey) {
    return new BunnyVideoProvider(libraryId, cdnHostname, tokenKey, apiKey);
  }
  return new NullVideoProvider();
}
