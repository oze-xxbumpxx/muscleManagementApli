import { ExerciseFormRow } from '@/hooks/useCreateTrainingSessionForm';

export interface TrainingSessionCreateFormProps {
  readonly date: string;
  readonly onDateChange: (value: string) => void;
  readonly bodyWeight: string;
  readonly onBodyWeightChange: (value: string) => void;
  readonly notes: string;
  readonly onNotesChange: (value: string) => void;
  readonly exerciseRows: readonly ExerciseFormRow[];
  readonly onAddExerciseRow: () => void;
  readonly onRemoveExercise: (clientId: string) => void;
  readonly onExerciseChange: (
    clientId: string,
    patch: Partial<Omit<ExerciseFormRow, 'clientId'>>
  ) => void;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
}

const inputCls =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

function err(path: string, m: Readonly<Record<string, string>>): string | undefined {
  return m[path];
}

export function TrainingSessionCreateForm(
  props: TrainingSessionCreateFormProps
): React.JSX.Element {}
