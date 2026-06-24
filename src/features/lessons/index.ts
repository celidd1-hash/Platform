/** Публичный API фичи lessons (ARCHITECTURE.md §1). */
export { getLessonForUser, getFileDownload, getLessonStreamUrl } from './service';
export type { LessonView, LessonAccess, LessonNeighbor, WatchResult, FileDownload } from './service';
export { saveProgressAction, markWatchedAction } from './actions';
export { LessonVideo } from './components/LessonVideo';
export { LessonStage } from './components/LessonStage';
export { LessonFiles } from './components/LessonFiles';
export { LessonNav } from './components/LessonNav';
