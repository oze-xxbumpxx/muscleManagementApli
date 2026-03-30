import { TrainingDetailContainer } from '@/containers/TrainingDetailContainer';

export function SessionDetailPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        記録詳細
      </h1>
      <div className="mt-6">
        <TrainingDetailContainer />
      </div>
    </div>
  );
}
