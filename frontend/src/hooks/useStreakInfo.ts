import { StreakInfoDocument } from '@/graphql/generated/graphql';
import { useQuery } from '@apollo/client';

export interface UseStreakInfoResult {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly thisMonthCount: number;
  readonly loading: boolean;
  readonly error: Error | undefined;
}

export function useStreakInfo(): UseStreakInfoResult {
  const { data, loading, error } = useQuery(StreakInfoDocument);

  return {
    currentStreak: data?.streakInfo.currentStreak ?? 0,
    longestStreak: data?.streakInfo.longestStreak ?? 0,
    thisMonthCount: data?.streakInfo.thisMonthCount ?? 0,
    loading,
    error: error ?? undefined,
  };
}
