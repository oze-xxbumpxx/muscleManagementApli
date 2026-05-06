import { ExerciseHistoryDocument } from '@/graphql/generated/graphql';
import type { ExerciseHistoryQuery } from '@/graphql/generated/graphql';

import { useQuery } from '@apollo/client';

type QueryExerciseHistoryEntry = ExerciseHistoryQuery['exerciseHistory'][number];

export type ChartMode = 'weight' | 'reps';

export interface ExerciseHistoryEntry {
  readonly date: string;
  readonly exerciseName: string;
  readonly weight: number | null;
  readonly reps: number | null;
  readonly durationSeconds: number | null;
  readonly sets: number;
  readonly bodyWeight: number | null;
}

export interface UseExerciseHistoryResult {
  readonly entries: readonly ExerciseHistoryEntry[];
  readonly loading: boolean;
  readonly error: Error | undefined;
}

const EMPTY_ENTRIES: readonly ExerciseHistoryEntry[] = [];

function toExerciseHistoryEntry(item: QueryExerciseHistoryEntry): ExerciseHistoryEntry {
  return {
    date: item.date,
    exerciseName: item.exerciseName,
    weight: item.weight ?? null,
    reps: item.reps ?? null,
    durationSeconds: item.durationSeconds ?? null,
    sets: item.sets,
    bodyWeight: item.bodyWeight ?? null,
  };
}

export function useExerciseHistory(exerciseName: string, limit?: number): UseExerciseHistoryResult {
  const normalizedName = exerciseName.trim();
  const { data, loading, error } = useQuery(ExerciseHistoryDocument, {
    variables: { exerciseName: normalizedName, limit },
    skip: normalizedName.length === 0,
  });

  return {
    entries: data?.exerciseHistory.map(toExerciseHistoryEntry) ?? EMPTY_ENTRIES,
    loading,
    error: error ?? undefined,
  };
}
