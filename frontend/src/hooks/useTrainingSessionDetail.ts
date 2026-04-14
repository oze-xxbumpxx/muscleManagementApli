import { useQuery } from '@apollo/client';
import { TrainingSessionDocument, type TrainingSessionQuery } from '@/graphql/generated/graphql';

export interface UseTrainingSessionDetailResult {
  readonly session: TrainingSessionQuery['trainingSession'];
  readonly loading: boolean;
  readonly error: Error | undefined;
}

export function useTrainingSessionDetail(
  sessionId: number | undefined
): UseTrainingSessionDetailResult {
  const { data, loading, error } = useQuery(TrainingSessionDocument, {
    variables: { id: sessionId ?? 0 },
    skip: sessionId === undefined,
  });

  return {
    session: data?.trainingSession,
    loading,
    error: error ?? undefined,
  };
}
