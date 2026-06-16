/** Публичный API фичи profile (ARCHITECTURE.md §1). */
export { getProfile, exportData } from './service';
export type { ProfileData } from './service';
export {
  updateProfileAction,
  changePasswordAction,
  deleteAccountAction,
  type ProfileState,
} from './actions';
export {
  ProfileForm,
  ChangePasswordForm,
  RatingVisibilityToggle,
  DeleteAccount,
} from './components/ProfileForms';
