import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useCreateTrainingSessionForm } from '@/hooks/useCreateTrainingSessionForm';
import { useCallback } from 'react';
import { TrainingSessionCreateForm } from '@/components/trainingSessionCreateForm';

export function TrainingSessionCreateContainer(): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const form = useCreateTrainingSessionForm();

  const onSubmit = useCallback(async () => {
    try {
      const result = await form.submit();
      if (result === undefined) {
        return;
      }
      showToast('記録を保存しました', 'success');
      navigate(`/sessions`);
    } catch (e) {
      const message = e instanceof Error ? e.message : '保存に失敗しました';
      showToast(message, 'error');
    }
  }, [form, navigate, showToast]);

  return (
    <TrainingSessionCreateForm
      date={form.date}
      onDateChange={form.setDate}
      bodyWeight={form.bodyWeight}
      onBodyWeightChange={form.setBodyWeight}
      notes={form.notes}
      onNotesChange={form.setNotes}
      exerciseRows={form.exerciseRows}
      onAddExercise={form.addExerciseRow}
      onRemoveExercise={form.removeExerciseRow}
      onExerciseChange={form.updateExerciseRow}
      fieldErrors={form.fieldErrors}
      onSubmit={() => {
        void onSubmit();
      }}
      submitting={form.submitting}
    />
  );
}
