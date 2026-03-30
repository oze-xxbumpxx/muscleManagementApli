import type { TrainingSessionQuery } from '@/graphql/generated/graphql';

type TrainingSessionDetailModel = NonNullable<
  TrainingSessionQuery['trainingSession']
>;

export interface TrainingSessionDetailProps {
  readonly session: TrainingSessionDetailModel;
}

export function TrainingSessionDetail(
  props: TrainingSessionDetailProps
): React.JSX.Element {
  const { session } = props;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{session.date}</h2>
        {session.bodyWeight != null && (
          <p className="mt-1 text-sm text-slate-600">
            体重: {session.bodyWeight} kg
          </p>
        )}
        {session.notes != null && session.notes !== '' && (
          <p className="mt-2 text-sm text-slate-700">{session.notes}</p>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-800">種目</h3>
        <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {session.exercises.map(ex => (
            <li key={ex.id} className="px-4 py-3 text-sm">
              <span className="font-medium text-slate-900">{ex.exerciseName}</span>
              <span className="ml-2 text-slate-600">
                {ex.sets} セット
                {ex.reps != null && ` · ${ex.reps} 回`}
                {ex.durationSeconds != null && ` · ${ex.durationSeconds} 秒`}
                {ex.weight != null && ` · ${ex.weight} kg`}
              </span>
              {ex.notes != null && ex.notes !== '' && (
                <p className="mt-1 text-slate-600">{ex.notes}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
