/**
 * Централизованные числа и лимиты (ARCHITECTURE.md §4, CLAUDE.md).
 * Все значения геймификации, проверки ДЗ и rate-limit живут ТОЛЬКО здесь.
 * Магических чисел в коде быть не должно — менять баланс = править одну строку.
 */

/** Роли пользователей (ТЗ §2). Назначение admin/curator — только вручную. */
export const ROLES = {
  STUDENT: 'student',
  CURATOR: 'curator',
  ADMIN: 'admin',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

/** XP — начисления за активности (ТЗ §3.5). */
export const XP = {
  LESSON_COMPLETED: 50,
  HOMEWORK_PASSED: 30,
  /** Бонус к XP за ДЗ: доля от score проверки (score 0–100 → score * этот коэф.). */
  HOMEWORK_SCORE_FACTOR: 0.5,
  MODULE_COMPLETED: 150,
  COURSE_COMPLETED: 500,
} as const;

/** Типы событий начисления XP (журнал xp_events — рейтинг считается из него). */
export const XP_EVENT_TYPES = {
  LESSON_COMPLETED: 'lesson_completed',
  HOMEWORK_PASSED: 'homework_passed',
  MODULE_COMPLETED: 'module_completed',
  COURSE_COMPLETED: 'course_completed',
} as const;
export type XpEventType = (typeof XP_EVENT_TYPES)[keyof typeof XP_EVENT_TYPES];

/** Проверка ДЗ ИИ-наставником (ТЗ §3.4). */
export const HOMEWORK = {
  /** Минимальная длина ответа (символов), по умолчанию. Настраивается на уровне урока. */
  MIN_LENGTH: 200,
  /** Максимальная длина — защита от абьюза и роста счёта за Claude API (ТЗ §6А.8). */
  MAX_LENGTH: 10_000,
  /** Проходной балл по умолчанию (0–100). Уточняется в ai_settings на уровне курса. */
  DEFAULT_PASS_SCORE: 70,
  /** Строгость проверки по умолчанию. */
  DEFAULT_STRICTNESS: 'normal' as 'lenient' | 'normal' | 'strict',
} as const;

/** Вердикты проверки ДЗ. */
export const HOMEWORK_VERDICT = {
  PASSED: 'passed',
  NEEDS_WORK: 'needs_work',
  /** Fallback: ИИ недоступен — ответ сохранён, проверка догонит фоном (ТЗ §3.4). */
  PENDING: 'pending',
} as const;
export type HomeworkVerdict = (typeof HOMEWORK_VERDICT)[keyof typeof HOMEWORK_VERDICT];

/** Статусы прохождения урока. */
export const LESSON_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;
export type LessonStatus = (typeof LESSON_STATUS)[keyof typeof LESSON_STATUS];

/** Статусы доступа к курсу (enrollment). */
export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
} as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

/** Rate-limits — защита от абьюза и роста счёта за Claude API (ТЗ §6А.6). */
export const RATE_LIMITS = {
  /** Отправок ДЗ на проверку в минуту на пользователя. */
  HOMEWORK_PER_MINUTE: 3,
  /** Попыток входа подряд до временной блокировки (ТЗ §6А.2). */
  LOGIN_ATTEMPTS: 5,
  /** Окно блокировки входа, мс. */
  LOGIN_LOCKOUT_MS: 15 * 60 * 1000,
} as const;

/** Подписанные ссылки на контент — короткий TTL (ТЗ §6А.7). */
export const SIGNED_URL = {
  /** TTL ссылки на видео-поток, секунд. */
  VIDEO_TTL_SEC: 60 * 5,
  /** TTL ссылки на скачивание файла-вложения, секунд. */
  FILE_TTL_SEC: 60 * 2,
} as const;

/** Подтверждение email / сброс пароля / привязка Telegram — одноразовые токены (ТЗ §6А.2). */
export const TOKEN_TTL = {
  EMAIL_VERIFY_MS: 30 * 60 * 1000,
  PASSWORD_RESET_MS: 30 * 60 * 1000,
  TELEGRAM_LINK_MS: 15 * 60 * 1000,
} as const;

/** Типы Telegram-оповещений и настройки по умолчанию (ТЗ §3.9). */
export const NOTIFY_TYPES = {
  HOMEWORK_RESULT: 'homework_result',
  NEW_LESSON: 'new_lesson',
  ACHIEVEMENT: 'achievement',
  RATING: 'rating',
  MOTIVATION: 'motivation',
} as const;
export type NotifyType = (typeof NOTIFY_TYPES)[keyof typeof NOTIFY_TYPES];

/** Настройки уведомлений по умолчанию: всё включено, тихих часов нет. */
export const DEFAULT_NOTIFY_PREFS = {
  enabled: true,
  homework: true,
  lessons: true,
  achievements: true,
  rating: true,
  motivation: true,
  quietFrom: null as number | null,
  quietTo: null as number | null,
} as const;

/** Требования к паролю (ТЗ §6А.2). */
export const PASSWORD = {
  MIN_LENGTH: 10,
} as const;

/** Загрузка файлов — белый список типов вложений уроков (ТЗ §6А.6). */
export const UPLOAD = {
  ALLOWED_DOC_MIME: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  ],
  ALLOWED_IMAGE_MIME: ['image/png', 'image/jpeg', 'image/webp'],
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
} as const;

/** Геймификация: редкость достижений (ТЗ §3.5). */
export const ACHIEVEMENT_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;
export type AchievementRarity =
  (typeof ACHIEVEMENT_RARITY)[keyof typeof ACHIEVEMENT_RARITY];
