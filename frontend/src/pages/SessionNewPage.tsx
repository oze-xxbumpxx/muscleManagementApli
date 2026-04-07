import { TrainingSessionCreateContainer } from '@/containers/TrainingSessionCreateContainer';

export function SessionNewPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">記録を追加</h1>
      <TrainingSessionCreateContainer />
    </div>
  );
}
