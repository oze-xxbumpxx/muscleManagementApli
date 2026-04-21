import { TrainingDaysInMonthDocument, TrainingDaysInMonthQuery } from '@/graphql/generated/graphql';
import { useQuery } from '@apollo/client';

type QueryTrainingDay = TrainingDaysInMonthQuery['trainingDaysInMonth'][number];

export interface TrainingDay {
  readonly date: string;
  readonly exerciseCount: number;
}

export interface UseTrainingDaysInMonthResult {
  readonly trainingDays: readonly TrainingDay[];
  readonly loading: boolean;
  readonly error: Error | undefined;
}

const EMPTY_TRAINING_DAYS: readonly TrainingDay[] = [];

function toTrainingDay(day: QueryTrainingDay): TrainingDay {
  return {
    date: day.date,
    exerciseCount: day.exerciseCount,
  };
}

export function useTrainingDaysInMonth(year: number, month: number): UseTrainingDaysInMonthResult {
  const { data, loading, error } = useQuery(TrainingDaysInMonthDocument, {
    variables: { year, month },
  });
  return {
    trainingDays: data?.trainingDaysInMonth.map(toTrainingDay) ?? EMPTY_TRAINING_DAYS,
    loading,
    error: error ?? undefined,
  };
}
