/** Публичный API фичи gamification (ARCHITECTURE.md §1). */

// Хуки начисления — вызываются из lessons/homework при зачёте.
export { onLessonCompleted, onHomeworkPassed } from './service';

// Чтение для страниц.
export { getSummary, getAchievementsPage, getLeaderboard } from './service';
export type {
  GamificationSummary,
  AchievementsPage,
  AchievementView,
  LeaderboardRow,
  LeaderboardPeriod,
} from './service';

export { setRatingVisibilityAction } from './actions';

export { AchievementsGrid } from './components/AchievementsGrid';
export { Leaderboard } from './components/Leaderboard';
