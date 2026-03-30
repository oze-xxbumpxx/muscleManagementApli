import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TrainingDetailView } from '@/components/shared/training/trainingDetailView';
import { useToast } from '@/context/ToastContext';
import { useTrainingSessionDetail } from '@/hooks/useTrainingSessionDetail';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { parseSessionIdParam } from '@/utils/parseSessionId';

export function TrainingDetailContainer(): React.JSX.Element {
  const { id: idParam } = useParams();
  const sessionId = parseSessionIdParam(idParam);
  const { showToast } = useToast();

  const { session, loading, error } = useTrainingSessionDetail(sessionId);

  useEffect(() => {
    if (error !== undefined) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  if (sessionId === undefined) {
    return <NotFoundPage />;
  }

  return <TrainingDetailView loading={loading} error={error} session={session} />;
}
