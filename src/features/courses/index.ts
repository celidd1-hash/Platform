/** Публичный API фичи courses (ARCHITECTURE.md §1). */
export { getCatalog, getCoursePage, getModulePage } from './service';
export type {
  CatalogCourse,
  CatalogStatus,
  CoursePageData,
  CoursePageModule,
  CoursePageLesson,
  ModulePageData,
} from './service';
export { CourseCard } from './components/CourseCard';
export { CourseProgram } from './components/CourseProgram';
export { ModuleLessons } from './components/ModuleLessons';
