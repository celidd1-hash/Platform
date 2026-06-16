/**
 * Публичный API фичи auth (ARCHITECTURE.md §1). Наружу торчит ТОЛЬКО этот файл.
 * Внутренности (queries, service) — приватны.
 *
 * Прим.: config.ts импортируется напрямую только из middleware (edge-bundle),
 * поэтому здесь его не реэкспортируем, чтобы не тянуть node-зависимости в edge.
 */
export { handlers, auth, signIn, signOut } from './auth';
export {
  registerAction,
  loginAction,
  logoutAction,
  requestResetAction,
  resetPasswordAction,
  type FormState,
} from './actions';
export { verifyEmail, getTwoFactorStatus } from './service';
export {
  startTwoFactorAction,
  confirmTwoFactorAction,
  disableTwoFactorAction,
} from './actions';
export { TwoFactorSetup } from './components/TwoFactorSetup';

// UI-формы фичи (рендерятся серверными страницами app/(auth)).
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { RequestResetForm } from './components/RequestResetForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export { SignOutButton } from './components/SignOutButton';
