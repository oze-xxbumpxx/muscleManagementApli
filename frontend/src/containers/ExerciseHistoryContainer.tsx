import { ExerciseHistoryChart } from '@/components/shared/exercise/ExerciseHistoryChart';
import { useToast } from '@/context/ToastContext';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import type { ChartMode } from '@/hooks/useExerciseHistory';

import { useEffect, useState } from 'react';

export interface ExerciseHistoryContainerProps {
  readonly exerciseName: string;
}

const DEFAULT_HISTORY_LIMIT = 30;

function hasWeightData(entries: readonly { readonly weight: number | null }[]): boolean {
  return entries.some(entry => entry.weight !== null);
}

function hasRepsData(entries: readonly { readonly reps: number | null }[]): boolean {
  return entries.some(entry => entry.reps !== null);
}

export function ExerciseHistoryContainer(props: ExerciseHistoryContainerProps): React.JSX.Element {
  const { showToast } = useToast();
  const { entries, loading, error } = useExerciseHistory(props.exerciseName, DEFAULT_HISTORY_LIMIT);
  const [mode, setMode] = useState<ChartMode>('weight');

  const hasWeight = hasWeightData(entries);
  const hasReps = hasRepsData(entries);

  useEffect(() => {
    if (error !== undefined) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasWeight && !hasReps) {
      return;
    }

    // 重量データがなくて回数データがある場合は回数モードに切り替える
    if (mode === 'weight' && !hasWeight && hasReps) {
      setMode('reps');
      return;
    }

    // 回数データがなくて重量データがある場合は重量モードに切り替える
    if (mode === 'reps' && !hasReps && hasWeight) {
      setMode('weight');
      return;
    }
  }, [hasReps, hasWeight, loading, mode]);

  return (
    <ExerciseHistoryChart
      entries={entries}
      mode={mode}
      onModeChange={setMode}
      hasWeightData={hasWeight}
      hasRepsData={hasReps}
      loading={loading}
      error={error}
    />
  );
}
