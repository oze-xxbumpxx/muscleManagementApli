import { RecentExerciseFrequencyDocument } from '@/graphql/generated/graphql';
import type { RecentExerciseFrequencyQuery } from '@/graphql/generated/graphql';
import { useQuery } from '@apollo/client';

type QueryExerciseFrequency = RecentExerciseFrequencyQuery['recentExerciseFrequency'][number];

export interface ExerciseFrequency {
  readonly exerciseName: string;
  readonly count: number;
}

export interface UseExerciseStatsResult {
  readonly frequencies: readonly ExerciseFrequency[];
  readonly loading: boolean;
  readonly error: Error | undefined;
}

const EMPTY_FREQUENCIES: readonly ExerciseFrequency[] = [];

function toExerciseFrequency(item: QueryExerciseFrequency): ExerciseFrequency {
  return {
    exerciseName: item.exerciseName,
    count: item.count,
  };
}

export function useExerciseStats(sessionCount?: number): UseExerciseStatsResult {
  const { data, loading, error } = useQuery(RecentExerciseFrequencyDocument, {
    variables: { sessionCount },
  });

  return {
    frequencies: data?.recentExerciseFrequency.map(toExerciseFrequency) ?? EMPTY_FREQUENCIES,
    loading,
    error: error ?? undefined,
  };
}
