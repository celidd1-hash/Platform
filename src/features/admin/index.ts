/** Публичный API админ-фичи (ARCHITECTURE.md §1). */
export { requireAdmin, requireAdminWith2FA } from './guard';
export { getCoursesTree } from './service';
export type { AdminCourseNode, ImpactSummary, TargetType } from './service';
export { archiveAction, deleteForeverAction, impactAction } from './actions';
export type { SetArchivedResult, DeleteResult } from './types';
export { CourseManager } from './components/CourseManager';
export { AdminNav } from './components/AdminNav';

// Дашборд
export { getDashboard } from './stats';
export type { DashboardData } from './stats';

// Кабинеты учеников
export { listStudents, getStudentCabinet } from './students';
export type { StudentRow, StudentCabinet } from './students';
export { BlockToggle, AccessToggle, DeleteStudentButton, RestoreStudentButton } from './components/StudentControls';

// Обучение ИИ-агента
export { getAiTraining } from './ai-training';
export type { AiTrainingData } from './ai-training';
export { AiTrainingPanel } from './components/AiTrainingPanel';

// Проверка ДЗ
export { getHomeworkReview } from './homework-review';
export type { HomeworkReviewData, HomeworkReviewItem } from './homework-review';
export { HomeworkReviewCard } from './components/HomeworkReviewCard';

// Достижения (CRUD)
export { listForAdmin } from './achievements-admin';
export type { AdminAchievement } from './achievements-admin';
export { AchievementsAdmin } from './components/AchievementsAdmin';

// Интеграции (ключи сервисов)
export { getIntegrations } from './integrations';
export type { IntegrationView } from './integrations';
export { IntegrationsPanel } from './components/IntegrationsPanel';

// CRUD структуры курсов
export { getCourseEditor, getLessonEditor } from './course-edit';
export { CourseForm } from './components/CourseForm';
export type { CourseFormValues } from './components/CourseForm';
export { StructureEditor } from './components/StructureEditor';
export type { EditorModule } from './components/StructureEditor';
export { LessonForm } from './components/LessonForm';
export type { LessonFormValues } from './components/LessonForm';
export { LessonFilesEditor } from './components/LessonFilesEditor';
export type { EditorLessonFile } from './components/LessonFilesEditor';
