/** Публичный API фичи homework (ARCHITECTURE.md §1). */
export { getHistory, hasSubmittedHomework } from './service';
export type { SubmitResult, HomeworkHistoryItem } from './service';
export { submitHomeworkAction, type HomeworkState } from './actions';
export { HomeworkBlock } from './components/HomeworkBlock';
