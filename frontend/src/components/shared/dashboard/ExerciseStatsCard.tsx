import { ExerciseConsecutiveCountDocument } from '@/graphql/generated/graphql';
import type { ExerciseFrequency } from '@/hooks/useExerciseStats';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';

export interface ExerciseStatsCardProps {
  readonly frequencies: readonly ExerciseFrequency[];
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly sessionCount: number;
}

interface ExerciseConsecutiveItemProps {
  readonly exerciseName: string;
  readonly frequencyCount: number;
  readonly sessionCount: number;
}
function formatConsecutive(
  loading: boolean,
  error: Error | undefined,
  count: number
): string | null {
  if (loading || error !== undefined) {
    return '-';
  }
  if (count > 0) {
    return `${count}回連続`;
  }
  return null;
}

function ExerciseConsecutiveItem(props: ExerciseConsecutiveItemProps): React.JSX.Element {
  const { data, loading, error } = useQuery(ExerciseConsecutiveCountDocument, {
    variables: { exerciseName: props.exerciseName },
  });

  const consecutiveCount = data?.exerciseConsecutiveCount ?? 0;
  const barPercent =
    props.sessionCount > 0 ? Math.min(100, (props.frequencyCount / props.sessionCount) * 100) : 0;

  return (
    <li className="grid gap-2 border-t border-slate-100 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(120px,180px)_4rem_5rem] sm:items-center">
      <Link
        to={`/exercises/${encodeURIComponent(props.exerciseName)}`}
        className="font-medium text-slate-900 underline hover:text-emerald-700"
      >
        {props.exerciseName}
      </Link>
      <span
        className="h-2 rounded-full bg-slate-100"
        role="progressbar"
        aria-label={`${props.exerciseName}の登場頻度`}
        aria-valuenow={props.frequencyCount}
        aria-valuemin={0}
        aria-valuemax={props.sessionCount}
      >
        <span
          className="block h-2 rounded-full bg-emerald-500"
          style={{ width: `${barPercent}%` }}
          aria-hidden="true"
        />
      </span>
      <span className="text-sm text-slate-600">{props.frequencyCount}回</span>
      <span className="text-sm font-medium text-slate-700">
        {formatConsecutive(loading, error, consecutiveCount)}
      </span>
    </li>
  );
}

export function ExerciseStatsCard(props: ExerciseStatsCardProps): React.JSX.Element {
  if (props.loading) {
    return <p className="text-slate-600">読み込み中...</p>;
  }

  if (props.error !== undefined) {
    return <p className="text-slate-600">データを取得できませんでした。</p>;
  }

  return (
    <section
      aria-labelledby="exercise-stats-heading"
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 id="exercise-stats-heading" className="text-lg font-semibold text-slate-900">
        直近{props.sessionCount}回の種目傾向
      </h2>

      {props.frequencies.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">記録がありません</p>
      ) : (
        <ul className="mt-4">
          {props.frequencies.map(item => (
            <ExerciseConsecutiveItem
              key={item.exerciseName}
              exerciseName={item.exerciseName}
              frequencyCount={item.count}
              sessionCount={props.sessionCount}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
