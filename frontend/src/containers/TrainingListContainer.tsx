import { useEffect } from 'react';
import { useToast } from '../context/ToastContext.js';
import { useTrainingSessions } from '../hooks/useTrainingSessions.js';
import { TrainingList } from '../components/shared/training/trainingList.js';

export function TrainingListContainer(): React.JSX.Element {
  const { showToast } = useToast();
  const { items, totalCount, loading, error } = useTrainingSessions();

  useEffect(() => {
    if (error !== undefined) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">全{totalCount}件</p>
      <TrainingList items={items} loading={loading} />
    </div>
  );
}
