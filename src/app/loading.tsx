import { LoadingScreen } from '@/components/ui/LoadingScreen';

/**
 * Глобальный экран загрузки (Next App Router): автоматически показывается при переходе
 * на любую вкладку, пока грузится её серверный контент. Ближайший loading.tsx по сегменту.
 */
export default function Loading() {
  return <LoadingScreen />;
}
