/** Публичный API фичи telegram (ARCHITECTURE.md §1). */
export {
  getPrefs,
  handleWebhookUpdate,
  notifyHomeworkResult,
  notifyStaffHomeworkNeedsWork,
  notify,
} from './service';
export type { ConnectInfo } from './service';
export {
  connectTelegramAction,
  disconnectTelegramAction,
  saveNotifyPrefsAction,
} from './actions';
export { TelegramSection } from './components/TelegramSection';
export type { NotifyPrefs } from '@/lib/notify-prefs';
