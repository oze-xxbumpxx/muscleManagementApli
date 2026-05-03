import { ExerciseStatsCard } from '@/components/shared/dashboard/ExerciseStatsCard';
import { useToast } from '@/context/ToastContext';
import { useExerciseStats } from '@/hooks/useExerciseStats';
import { useEffect } from 'react';

const DEFAULT_SESSION_COUNT = 5;

export function ExerciseStatsContainer(): React.JSX.Element {
  const { showToast } = useToast();
  const { frequencies, loading, error } = useExerciseStats(DEFAULT_SESSION_COUNT);

  useEffect(() => {
    if (error !== undefined) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  return (
    <ExerciseStatsCard
      frequencies={frequencies}
      loading={loading}
      error={error}
      sessionCount={DEFAULT_SESSION_COUNT}
    />
  );
}
