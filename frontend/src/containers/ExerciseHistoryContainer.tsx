import { ExerciseHistoryChart } from '@/components/exercise/ExerciseHistoryChart';
import { useToast } from '@/context/ToastContext';
import { ChartMode, useExerciseHistory } from '@/hooks/useExerciseHistory';
import { useEffect, useState } from 'react';

export interface ExerciseHistoryContainerProps {
  readonly exerciseName: string;
}

const DEFAULT_HISTORY_LIMIT = 30;

function hasDurationData(entries: readonly { readonly durationSeconds: number | null }[]): boolean {
  return entries.some(entry => entry.durationSeconds !== null);
}

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

  const hasDuration = hasDurationData(entries);
  const hasWeight = hasDuration ? false : hasWeightData(entries);
  const hasReps = hasDuration ? false : hasRepsData(entries);

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
    }

    // 回数データがなくて重量データがある場合は重量モードに切り替える
    if (mode === 'reps' && !hasReps && hasWeight) {
      setMode('weight');
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
