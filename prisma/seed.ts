/**
 * Seed-данные SVETOZAR SCHOOL (ARCHITECTURE.md §1, ТЗ §3.2).
 * Идемпотентно (upsert по уникальным ключам) — можно запускать повторно.
 *
 * ВНИМАНИЕ: пароль админа берётся из SEED_ADMIN_PASSWORD; для прод-запуска
 * перед security-gate тестовые/seed-аккаунты удаляются (ТЗ §6А.14).
 */
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { slugify } from '../src/lib/utils';

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@svetozar.school';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe_2026!';
const STUDENT_EMAIL = 'student@svetozar.school';
const STUDENT_PASSWORD = 'Student_2026!';

type LessonSeed = { title: string; summary: string; content: string };
type ModuleSeed = { title: string; lessons: LessonSeed[] };
type CourseSeed = {
  title: string;
  description: string;
  durationWeeks: number;
  modules: ModuleSeed[];
};

const COURSES: CourseSeed[] = [
  {
    title: 'Я Целитель',
    description:
      'Авторский курс о пробуждении внутренней силы исцеления: работа с энергией, телом и сознанием.',
    durationWeeks: 8,
    modules: [
      {
        title: 'Модуль 1. Основы',
        lessons: [
          {
            title: 'Введение в целительство',
            summary: 'Что такое целительство и с чего начинается путь.',
            content:
              '## Введение\n\nВ этом уроке мы знакомимся с основными понятиями. Целительство — это **осознанная работа** с собственной энергией.',
          },
          {
            title: 'Энергия и намерение',
            summary: 'Роль намерения в практике целителя.',
            content:
              '## Энергия и намерение\n\nНамерение направляет энергию. Практика концентрации — основа дальнейшей работы.',
          },
        ],
      },
      {
        title: 'Модуль 2. Практика',
        lessons: [
          {
            title: 'Первая практика заземления',
            summary: 'Базовая техника заземления и центрирования.',
            content: '## Заземление\n\nПошаговая практика для устойчивого состояния.',
          },
        ],
      },
    ],
  },
  {
    title: 'Погружение в прошлые жизни',
    description:
      'Курс по методу Долорес Кэннон: регрессия, работа с подсознанием и интеграция опыта прошлых жизней.',
    durationWeeks: 6,
    modules: [
      {
        title: 'Модуль 1. Подготовка',
        lessons: [
          {
            title: 'Метод Долорес Кэннон',
            summary: 'Обзор метода квантового исцеления (QHHT).',
            content:
              '## Метод QHHT\n\nКраткий обзор подхода Долорес Кэннон и принципов работы с подсознанием.',
          },
          {
            title: 'Состояние транса',
            summary: 'Как достигается рабочее состояние для регрессии.',
            content: '## Транс\n\nБезопасное погружение и выход из состояния.',
          },
        ],
      },
    ],
  },
];

const ACHIEVEMENTS = [
  {
    code: 'first_lesson',
    title: 'Первый шаг',
    description: 'Пройдите свой первый урок',
    icon: '🌱',
    category: 'Обучение',
    rarity: 'common',
    xpReward: 20,
    conditionJson: { type: 'lesson_completed', threshold: 1 },
    targetValue: 1,
    position: 1,
  },
  {
    code: 'first_module',
    title: 'Завершитель модуля',
    description: 'Завершите первый модуль курса',
    icon: '📿',
    category: 'Обучение',
    rarity: 'rare',
    xpReward: 50,
    conditionJson: { type: 'module_completed', threshold: 1 },
    targetValue: 1,
    position: 2,
  },
  {
    code: 'streak_7',
    title: 'Семь дней пути',
    description: 'Серия активности 7 дней подряд',
    icon: '🔥',
    category: 'Социальное',
    rarity: 'epic',
    xpReward: 100,
    conditionJson: { type: 'streak_days', threshold: 7 },
    targetValue: 7,
    position: 3,
  },
  {
    code: 'homework_master',
    title: 'Мастер конспектов',
    description: 'Получите 10 зачтённых ДЗ',
    icon: '✍️',
    category: 'Обучение',
    rarity: 'rare',
    xpReward: 80,
    conditionJson: { type: 'homework_passed', threshold: 10 },
    targetValue: 10,
    position: 4,
  },
];

const KB_ARTICLES = [
  {
    category: 'Обучение',
    title: 'Как проходить уроки',
    icon: '📖',
    steps: 3,
    description: 'Просмотр видео, конспект, переход к следующему уроку.',
    bodyMd: '1. Смотрите видео урока.\n2. Напишите конспект и отправьте на проверку.\n3. После зачёта откроется следующий урок.',
    position: 1,
  },
  {
    category: 'AI-инструменты',
    title: 'Как работает проверка ДЗ',
    icon: '🤖',
    steps: 2,
    description: 'ИИ-наставник проверяет ваш конспект по базе знаний курса.',
    bodyMd: 'Напишите краткое содержание усвоенного. Наставник оценит понимание и даст обратную связь.',
    position: 2,
  },
  {
    category: 'Аккаунт',
    title: 'Подключение Telegram',
    icon: '✈️',
    steps: 2,
    description: 'Получайте результаты ДЗ и напоминания в Telegram.',
    bodyMd: 'В профиле нажмите «Подключить Telegram» и перейдите к боту по ссылке.',
    position: 3,
  },
];

async function seedUsers() {
  const [adminHash, studentHash] = await Promise.all([
    hashPassword(ADMIN_PASSWORD),
    hashPassword(STUDENT_PASSWORD),
  ]);

  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: Role.admin },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      name: 'Администратор',
      role: Role.admin,
      emailVerifiedAt: new Date(),
    },
  });

  const student = await db.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {},
    create: {
      email: STUDENT_EMAIL,
      passwordHash: studentHash,
      name: 'Демо Ученик',
      role: Role.student,
      emailVerifiedAt: new Date(),
    },
  });

  return { admin, student };
}

async function seedCourses(adminId: string, studentId: string) {
  for (const course of COURSES) {
    const slug = slugify(course.title);
    const created = await db.course.upsert({
      where: { slug },
      update: { description: course.description, isPublished: true },
      create: {
        title: course.title,
        slug,
        description: course.description,
        durationWeeks: course.durationWeeks,
        isStrictOrder: true,
        isPublished: true,
        aiSettings: { create: { passScore: 70, strictness: 'normal' } },
      },
    });

    // База знаний курса для проверки ДЗ (ТЗ §3.4). Идемпотентно по (course,title).
    const kbTitle = `Тезисы курса «${course.title}»`;
    const kbExisting = await db.aiKnowledge.findFirst({
      where: { courseId: created.id, title: kbTitle },
    });
    if (!kbExisting) {
      await db.aiKnowledge.create({
        data: {
          courseId: created.id,
          title: kbTitle,
          contentMd: `Базовые тезисы курса «${course.title}». Ученик должен показать понимание ключевых идей уроков своими словами, привести связь с практикой и не просто пересказать, а отрефлексировать материал.`,
        },
      });
    }

    // Модули и уроки. Идемпотентность по (course, position) и (module, position).
    for (const [mIdx, mod] of course.modules.entries()) {
      const moduleRow = await db.module.upsert({
        where: { id: `${slug}-m${mIdx}` },
        update: { title: mod.title, position: mIdx },
        create: { id: `${slug}-m${mIdx}`, courseId: created.id, title: mod.title, position: mIdx },
      });

      for (const [lIdx, lesson] of mod.lessons.entries()) {
        await db.lesson.upsert({
          where: { id: `${slug}-m${mIdx}-l${lIdx}` },
          update: { title: lesson.title, lessonSummaryMd: lesson.summary, contentMd: lesson.content },
          create: {
            id: `${slug}-m${mIdx}-l${lIdx}`,
            moduleId: moduleRow.id,
            title: lesson.title,
            position: lIdx,
            lessonSummaryMd: lesson.summary,
            contentMd: lesson.content,
            requiresNote: true,
            xpReward: 50,
          },
        });
      }
    }

    // Демо-ученику выдаём доступ к первому курсу (enrollment вручную, ТЗ §3.2).
    if (course === COURSES[0]) {
      await db.enrollment.upsert({
        where: { userId_courseId: { userId: studentId, courseId: created.id } },
        update: { status: 'active' },
        create: { userId: studentId, courseId: created.id, grantedById: adminId, status: 'active' },
      });
    }
  }
}

async function seedAchievements() {
  for (const a of ACHIEVEMENTS) {
    await db.achievement.upsert({ where: { code: a.code }, update: a, create: a });
  }
}

async function seedKb() {
  for (const article of KB_ARTICLES) {
    // Нет натурального уникального ключа — ищем по (category, title).
    const existing = await db.kbArticle.findFirst({
      where: { category: article.category, title: article.title },
    });
    if (existing) {
      await db.kbArticle.update({ where: { id: existing.id }, data: article });
    } else {
      await db.kbArticle.create({ data: article });
    }
  }
}

async function main() {
  const { admin, student } = await seedUsers();
  await seedCourses(admin.id, student.id);
  await seedAchievements();
  await seedKb();
  console.log('✅ Seed завершён.');
  console.log(`   Админ:  ${ADMIN_EMAIL}`);
  console.log(`   Ученик: ${STUDENT_EMAIL}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed упал:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
