import { Link } from 'react-router-dom';
import { TrainingSessionsQuery } from '../../../graphql/generated/graphql';

type TrainingSessionListItem = TrainingSessionsQuery['trainingSessions']['items'][number];

export interface TrainingListProps {
  readonly items: ReadonlyArray<Pick<TrainingSessionListItem, 'id' | 'date' | 'exercises'>>;
  readonly loading: boolean;
}

export function TrainingList(props: TrainingListProps): React.JSX.Element {
  if (props.loading) {
    return <p className="text-slate-600">読み込み中...</p>;
  }
  if (props.items.length === 0) {
    return (
      <p className="text-slate-600">
        記録がありません。{''}
        <Link to="/sessions/new" className="font-medium text-slate-900 underline">
          新規作成
        </Link>
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-200 rouded-lg border border-slate-200 bg-white">
      {props.items.map(session => (
        <li key={session.id} className="px-4 py-3">
          <Link
            to={`/sessions/${session.id}`}
            className="font-medium text-slate-900 hover:underline"
          >
            {session.date}
          </Link>
          <span className="ml-2 text-sm text-slate-500">{session.exercises.length} 種目</span>
        </li>
      ))}
    </ul>
  );
}
