import { TrainingSessionEditContainer } from '@/containers/TrainingSessionEditContainer';

export function SessionEditPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">記録を編集</h1>
      <div className="mt-6">
        <TrainingSessionEditContainer />
      </div>
    </div>
  );
}
