import { StreakInfoCard } from '@/components/shared/dashboard/StreakInfoCard';
import { useToast } from '@/context/ToastContext';
import { useStreakInfo } from '@/hooks/useStreakInfo';
import { useEffect } from 'react';

export function StreakInfoContainer(): React.JSX.Element {
  const { showToast } = useToast();
  const { currentStreak, longestStreak, thisMonthCount, loading, error } = useStreakInfo();

  useEffect(() => {
    if (error !== undefined) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  return (
    <StreakInfoCard
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      thisMonthCount={thisMonthCount}
      loading={loading}
      error={error}
    />
  );
}
