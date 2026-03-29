import { TrainingListContainer } from '@/containers/TrainingListContainer';

export function SessionListPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">トレーニングの記録</h1>
      <div className="mt-6">
        <TrainingListContainer />
      </div>
    </div>
  );
}
