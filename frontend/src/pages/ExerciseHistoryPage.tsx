import { ExerciseHistoryContainer } from '@/containers/ExerciseHistoryContainer';
import { useParams } from 'react-router-dom';

function decodeExerciseName(name: string | undefined): string {
  if (name === undefined) {
    return '';
  }

  try {
    return decodeURIComponent(name);
  } catch (error) {
    console.warn('decodeURIComponent failed', error);
    return name;
  }
}

export function ExerciseHistoryPage(): React.JSX.Element {
  const { name } = useParams();
  const decoded = decodeExerciseName(name);
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {decoded.length > 0 ? `${decoded}の推移` : '種目の推移'}
      </h1>
      <div className="mt-6">
        <ExerciseHistoryContainer exerciseName={decoded} />
      </div>
    </div>
  );
}
