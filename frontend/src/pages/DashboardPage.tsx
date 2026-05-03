import { ExerciseStatsContainer } from '@/containers/ExerciseStatsContainer';
import { StreakInfoContainer } from '@/containers/StreakInfoContainer';
import { TrainingCalendarContainer } from '@/containers/TrainingCalendarContainer';

export function DashboardPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">ダッシュボード</h1>
      <div className="mt-6 grid gap-6">
        <StreakInfoContainer />
        <TrainingCalendarContainer />
        <ExerciseStatsContainer />
      </div>
    </div>
  );
}
