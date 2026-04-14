import { TrainingSessionEditForm } from '@/components/shared/training/TrainingSessionEditForm';
import { useToast } from '@/context/ToastContext';
import { useTrainingSessionDetail } from '@/hooks/useTrainingSessionDetail';
import { useUpdateTrainingSessionForm } from '@/hooks/useUpdateTrainingSessionForm';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { parseSessionIdParam } from '@/utils/parseSessionId';
import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function TrainingSessionEditContainer(): React.JSX.Element {
  const { id: idParam } = useParams();
  const sessionId = parseSessionIdParam(idParam);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { session, loading, error } = useTrainingSessionDetail(sessionId);

  const form = useUpdateTrainingSessionForm(sessionId, session);

  useEffect(() => {
    if (error !== undefined) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  const onSubmit = useCallback(async () => {
    if (sessionId === undefined) {
      return;
    }
    try {
      const result = await form.submit();
      if (result === undefined) {
        return;
      }
      showToast('保存しました', 'success');
      navigate(`/sessions/${sessionId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : '保存に失敗しました';
      showToast(message, 'error');
    }
  }, [form, navigate, sessionId, showToast]);

  if (sessionId === undefined) {
    return <NotFoundPage />;
  }

  if (loading) {
    return <p className="text-slate-600">読み込み中...</p>;
  }

  if (session === null || session === undefined) {
    return <p className="text-slate-600">記録が見つかりません</p>;
  }

  return (
    <TrainingSessionEditForm
      date={form.date}
      onDateChange={form.setDate}
      bodyWeight={form.bodyWeight}
      onBodyWeightChange={form.setBodyWeight}
      notes={form.notes}
      onNotesChange={form.setNotes}
      fieldErrors={form.fieldErrors}
      onSubmit={() => {
        void onSubmit();
      }}
      submitting={form.submitting}
    />
  );
}
