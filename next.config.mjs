/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Загрузка конспектов идёт через server action. Поднимаем лимит тела (по умолчанию 1 МБ).
  // Выше ~4.5 МБ всё равно режет платформа Vercel — фактический потолок задаём в коде (UPLOAD).
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  // Заголовки безопасности (ТЗ §6А.6). CSP уточняется при подключении внешних доменов (Bunny CDN).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
