import { createHash } from 'node:crypto';
import { env } from '@/config/env';
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
 * Bunny Stream: token authentication по схеме SHA256(token_key + path + expires).
 * Док: https://docs.bunny.net/docs/stream-embed-token-authentication
 */
class BunnyVideoProvider implements VideoProvider {
  constructor(
    private readonly libraryId: string,
    private readonly tokenAuthKey: string,
    private readonly apiKey: string | undefined,
  ) {}

  async getSignedStreamUrl(videoId: string, _userId: string): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + SIGNED_URL.VIDEO_TTL_SEC;
    const path = `/${videoId}/playlist.m3u8`;
    const token = createHash('sha256')
      .update(this.tokenAuthKey + path + expires)
      .digest('hex');
    const base = `https://iframe.mediadelivery.net/play/${this.libraryId}`;
    return `${base}${path}?token=${token}&expires=${expires}`;
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

let instance: VideoProvider | null = null;

export function getVideoProvider(): VideoProvider {
  if (instance) return instance;
  if (env.BUNNY_LIBRARY_ID && env.BUNNY_TOKEN_AUTH_KEY) {
    instance = new BunnyVideoProvider(
      env.BUNNY_LIBRARY_ID,
      env.BUNNY_TOKEN_AUTH_KEY,
      env.BUNNY_API_KEY,
    );
  } else {
    instance = new NullVideoProvider();
  }
  return instance;
}
