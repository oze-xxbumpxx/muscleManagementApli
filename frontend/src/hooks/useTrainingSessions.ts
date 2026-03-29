import { TrainingSessionsDocument, TrainingSessionsQuery } from '@/graphql/generated/graphql';
import { useQuery } from '@apollo/client';

const DEFAULT_LIMIT = 20;

export interface UseTrainingSessionsOptions {
  readonly limit?: number;
  readonly offset?: number;
}

export interface UseTrainingSessionResult {
  readonly items: TrainingSessionsQuery['trainingSessions']['items'];
  readonly totalCount: number;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly refetch: () => Promise<unknown>;
}

export function useTrainingSessions(
  options: UseTrainingSessionsOptions = {}
): UseTrainingSessionResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const offset = options.offset ?? 0;

  const { data, loading, error, refetch } = useQuery(TrainingSessionsDocument, {
    variables: { limit, offset },
  });
  const list = data?.trainingSessions;

  return {
    items: list?.items ?? [],
    totalCount: list?.totalCount ?? 0,
    loading,
    error: error ?? undefined,
    refetch,
  };
}
